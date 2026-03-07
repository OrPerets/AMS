import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InvoiceStatus, Role as PrismaRole, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { Role } from '../auth/roles.decorator';
import { ImpersonateDto } from './dto/impersonate.dto';

@Injectable()
export class AdminService {
  constructor(private jwt: JwtService, private prisma: PrismaService) {}

  async overview() {
    const [openTickets, unpaidInvoices, users, buildings, recentImpersonationEvents, recentNotifications, userRoleCounts] =
      await Promise.all([
        this.prisma.ticket.count({ where: { status: { not: TicketStatus.RESOLVED } } }),
        this.prisma.invoice.count({ where: { status: InvoiceStatus.UNPAID } }),
        this.prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            role: true,
            tenantId: true,
            phone: true,
            createdAt: true,
          },
          take: 12,
        }),
        this.prisma.building.count(),
        this.prisma.impersonationEvent.findMany({
          orderBy: { createdAt: 'desc' },
          take: 8,
        }),
        this.prisma.notification.findMany({
          orderBy: { createdAt: 'desc' },
          take: 8,
          select: {
            id: true,
            title: true,
            message: true,
            type: true,
            userId: true,
            buildingId: true,
            createdAt: true,
            read: true,
          },
        }),
        this.prisma.user.groupBy({
          by: ['role'],
          _count: { _all: true },
        }),
      ]);

    const roleCounts = Object.values(PrismaRole).reduce(
      (acc, roleName) => ({ ...acc, [roleName]: 0 }),
      {} as Record<string, number>,
    );
    for (const entry of userRoleCounts) {
      roleCounts[entry.role] = entry._count._all;
    }

    return {
      stats: {
        totalUsers: await this.prisma.user.count(),
        totalBuildings: buildings,
        openTickets,
        unpaidInvoices,
        activeTechs: await this.prisma.user.count({ where: { role: PrismaRole.TECH } }),
      },
      health: {
        database: 'connected',
        auth: 'healthy',
        notifications: 'healthy',
      },
      roleCounts,
      users,
      recentImpersonationEvents,
      recentNotifications,
      navigation: [
        { label: 'התראות מנהל', href: '/admin/notifications' },
        { label: 'חשבוניות ממתינות', href: '/admin/unpaid-invoices' },
        { label: 'הגדרות משתמש', href: '/settings' },
      ],
    };
  }

  async impersonate(user: any, dto: ImpersonateDto, ip: string, userAgent: string) {
    if (dto.role === Role.MASTER || !Object.values(Role).includes(dto.role)) {
      throw new BadRequestException('Invalid role');
    }
    const payload = {
      sub: user.sub,
      email: user.email,
      role: user.role,
      actAsRole: dto.role,
      tenantId: dto.tenantId,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'secret',
      expiresIn: '30m',
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      expiresIn: '30m',
    });
    await this.prisma.impersonationEvent.create({
      data: {
        masterUserId: user.sub,
        action: 'START',
        targetRole: dto.role,
        tenantId: dto.tenantId,
        reason: dto.reason,
        ip,
        userAgent,
      },
    });
    return { accessToken, refreshToken };
  }

  async stopImpersonation(user: any, ip: string, userAgent: string) {
    const payload = {
      sub: user.sub,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'secret',
      expiresIn: '15m',
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      expiresIn: '7d',
    });
    await this.prisma.impersonationEvent.create({
      data: {
        masterUserId: user.sub,
        action: 'STOP',
        targetRole: user.actAsRole,
        tenantId: user.tenantId,
        ip,
        userAgent,
      },
    });
    return { accessToken, refreshToken };
  }
}

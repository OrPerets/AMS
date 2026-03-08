import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ActivitySeverity, CollectionStatus, InvoiceStatus, Role as PrismaRole, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { Role } from '../auth/roles.decorator';
import { ImpersonateDto } from './dto/impersonate.dto';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class AdminService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
    private activityLog: ActivityService,
  ) {}

  async overview() {
    const [
      openTickets,
      unpaidInvoices,
      users,
      buildings,
      recentImpersonationEvents,
      recentNotifications,
      userRoleCounts,
      recentActivity,
      escalatedCollections,
      expiringSupplierCompliance,
    ] =
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
        this.activityLog.list({ limit: 12 }),
        this.prisma.invoice.count({
          where: {
            status: InvoiceStatus.UNPAID,
            collectionStatus: CollectionStatus.IN_COLLECTIONS,
          },
        }),
        this.prisma.supplier.count({
          where: {
            isActive: true,
            insuranceExpiry: {
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          },
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
        { label: 'יומן פעילות', href: '/admin/activity' },
        { label: 'הגדרות משתמש', href: '/settings' },
      ],
      exceptions: {
        escalatedCollections,
        expiringSupplierCompliance,
      },
      recentActivity,
    };
  }

  activity(input: { buildingId?: number; severity?: string; entityType?: string }) {
    return this.activityLog.list({
      buildingId: input.buildingId,
      severity: input.severity as ActivitySeverity | undefined,
      entityType: input.entityType,
      limit: 200,
    });
  }

  exportActivity(input: { buildingId?: number }) {
    return this.activityLog.exportCsv({ buildingId: input.buildingId, limit: 500 });
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
    await this.activityLog.log({
      userId: user.sub,
      entityType: 'IMPERSONATION',
      action: 'START',
      summary: `התחזות הופעלה לתפקיד ${dto.role}.`,
      severity: ActivitySeverity.WARNING,
      metadata: { tenantId: dto.tenantId, reason: dto.reason },
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
    await this.activityLog.log({
      userId: user.sub,
      entityType: 'IMPERSONATION',
      action: 'STOP',
      summary: 'התחזות הופסקה וחזרה לחשבון הראשי.',
      severity: ActivitySeverity.INFO,
      metadata: { tenantId: user.tenantId },
    });
    return { accessToken, refreshToken };
  }
}

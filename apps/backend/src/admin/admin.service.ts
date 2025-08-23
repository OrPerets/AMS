import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { Role } from '@prisma/client';
import { ImpersonateDto } from './dto/impersonate.dto';

@Injectable()
export class AdminService {
  constructor(private jwt: JwtService, private prisma: PrismaService) {}

  async impersonate(user: any, dto: ImpersonateDto, ip: string, userAgent: string) {
    if (dto.role === Role.MASTER || !Object.values(Role).includes(dto.role)) {
      throw new BadRequestException('Invalid role');
    }
    const payload = {
      sub: user.sub,
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

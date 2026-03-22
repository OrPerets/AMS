import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/user.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private users: UserService, private jwt: JwtService) {}

  async validateUser(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(user: {
    id?: number;
    sub?: number;
    email?: string;
    role: string;
    tenantId: number;
    actAsRole?: string;
    originalSub?: number;
    originalEmail?: string;
    originalTenantId?: number;
  }) {
    const subject = user.id ?? user.sub;
    const payload = {
      sub: subject,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      ...(user.actAsRole ? { actAsRole: user.actAsRole } : {}),
      ...(user.originalSub ? { originalSub: user.originalSub } : {}),
      ...(user.originalEmail ? { originalEmail: user.originalEmail } : {}),
      ...(user.originalTenantId ? { originalTenantId: user.originalTenantId } : {}),
    };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'secret',
      expiresIn: '15m',
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }
}

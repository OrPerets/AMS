import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private prisma: PrismaService) {
    super();
  }

  async handleRequest(err: any, user: any, info: any, context: any, status?: any) {
    if (user?.tenantId) {
      await this.prisma.$executeRaw`SET app.tenant_id = ${user.tenantId}`;
    }
    return super.handleRequest(err, user, info, context, status);
  }
}

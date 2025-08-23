import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private prisma: PrismaService) {
    super();
  }

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    if (user?.tenantId) {
      void this.prisma.$executeRaw`SET app.tenant_id = ${user.tenantId}`;
    }
    return super.handleRequest(err, user, info, context, status) as TUser;
  }
}

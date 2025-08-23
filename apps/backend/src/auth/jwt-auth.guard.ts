import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './roles.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private prisma: PrismaService, private reflector: Reflector) {
    super();
  }

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return user as TUser;
    }
    if (user?.tenantId) {
      void this.prisma.$executeRaw`SET app.tenant_id = ${user.tenantId}`;
    }
    return super.handleRequest(err, user, info, context, status) as TUser;
  }
}

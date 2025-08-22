import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../prisma.service';
import { UserController } from './user.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  providers: [PrismaService, UserService, JwtAuthGuard, RolesGuard],
  controllers: [UserController],
  exports: [UserService, PrismaService],
})
export class UserModule {}

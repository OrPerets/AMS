import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../prisma.service';
import { UserController } from './user.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [ActivityModule],
  providers: [PrismaService, UserService, JwtAuthGuard, RolesGuard],
  controllers: [UserController],
  exports: [UserService, PrismaService],
})
export class UserModule {}

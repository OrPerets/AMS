import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma.service';
import { ActivityModule } from '../activity/activity.module';
import { ApprovalModule } from '../approval/approval.module';

@Module({
  imports: [
    ActivityModule,
    ApprovalModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, PrismaService],
})
export class AdminModule {}

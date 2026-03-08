import { Module } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { PrismaService } from '../prisma.service';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [ActivityModule],
  providers: [ApprovalService, PrismaService],
  exports: [ApprovalService],
})
export class ApprovalModule {}

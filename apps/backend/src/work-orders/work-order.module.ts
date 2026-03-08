import { Module } from '@nestjs/common';
import { WorkOrderService } from './work-order.service';
import { WorkOrderController } from './work-order.controller';
import { PrismaService } from '../prisma.service';
import { PhotoService } from '../tickets/photo.service';
import { ActivityModule } from '../activity/activity.module';
import { ApprovalModule } from '../approval/approval.module';

@Module({
  imports: [ActivityModule, ApprovalModule],
  controllers: [WorkOrderController],
  providers: [WorkOrderService, PrismaService, PhotoService],
})
export class WorkOrderModule {}

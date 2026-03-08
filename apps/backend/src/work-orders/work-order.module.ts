import { Module } from '@nestjs/common';
import { WorkOrderService } from './work-order.service';
import { WorkOrderController } from './work-order.controller';
import { PrismaService } from '../prisma.service';
import { PhotoService } from '../tickets/photo.service';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [ActivityModule],
  controllers: [WorkOrderController],
  providers: [WorkOrderService, PrismaService, PhotoService],
})
export class WorkOrderModule {}

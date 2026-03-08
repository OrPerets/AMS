import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaService } from '../prisma.service';
import { TranzilaService } from './tranzila.service';
import { ReceiptService } from './receipt.service';
import { TranzilaProvider } from './tranzila.provider';
import { ActivityModule } from '../activity/activity.module';
import { ApprovalModule } from '../approval/approval.module';

@Module({
  imports: [ActivityModule, ApprovalModule],
  controllers: [PaymentController],
  providers: [PaymentService, PrismaService, TranzilaService, ReceiptService, TranzilaProvider],
})
export class PaymentModule {}

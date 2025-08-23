import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaService } from '../prisma.service';
import { TranzilaService } from './tranzila.service';
import { ReceiptService } from './receipt.service';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, PrismaService, TranzilaService, ReceiptService],
})
export class PaymentModule {}

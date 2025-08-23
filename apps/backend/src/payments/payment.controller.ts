import { Controller, Post, Body, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(private payments: PaymentService) {}

  @Post('invoices')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  createInvoice(@Body() dto: { residentId: number; items: any[]; amount: number }) {
    return this.payments.createInvoice(dto);
  }

  @Get('invoices/unpaid')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  listUnpaid(@Query('residentId') residentId?: string) {
    return this.payments.listUnpaid(residentId ? +residentId : undefined);
  }

  @Post('invoices/:id/pay')
  @Roles(Role.RESIDENT)
  pay(@Param('id') id: string) {
    return this.payments.initiatePayment(+id);
  }

  @Post('payments/webhook')
  webhook(@Body() body: { invoiceId: number; status: string }) {
    if (body.status === 'paid') {
      return this.payments.confirmPayment(body.invoiceId);
    }
    return { ok: true };
  }
}

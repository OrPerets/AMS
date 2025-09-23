import { Controller, Post, Body, Get, Param, Query, UseGuards, Res, Delete } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { Public } from '../auth/roles.decorator';
import { Response } from 'express';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(private payments: PaymentService) {}

  @Post('invoices')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  createInvoice(@Body() dto: { residentId: number; items: any[]; amount?: number }) {
    return this.payments.createInvoice(dto);
  }

  @Get('invoices/unpaid')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  listUnpaid(@Query('residentId') residentId?: string, @Query('format') format?: string, @Res() res?: Response) {
    const data = this.payments.listUnpaid(residentId ? +residentId : undefined);
    if (format === 'csv' && res) {
      return data.then((invoices) => {
        const csv = ['id,residentId,amount,status', ...invoices.map((i) => `${i.id},${i.residentId},${i.amount},${i.status}`)].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);
      });
    }
    return data;
  }

  @Post('invoices/:id/pay')
  @Roles(Role.RESIDENT)
  pay(@Param('id') id: string) {
    return this.payments.initiatePayment(+id);
  }

  @Post('invoices/:id/confirm')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  confirm(@Param('id') id: string) {
    return this.payments.confirmPayment(+id);
  }

  @Post('invoices/:id/penalty')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  addPenalty(@Param('id') id: string, @Body() body: { amount: number }) {
    return this.payments.applyLatePenalty(+id, body.amount);
  }

  @Post('payments/webhook')
  @Public()
  webhook(@Body() body: { invoiceId: number; status: string }) {
    if (body.status === 'paid') {
      return this.payments.confirmPayment(body.invoiceId);
    }
    return { ok: true };
  }

  @Get('invoices/:id/receipt')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT, Role.RESIDENT)
  async receipt(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.payments.generateReceipt(+id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=invoice-${id}.pdf`);
    return res.send(pdf);
  }

  // Recurring invoices
  @Post('recurring-invoices')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  createRecurring(@Body() dto: { residentId: number; items: any[]; amount?: number; recurrence: string; startAt?: string }) {
    return this.payments.createRecurringInvoice(dto);
  }

  @Get('recurring-invoices')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  listRecurring(@Query('residentId') residentId?: string) {
    return this.payments.listRecurring(residentId ? +residentId : undefined);
  }

  @Post('recurring-invoices/:id/toggle')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  toggleRecurring(@Param('id') id: string, @Body() body: { active: boolean }) {
    return this.payments.toggleRecurring(+id, body.active);
  }

  @Post('recurring-invoices/:id/run')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  runRecurringNow(@Param('id') id: string) {
    return this.payments.runRecurringNow(+id);
  }

  @Post('recurring-invoices/run-due')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  runDue() {
    return this.payments.runDueRecurring();
  }
}

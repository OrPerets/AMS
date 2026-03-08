import { Controller, Post, Body, Get, Param, Query, UseGuards, Res, Patch, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, Role, Public } from '../auth/roles.decorator';
import { Response } from 'express';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(private payments: PaymentService) {}

  @Post('invoices')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  createInvoice(
    @Body()
    dto: {
      residentId: number;
      items: any[];
      amount?: number;
      dueDate?: string;
      lateFeeAmount?: number;
      collectionNotes?: string;
    },
    @Req() req: any,
  ) {
    return this.payments.createInvoice(dto, req.user?.sub);
  }

  @Get('invoices')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT, Role.RESIDENT)
  async listInvoices(
    @Query('residentId') residentId?: string,
    @Query('status') status?: 'PENDING' | 'PAID' | 'OVERDUE',
    @Query('format') format?: string,
    @Query('buildingId') buildingId?: string,
    @Req() req?: any,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const effectiveRole = req?.user?.actAsRole ?? req?.user?.role;
    const effectiveResidentId = effectiveRole === Role.RESIDENT ? req?.user?.sub : residentId ? +residentId : undefined;
    if (format === 'csv' && res) {
      const csv = await this.payments.exportInvoicesCsv('invoices', effectiveResidentId, buildingId ? +buildingId : undefined, req?.user?.sub);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="invoices.csv"');
      return csv;
    }
    return this.payments.listInvoices(effectiveResidentId, status);
  }

  @Get('invoices/unpaid')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  async listUnpaid(
    @Query('residentId') residentId?: string,
    @Query('format') format?: string,
    @Req() req?: any,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const data = this.payments.listUnpaid(residentId ? +residentId : undefined);
    if (format === 'csv' && res) {
      const csv = await this.payments.exportInvoicesCsv('unpaid', residentId ? +residentId : undefined, undefined, req?.user?.sub);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="unpaid-invoices.csv"');
      return csv;
    }
    return data;
  }

  @Get('invoices/collections/summary')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  collectionsSummary(@Query('buildingId') buildingId?: string) {
    return this.payments.getCollectionsDashboard(buildingId ? +buildingId : undefined);
  }

  @Post('invoices/:id/pay')
  @Roles(Role.RESIDENT)
  pay(@Param('id') id: string, @Req() req: any) {
    return this.payments.initiatePayment(+id, req.user?.sub, req.user?.actAsRole ?? req.user?.role);
  }

  @Post('invoices/:id/confirm')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  confirm(@Param('id') id: string) {
    return this.payments.confirmPayment(+id);
  }

  @Post('invoices/:id/settle')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  settle(@Param('id') id: string, @Req() req: any) {
    return this.payments.settleInvoice(+id, req.user?.sub);
  }

  @Post('invoices/:id/penalty')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  addPenalty(@Param('id') id: string, @Body() body: { amount: number }, @Req() req: any) {
    return this.payments.applyLatePenalty(+id, body.amount, req.user?.sub);
  }

  @Patch('invoices/:id/collections')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  updateCollections(
    @Param('id') id: string,
    @Body()
    body: {
      reminderState?: 'NONE' | 'UPCOMING' | 'SENT' | 'PROMISED' | 'ESCALATED';
      collectionStatus?: 'CURRENT' | 'PAST_DUE' | 'IN_COLLECTIONS' | 'PROMISE_TO_PAY' | 'RESOLVED';
      promiseToPayDate?: string | null;
      collectionNotes?: string | null;
      dueDate?: string | null;
    },
    @Req() req: any,
  ) {
    return this.payments.updateCollections(+id, body, req.user?.sub);
  }

  @Post('invoices/:id/adjustments')
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  requestAdjustment(
    @Param('id') id: string,
    @Body() body: { amount: number; reason?: string; description?: string },
    @Req() req: any,
  ) {
    return this.payments.requestBalanceAdjustment(+id, body, req.user?.sub);
  }

  @Get('invoices/account/:residentId')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT, Role.RESIDENT, Role.MASTER)
  account(@Param('residentId') residentId: string, @Req() req: any) {
    const effectiveResidentId = (req.user?.actAsRole ?? req.user?.role) === Role.RESIDENT ? req.user?.sub : +residentId;
    return this.payments.getResidentAccount(effectiveResidentId);
  }

  @Get('invoices/ledger')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT, Role.RESIDENT, Role.MASTER)
  async ledger(@Query('residentId') residentId: string, @Query('format') format: string | undefined, @Req() req: any, @Res({ passthrough: true }) res?: Response) {
    const effectiveResidentId = (req.user?.actAsRole ?? req.user?.role) === Role.RESIDENT ? req.user?.sub : +residentId;
    const ledger = await this.payments.getResidentLedger(effectiveResidentId);
    if (format === 'csv' && res) {
      const csv = await this.payments.exportInvoicesCsv('ledger', effectiveResidentId, undefined, req.user?.sub);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=\"resident-ledger.csv\"');
      return csv;
    }
    return ledger;
  }

  @Post('payments/webhook')
  @Public()
  webhook(@Body() body: any) {
    // Accept generic webhook payload for sandbox; production should verify signature and provider
    if (body?.invoiceId && body?.status === 'paid') {
      return this.payments.confirmPayment(body.invoiceId);
    }
    return { ok: true };
  }

  @Get('invoices/:id/receipt')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT, Role.RESIDENT)
  async receipt(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const pdf = await this.payments.generateReceipt(+id, req.user?.sub, req.user?.actAsRole ?? req.user?.role);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=invoice-${id}.pdf`);
    return res.send(pdf);
  }

  // Recurring invoices
  @Post('recurring-invoices')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  createRecurring(
    @Body()
    dto: {
      residentId: number;
      title?: string;
      items: any[];
      amount?: number;
      recurrence: string;
      startAt?: string;
      dueDaysAfterIssue?: number;
      graceDays?: number;
      lateFeeAmount?: number;
    },
    @Req() req: any,
  ) {
    return this.payments.createRecurringInvoice(dto, req.user?.sub);
  }

  @Get('recurring-invoices')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  listRecurring(@Query('residentId') residentId?: string) {
    return this.payments.listRecurring(residentId ? +residentId : undefined);
  }

  @Post('recurring-invoices/:id/toggle')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  toggleRecurring(@Param('id') id: string, @Body() body: { active: boolean }, @Req() req: any) {
    return this.payments.toggleRecurring(+id, body.active, req.user?.sub);
  }

  @Post('recurring-invoices/:id/run')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  runRecurringNow(@Param('id') id: string, @Req() req: any) {
    return this.payments.runRecurringNow(+id, req.user?.sub);
  }

  @Post('recurring-invoices/run-due')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  runDue() {
    return this.payments.runDueRecurring();
  }

  // Sprint 6 Payments API (v1)
  @Post('payments/intents')
  @Roles(Role.RESIDENT, Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  createIntent(@Body() body: { invoiceId: number }, @Req() req: any) {
    return this.payments.initiatePayment(body.invoiceId, req.user?.sub, req.user?.actAsRole ?? req.user?.role);
  }

  @Post('payments/intents/:id/confirm')
  @Roles(Role.RESIDENT, Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  confirmIntent(@Param('id') id: string, @Req() req: any) {
    return this.payments
      .getPayment(+id, req.user?.sub, req.user?.actAsRole ?? req.user?.role)
      .then((intent: any) => this.payments.confirmPayment(intent.invoiceId));
  }

  @Post('payments/:id/refund')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  refund(@Param('id') id: string, @Body() body: { amount?: number }) {
    return this.payments.refund(+id, body?.amount);
  }

  @Get('payments/:id')
  @Roles(Role.RESIDENT, Role.ADMIN, Role.PM, Role.ACCOUNTANT)
  getPayment(@Param('id') id: string, @Req() req: any) {
    return this.payments.getPayment(+id, req.user?.sub, req.user?.actAsRole ?? req.user?.role);
  }
}

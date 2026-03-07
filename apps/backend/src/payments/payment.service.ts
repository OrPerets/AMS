import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InvoiceStatus, PaymentIntentStatus } from '@prisma/client';
import { TranzilaService } from './tranzila.service';
import { ReceiptService } from './receipt.service';
import { TranzilaProvider } from './tranzila.provider';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private tranzila: TranzilaService,
    private receipts: ReceiptService,
    private tranzilaProvider: TranzilaProvider,
  ) {}

  private getInvoiceDescription(items: any[]): string {
    if (!Array.isArray(items) || items.length === 0) return 'General charge';
    return items
      .map((item) => item?.description || item?.name || 'Charge')
      .filter(Boolean)
      .join(', ');
  }

  private getInvoiceType(items: any[]): 'MAINTENANCE' | 'UTILITIES' | 'MANAGEMENT' | 'PARKING' | 'OTHER' {
    const haystack = JSON.stringify(items || []).toLowerCase();
    if (haystack.includes('maint') || haystack.includes('repair') || haystack.includes('service')) return 'MAINTENANCE';
    if (haystack.includes('utility') || haystack.includes('electric') || haystack.includes('water')) return 'UTILITIES';
    if (haystack.includes('manage') || haystack.includes('hoa') || haystack.includes('fee')) return 'MANAGEMENT';
    if (haystack.includes('park')) return 'PARKING';
    return 'OTHER';
  }

  private getDueDate(createdAt: Date) {
    return new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  private mapInvoiceStatus(invoice: { status: InvoiceStatus; createdAt: Date }) {
    if (invoice.status === InvoiceStatus.PAID) return 'PAID' as const;
    return this.getDueDate(invoice.createdAt) < new Date() ? ('OVERDUE' as const) : ('PENDING' as const);
  }

  private mapInvoice(invoice: any) {
    const latestIntent = [...(invoice.paymentIntents || [])].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0];
    const dueDate = this.getDueDate(new Date(invoice.createdAt));

    return {
      id: invoice.id,
      residentId: invoice.residentId,
      residentName: invoice.resident?.user?.email ?? `Resident #${invoice.residentId}`,
      amount: invoice.amount,
      description: this.getInvoiceDescription(invoice.items),
      issueDate: invoice.createdAt,
      dueDate,
      status: this.mapInvoiceStatus(invoice),
      type: this.getInvoiceType(invoice.items),
      paymentMethod: latestIntent?.paymentMethod?.brand || latestIntent?.provider || null,
      paidAt: invoice.status === InvoiceStatus.PAID ? latestIntent?.updatedAt ?? invoice.createdAt : null,
      receiptNumber: invoice.status === InvoiceStatus.PAID ? `REC-${invoice.id}` : null,
      category: this.getInvoiceType(invoice.items),
      history: [
        ...(invoice.paymentIntents || []).map((intent: any) => ({
          kind: 'PAYMENT',
          id: intent.id,
          status: intent.status,
          amount: intent.amount,
          createdAt: intent.createdAt,
        })),
        ...((latestIntent?.refunds || []) as any[]).map((refund) => ({
          kind: 'REFUND',
          id: refund.id,
          status: 'REFUNDED',
          amount: refund.amount,
          createdAt: refund.createdAt,
        })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    };
  }

  createInvoice(data: { residentId: number; items: any[]; amount?: number }) {
    const computedAmount =
      data.amount ??
      data.items.reduce((sum: number, item: any) => sum + (Number(item.quantity || 1) * Number(item.unitPrice || item.amount || 0)), 0);
    return this.prisma.invoice.create({
      data: {
        resident: { connect: { id: data.residentId } },
        items: data.items,
        amount: computedAmount,
      },
    });
  }

  listUnpaid(residentId?: number) {
    return this.prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.UNPAID,
        ...(residentId ? { residentId } : {}),
      },
      include: {
        resident: { include: { user: true } },
        paymentIntents: {
          include: {
            paymentMethod: true,
            refunds: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }).then((invoices) => invoices.map((invoice) => this.mapInvoice(invoice)));
  }

  listInvoices(residentId?: number, status?: 'PENDING' | 'PAID' | 'OVERDUE') {
    return this.prisma.invoice.findMany({
      where: {
        ...(residentId ? { residentId } : {}),
      },
      include: {
        resident: { include: { user: true } },
        paymentIntents: {
          include: {
            paymentMethod: true,
            refunds: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }).then((invoices) => {
      const mapped = invoices.map((invoice) => this.mapInvoice(invoice));
      return status ? mapped.filter((invoice) => invoice.status === status) : mapped;
    });
  }

  async initiatePayment(id: number) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { resident: { include: { user: true } } },
    });
    if (!invoice) throw new Error('Invoice not found');
    // Create PaymentIntent
    const intent = await this.prisma.paymentIntent.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.amount,
        currency: 'NIS',
        status: PaymentIntentStatus.REQUIRES_CONFIRMATION,
        provider: 'tranzila',
      },
    });
    const result = await this.tranzilaProvider.createPayment({ amount: invoice.amount, currency: 'NIS', description: `Invoice #${invoice.id}` });
    await this.prisma.paymentIntent.update({ where: { id: intent.id }, data: { providerIntentId: result.providerIntentId || String(intent.id), clientSecret: result.clientSecret || null } });
    return { intentId: intent.id, redirectUrl: result.redirectUrl, clientSecret: result.clientSecret };
  }

  async confirmPayment(invoiceId: number) {
    const existing = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        resident: { include: { user: true } },
        paymentIntents: true,
      },
    });
    if (!existing) throw new Error('Invoice not found');
    if (existing.status === InvoiceStatus.PAID) {
      return existing;
    }

    const invoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: InvoiceStatus.PAID },
      include: { resident: { include: { user: true } }, paymentIntents: true },
    });
    const latestIntent = invoice.paymentIntents[0];
    if (latestIntent) {
      await this.prisma.paymentIntent.update({
        where: { id: latestIntent.id },
        data: { status: PaymentIntentStatus.SUCCEEDED },
      });
    }
    // Ledger entries (payment and net/fee simplified)
    await this.prisma.ledgerEntry.create({ data: { invoiceId, entryType: 'payment', amount: invoice.amount, debit: 'Cash', credit: 'Accounts Receivable' } });
    // In a real system, email the receipt
    await this.receipts.generate(invoice);
    return invoice;
  }

  async settleInvoice(invoiceId: number) {
    const invoice = await this.prisma.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
    });

    const existingIntent = await this.prisma.paymentIntent.findFirst({
      where: { invoiceId },
      orderBy: { createdAt: 'desc' },
    });

    if (!existingIntent) {
      await this.prisma.paymentIntent.create({
        data: {
          invoiceId,
          amount: invoice.amount,
          currency: 'NIS',
          provider: 'manual',
          status: PaymentIntentStatus.PROCESSING,
        },
      });
    }

    await this.confirmPayment(invoiceId);

    const updated = await this.prisma.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
      include: {
        resident: { include: { user: true } },
        paymentIntents: {
          include: {
            paymentMethod: true,
            refunds: true,
          },
        },
      },
    });
    return this.mapInvoice(updated);
  }

  async createPaymentIntentFromInvoice(invoiceId: number) {
    const invoice = await this.prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    const intent = await this.prisma.paymentIntent.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.amount,
        currency: 'NIS',
        status: PaymentIntentStatus.REQUIRES_CONFIRMATION,
        provider: 'tranzila',
      },
    });
    const result = await this.tranzilaProvider.createPayment({ amount: invoice.amount, currency: 'NIS', description: `Invoice #${invoice.id}` });
    await this.prisma.paymentIntent.update({ where: { id: intent.id }, data: { providerIntentId: result.providerIntentId || String(intent.id), clientSecret: result.clientSecret || null } });
    return { id: intent.id, status: intent.status, redirectUrl: result.redirectUrl, clientSecret: result.clientSecret };
  }

  async refund(paymentIntentId: number, amount?: number) {
    const intent = await this.prisma.paymentIntent.findUniqueOrThrow({ where: { id: paymentIntentId }, include: { invoice: true } });
    const res = await this.tranzilaProvider.refund({ providerIntentId: intent.providerIntentId || String(intent.id), amount });
    await this.prisma.refund.create({ data: { paymentIntentId: intent.id, amount: amount ?? intent.amount, providerRefundId: res.providerRefundId || undefined } });
    await this.prisma.ledgerEntry.create({ data: { invoiceId: intent.invoiceId, paymentIntentId: intent.id, entryType: 'refund', amount: -(amount ?? intent.amount), debit: 'Accounts Receivable', credit: 'Cash' } });
    await this.prisma.invoice.update({ where: { id: intent.invoiceId }, data: { status: InvoiceStatus.UNPAID } });
    return { ok: true };
  }

  async getPayment(paymentIntentId: number) {
    const intent = await this.prisma.paymentIntent.findUniqueOrThrow({ where: { id: paymentIntentId } });
    return intent;
  }

  async applyLatePenalty(invoiceId: number, penaltyAmount: number) {
    const invoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { amount: { increment: penaltyAmount } as any },
    });
    return invoice;
  }

  async generateReceipt(id: number): Promise<Buffer> {
    const invoice = await this.prisma.invoice.findUniqueOrThrow({ where: { id } });
    return this.receipts.generate(invoice);
  }

  // Recurring invoices
  async createRecurringInvoice(data: { residentId: number; items: any[]; amount?: number; recurrence: string; startAt?: string }) {
    const computedAmount =
      data.amount ??
      data.items.reduce((sum: number, item: any) => sum + (Number(item.quantity || 1) * Number(item.unitPrice || item.amount || 0)), 0);
    return this.prisma.recurringInvoice.create({
      data: {
        resident: { connect: { id: data.residentId } },
        items: data.items,
        amount: computedAmount,
        recurrence: data.recurrence,
        nextRunAt: data.startAt ? new Date(data.startAt) : new Date(),
      },
    });
  }

  listRecurring(residentId?: number) {
    return this.prisma.recurringInvoice.findMany({ where: residentId ? { residentId } : {} });
  }

  toggleRecurring(id: number, active: boolean) {
    return this.prisma.recurringInvoice.update({ where: { id }, data: { active } });
  }

  private computeNextRun(current: Date, recurrence: string): Date {
    const next = new Date(current);
    const lower = recurrence.toLowerCase();
    if (lower.includes('month')) {
      next.setMonth(next.getMonth() + 1);
    } else if (lower.includes('quarter')) {
      next.setMonth(next.getMonth() + 3);
    } else if (lower.includes('year')) {
      next.setFullYear(next.getFullYear() + 1);
    } else if (lower.includes('week')) {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    return next;
  }

  async runRecurringNow(id: number) {
    const rec = await this.prisma.recurringInvoice.findUniqueOrThrow({ where: { id } });
    const invoice = await this.createInvoice({ residentId: rec.residentId, items: rec.items as any, amount: rec.amount });
    await this.prisma.recurringInvoice.update({
      where: { id },
      data: { lastRunAt: new Date(), nextRunAt: this.computeNextRun(new Date(), rec.recurrence) },
    });
    return invoice;
  }

  async runDueRecurring() {
    const now = new Date();
    const due = await this.prisma.recurringInvoice.findMany({ where: { active: true, nextRunAt: { lte: now } } });
    const results: any[] = [];
    for (const rec of due) {
      const invoice = await this.createInvoice({ residentId: rec.residentId, items: rec.items as any, amount: rec.amount });
      await this.prisma.recurringInvoice.update({
        where: { id: rec.id },
        data: { lastRunAt: new Date(), nextRunAt: this.computeNextRun(now, rec.recurrence) },
      });
      results.push(invoice);
    }
    return { generated: results.length, invoices: results };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InvoiceStatus } from '@prisma/client';
import { TranzilaService } from './tranzila.service';
import { ReceiptService } from './receipt.service';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private tranzila: TranzilaService,
    private receipts: ReceiptService,
  ) {}

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
    });
  }

  async initiatePayment(id: number) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { resident: { include: { user: true } } },
    });
    if (!invoice) throw new Error('Invoice not found');
    return this.tranzila.charge(invoice);
  }

  async confirmPayment(invoiceId: number) {
    const invoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: InvoiceStatus.PAID },
      include: { resident: { include: { user: true } } },
    });
    // In a real system, email the receipt
    await this.receipts.generate(invoice);
    return invoice;
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

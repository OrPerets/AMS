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

  createInvoice(data: { residentId: number; items: any[]; amount: number }) {
    return this.prisma.invoice.create({
      data: {
        resident: { connect: { id: data.residentId } },
        items: data.items,
        amount: data.amount,
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

  async generateReceipt(id: number): Promise<Buffer> {
    const invoice = await this.prisma.invoice.findUniqueOrThrow({ where: { id } });
    return this.receipts.generate(invoice);
  }
}

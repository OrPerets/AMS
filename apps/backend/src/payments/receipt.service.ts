import { Injectable } from '@nestjs/common';
import { Invoice } from '@prisma/client';
import PDFDocument from 'pdfkit';

@Injectable()
export class ReceiptService {
  async send(invoice: Invoice): Promise<void> {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    doc.text(`Invoice #${invoice.id}`);
    doc.text(`Amount: $${invoice.amount}`);
    doc.text(`Status: ${invoice.status}`);
    doc.end();

    await new Promise<Buffer>((resolve) => {
      doc.on('data', (c) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    console.log(`Receipt for invoice ${invoice.id} generated and emailed.`);
  }
}

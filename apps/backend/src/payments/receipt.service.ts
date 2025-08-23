import { Injectable } from '@nestjs/common';
import { Invoice } from '@prisma/client';
import PDFDocument = require('pdfkit');

@Injectable()
export class ReceiptService {
  async generate(invoice: Invoice): Promise<Buffer> {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    doc.fontSize(16).text(`Invoice #${invoice.id}`);
    doc.moveDown();
    doc.fontSize(12).text(`Amount: ₪${invoice.amount.toFixed(2)}`);
    doc.text(`Status: ${invoice.status}`);
    doc.end();

    const buffer = await new Promise<Buffer>((resolve) => {
      doc.on('data', (c) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
    return buffer;
  }
}

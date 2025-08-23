import { Injectable } from '@nestjs/common';
import { Invoice } from '@prisma/client';

@Injectable()
export class TranzilaService {
  async charge(invoice: Invoice): Promise<{ ok: boolean }> {
    const params = new URLSearchParams({
      supplier: 'sandbox',
      sum: invoice.amount.toFixed(2),
      currency: '1',
    });

    try {
      await fetch('https://sandbox.tranzila.com/cgi-bin/tranzila71u.cgi', {
        method: 'POST',
        body: params,
      });
    } catch (e) {
      // ignore errors in sandbox
    }

    return { ok: true };
  }
}

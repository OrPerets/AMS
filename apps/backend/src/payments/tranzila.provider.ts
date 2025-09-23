import { Injectable } from '@nestjs/common';
import { PaymentProvider, CreatePaymentParams, CreatePaymentResult, ConfirmPaymentParams, RefundParams, WebhookVerifyResult } from './providers/payment-provider';

@Injectable()
export class TranzilaProvider implements PaymentProvider {
  name: 'tranzila' = 'tranzila';

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    // Hosted checkout URL generation (placeholder sandbox)
    const redirectUrl = `https://sandbox.tranzila.com/cgi-bin/tranzila71u.cgi?sum=${params.amount.toFixed(2)}&currency=1`;
    return { redirectUrl, requiresAction: true };
  }

  async confirm(_params: ConfirmPaymentParams): Promise<{ status: string; raw?: any }> {
    return { status: 'succeeded' };
  }

  async refund(_params: RefundParams): Promise<{ providerRefundId?: string; raw?: any }> {
    return { providerRefundId: 'sandbox-refund' };
  }

  async retrieve(_providerIntentId: string): Promise<{ status: string; raw?: any }> {
    return { status: 'succeeded' };
  }

  async webhookVerify(_signature: string | undefined, payload: any): Promise<WebhookVerifyResult> {
    return { ok: true, eventId: payload?.id || String(Date.now()), type: payload?.type || 'payment.succeeded', data: payload };
  }
}



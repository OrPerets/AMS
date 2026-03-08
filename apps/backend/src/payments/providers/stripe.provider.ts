import { Injectable } from '@nestjs/common';
import {
  ConfirmPaymentParams,
  CreatePaymentParams,
  CreatePaymentResult,
  FeeEstimate,
  PaymentProvider,
  RefundParams,
  RoutingContext,
  WebhookVerifyResult,
} from './payment-provider';

@Injectable()
export class StripeProvider implements PaymentProvider {
  name: 'stripe' = 'stripe';

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const forceSoftDecline = Boolean(params.metadata?.forceSoftDecline);
    if (forceSoftDecline) {
      throw new Error('soft_decline');
    }

    const intentId = `stripe_${Date.now()}`;
    return {
      providerIntentId: intentId,
      clientSecret: `cs_${intentId}`,
      requiresAction: false,
      raw: {
        id: intentId,
        provider: this.name,
      },
    };
  }

  async confirm(params: ConfirmPaymentParams): Promise<{ status: string; raw?: any }> {
    return { status: 'succeeded', raw: { id: params.providerIntentId } };
  }

  async refund(params: RefundParams): Promise<{ providerRefundId?: string; raw?: any }> {
    const refundId = `re_${params.providerIntentId}_${Date.now()}`;
    return { providerRefundId: refundId, raw: { id: refundId, amount: params.amount } };
  }

  async retrieve(providerIntentId: string): Promise<{ status: string; raw?: any }> {
    return { status: 'succeeded', raw: { id: providerIntentId } };
  }

  async webhookVerify(_signature: string | undefined, payload: any): Promise<WebhookVerifyResult> {
    return {
      ok: true,
      eventId: payload?.id || payload?.eventId || `evt_${Date.now()}`,
      type: payload?.type || 'payment.succeeded',
      data: payload,
    };
  }

  estimateFees(context: RoutingContext): FeeEstimate {
    const fixedFee = 1.2;
    const variableFeeRate = context.cardType === 'debit' ? 0.012 : 0.018;
    const estimatedFee = Number((fixedFee + context.amount * variableFeeRate).toFixed(2));
    const estimatedNet = Number((context.amount - estimatedFee).toFixed(2));
    return { fixedFee, variableFeeRate, estimatedFee, estimatedNet };
  }
}

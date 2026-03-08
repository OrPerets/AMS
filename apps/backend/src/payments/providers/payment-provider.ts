export interface CreatePaymentParams {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
  returnUrl?: string;
}

export interface FeeEstimate {
  fixedFee: number;
  variableFeeRate: number;
  estimatedFee: number;
  estimatedNet: number;
}

export interface CreatePaymentResult {
  providerIntentId?: string;
  clientSecret?: string;
  redirectUrl?: string; // for hosted checkout
  requiresAction?: boolean;
  raw?: any;
}

export interface ConfirmPaymentParams {
  providerIntentId: string;
}

export interface RefundParams {
  providerIntentId: string;
  amount?: number;
}

export interface WebhookVerifyResult {
  ok: boolean;
  eventId?: string;
  type?: string;
  data?: any;
}

export interface RoutingContext {
  amount: number;
  currency: string;
  cardType?: 'debit' | 'credit' | 'commercial' | 'unknown';
  cardBin?: string;
  countryCode?: string;
}

export interface PaymentProvider {
  name: 'tranzila' | 'stripe' | string;
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  confirm(params: ConfirmPaymentParams): Promise<{ status: string; raw?: any }>;
  refund(params: RefundParams): Promise<{ providerRefundId?: string; raw?: any }>;
  retrieve(providerIntentId: string): Promise<{ status: string; raw?: any }>;
  webhookVerify(signature: string | undefined, payload: any, rawBody?: string): Promise<WebhookVerifyResult>;
  estimateFees(context: RoutingContext): FeeEstimate;
}

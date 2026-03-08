import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  PaymentProvider,
  CreatePaymentParams,
  CreatePaymentResult,
  ConfirmPaymentParams,
  RefundParams,
  WebhookVerifyResult,
  RoutingContext,
  FeeEstimate,
} from './providers/payment-provider';

type ProviderMode = 'sandbox' | 'production';

type TranzilaConfig = {
  mode: ProviderMode;
  terminalId: string;
  secret: string;
  apiBaseUrl: string;
  createPath: string;
  confirmPath: string;
  retrievePath: string;
  refundPath: string;
  webhookSecret?: string;
  timeoutMs: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;

export function mapProviderStatus(rawStatus: string | undefined): string {
  const normalized = String(rawStatus ?? '').toLowerCase();
  if (['approved', 'success', 'successful', 'paid', 'captured', 'succeeded'].includes(normalized)) return 'succeeded';
  if (['requires_action', 'redirect_required', 'pending_3ds', '3ds_required', 'challenge_required'].includes(normalized)) {
    return 'requires_action';
  }
  if (['new', 'created', 'requires_payment_method', 'payment_method_required'].includes(normalized)) return 'requires_payment_method';
  if (['processing', 'pending', 'in_progress', 'authorized'].includes(normalized)) return 'processing';
  if (['canceled', 'cancelled', 'voided'].includes(normalized)) return 'canceled';
  if (['failed', 'declined', 'rejected', 'error'].includes(normalized)) return 'failed';
  return 'processing';
}

function sanitizePayload(payload: any): any {
  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayload(item));
  }
  if (payload && typeof payload === 'object') {
    const redactedKeys = ['password', 'secret', 'token', 'card', 'cvv', 'pan'];
    return Object.fromEntries(
      Object.entries(payload).map(([key, value]) => {
        if (redactedKeys.some((redacted) => key.toLowerCase().includes(redacted))) {
          return [key, '[REDACTED]'];
        }
        return [key, sanitizePayload(value)];
      }),
    );
  }
  return payload;
}

@Injectable()
export class TranzilaProvider implements PaymentProvider {
  name: 'tranzila' = 'tranzila';
  private readonly logger = new Logger(TranzilaProvider.name);

  private readConfig(): TranzilaConfig {
    const mode = (process.env.TRANZILA_MODE?.toLowerCase() as ProviderMode | undefined) ?? 'sandbox';
    const isSandbox = mode === 'sandbox';
    const terminalId = process.env.TRANZILA_TERMINAL_ID;
    const secret = process.env.TRANZILA_SECRET ?? process.env.TRANZILA_PASSWORD;
    const apiBaseUrl = process.env.TRANZILA_API_BASE_URL ?? (isSandbox ? 'https://sandbox.tranzila.com/api' : 'https://secure.tranzila.com/api');
    const createPath = process.env.TRANZILA_CREATE_PATH ?? '/payments';
    const confirmPath = process.env.TRANZILA_CONFIRM_PATH ?? '/payments/{intentId}/confirm';
    const retrievePath = process.env.TRANZILA_RETRIEVE_PATH ?? '/payments/{intentId}';
    const refundPath = process.env.TRANZILA_REFUND_PATH ?? '/payments/{intentId}/refunds';
    const webhookSecret = process.env.TRANZILA_WEBHOOK_SECRET;
    const timeoutMs = Number(process.env.TRANZILA_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);

    if (!terminalId || !secret) {
      throw new InternalServerErrorException('Missing TRANZILA credentials. Set TRANZILA_TERMINAL_ID and TRANZILA_SECRET.');
    }

    return { mode, terminalId, secret, apiBaseUrl, createPath, confirmPath, retrievePath, refundPath, webhookSecret, timeoutMs };
  }

  private resolvePath(pathTemplate: string, providerIntentId?: string) {
    const path = providerIntentId ? pathTemplate.replace('{intentId}', encodeURIComponent(providerIntentId)) : pathTemplate;
    return `${this.readConfig().apiBaseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private async request(pathTemplate: string, method: 'POST' | 'GET', body?: any, providerIntentId?: string) {
    const config = this.readConfig();
    const url = this.resolvePath(pathTemplate, providerIntentId);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Basic ${Buffer.from(`${config.terminalId}:${config.secret}`).toString('base64')}`,
          'X-Tranzila-Mode': config.mode,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const text = await response.text();
      let raw: any = {};
      if (text) {
        try {
          raw = JSON.parse(text);
        } catch {
          raw = { body: text };
        }
      }
      if (!response.ok) {
        this.logger.error(`Tranzila API call failed (${response.status})`, JSON.stringify(sanitizePayload(raw)));
        throw new InternalServerErrorException(`Tranzila request failed with status ${response.status}`);
      }
      return raw;
    } catch (error: any) {
      this.logger.error(`Tranzila API request error: ${error?.message ?? 'unknown error'}`);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const payload = {
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      returnUrl: params.returnUrl,
      metadata: params.metadata,
    };

    const raw = await this.request(this.readConfig().createPath, 'POST', payload);
    const providerIntentId = raw?.id ? String(raw.id) : undefined;
    const redirectUrl = raw?.redirectUrl || raw?.checkoutUrl;
    const clientSecret = raw?.clientSecret || raw?.secret;
    const status = mapProviderStatus(raw?.status);

    return {
      providerIntentId,
      redirectUrl,
      clientSecret,
      requiresAction: status === 'requires_action' || Boolean(redirectUrl),
      raw: sanitizePayload(raw),
    };
  }

  async confirm(params: ConfirmPaymentParams): Promise<{ status: string; raw?: any }> {
    const raw = await this.request(this.readConfig().confirmPath, 'POST', {}, params.providerIntentId);
    return { status: mapProviderStatus(raw?.status), raw: sanitizePayload(raw) };
  }

  async refund(params: RefundParams): Promise<{ providerRefundId?: string; raw?: any }> {
    const raw = await this.request(this.readConfig().refundPath, 'POST', { amount: params.amount }, params.providerIntentId);
    return { providerRefundId: raw?.refundId ? String(raw.refundId) : undefined, raw: sanitizePayload(raw) };
  }

  async retrieve(providerIntentId: string): Promise<{ status: string; raw?: any }> {
    const raw = await this.request(this.readConfig().retrievePath, 'GET', undefined, providerIntentId);
    return { status: mapProviderStatus(raw?.status), raw: sanitizePayload(raw) };
  }


  estimateFees(context: RoutingContext): FeeEstimate {
    const fixedFee = 1.0;
    const variableFeeRate = context.cardType === 'debit' ? 0.011 : 0.016;
    const estimatedFee = Number((fixedFee + context.amount * variableFeeRate).toFixed(2));
    const estimatedNet = Number((context.amount - estimatedFee).toFixed(2));
    return { fixedFee, variableFeeRate, estimatedFee, estimatedNet };
  }

  async webhookVerify(signature: string | undefined, payload: any, rawBody?: string): Promise<WebhookVerifyResult> {
    const config = this.readConfig();
    if (!config.webhookSecret || !signature) {
      return { ok: false };
    }

    const normalizedSignature = signature.replace(/^sha256=/i, '').trim();
    const source = rawBody ?? JSON.stringify(payload ?? {});
    const expectedSignature = createHmac('sha256', config.webhookSecret).update(source).digest('hex');

    const safeCompare =
      normalizedSignature.length === expectedSignature.length &&
      timingSafeEqual(Buffer.from(normalizedSignature, 'utf8'), Buffer.from(expectedSignature, 'utf8'));

    return {
      ok: safeCompare,
      eventId: payload?.id || payload?.eventId || String(Date.now()),
      type: payload?.type || 'payment.unknown',
      data: sanitizePayload(payload),
    };
  }
}

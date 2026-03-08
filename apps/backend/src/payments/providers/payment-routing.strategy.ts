import { Injectable } from '@nestjs/common';
import { PaymentProvider, RoutingContext } from './payment-provider';

export type RouteDecision = {
  provider: PaymentProvider;
  reason: string;
  fallbackProvider?: PaymentProvider;
};

@Injectable()
export class PaymentRoutingStrategy {
  selectProvider(providers: PaymentProvider[], context: RoutingContext): RouteDecision {
    const primary = process.env.PAYMENTS_PRIMARY_PROVIDER ?? 'tranzila';
    const fallback = process.env.PAYMENTS_FALLBACK_PROVIDER ?? 'stripe';

    const byName = new Map(providers.map((provider) => [provider.name, provider]));

    const highAmountThreshold = Number(process.env.PAYMENTS_HIGH_AMOUNT_THRESHOLD ?? 2000);
    if (context.amount >= highAmountThreshold && byName.has('stripe')) {
      return {
        provider: byName.get('stripe')!,
        fallbackProvider: byName.get('tranzila'),
        reason: `amount>=${highAmountThreshold}`,
      };
    }

    if (context.cardType === 'commercial' && byName.has('stripe')) {
      return {
        provider: byName.get('stripe')!,
        fallbackProvider: byName.get('tranzila'),
        reason: 'commercial_card_route',
      };
    }

    if (context.countryCode && context.countryCode !== 'IL' && byName.has('stripe')) {
      return {
        provider: byName.get('stripe')!,
        fallbackProvider: byName.get('tranzila'),
        reason: `country_route:${context.countryCode}`,
      };
    }

    return {
      provider: byName.get(primary) ?? providers[0],
      fallbackProvider: byName.get(fallback),
      reason: 'default_route',
    };
  }

  shouldFailover(error: unknown): boolean {
    const message = String((error as any)?.message ?? '').toLowerCase();
    return message.includes('timeout') || message.includes('soft_decline') || message.includes('temporar');
  }
}

import { UnauthorizedException } from '@nestjs/common';
import { PaymentService } from './payment.service';

describe('PaymentService webhook processing', () => {
  let service: PaymentService;
  let prisma: any;
  let tranzilaProvider: any;
  let stripeProvider: any;
  let routingStrategy: any;

  beforeEach(() => {
    prisma = {
      webhookEvent: {
        create: jest.fn(),
        update: jest.fn(),
      },
      paymentIntent: {
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findMany: jest.fn(),
      },
      invoice: {
        update: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      resident: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      paymentMethod: {
        findMany: jest.fn(),
        count: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findFirst: jest.fn(),
      },
      notification: {
        create: jest.fn(),
      },
      recurringInvoice: {
        findMany: jest.fn(),
        update: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      providerTransaction: {
        create: jest.fn(),
      },
    };

    tranzilaProvider = {
      name: 'tranzila',
      webhookVerify: jest.fn(),
      createPayment: jest.fn(),
      retrieve: jest.fn(),
      refund: jest.fn(),
      estimateFees: jest.fn().mockReturnValue({ estimatedFee: 5, estimatedNet: 95 }),
    };

    stripeProvider = {
      name: 'stripe',
      createPayment: jest.fn(),
      retrieve: jest.fn(),
      refund: jest.fn(),
      estimateFees: jest.fn().mockReturnValue({ estimatedFee: 4, estimatedNet: 96 }),
    };

    routingStrategy = {
      selectProvider: jest.fn().mockReturnValue({ provider: tranzilaProvider, reason: 'default_route' }),
      shouldFailover: jest.fn().mockReturnValue(true),
    };

    service = new PaymentService(
      prisma as any,
      { generate: jest.fn() } as any,
      tranzilaProvider as any,
      stripeProvider as any,
      routingStrategy as any,
      { log: jest.fn() } as any,
      {} as any,
    );
  });

  it('rejects invalid webhook signatures', async () => {
    tranzilaProvider.webhookVerify.mockResolvedValue({ ok: false });

    await expect(service.processWebhook({ id: 'evt-1' }, 'bad-signature')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('no-ops duplicate webhook deliveries', async () => {
    tranzilaProvider.webhookVerify.mockResolvedValue({ ok: true, eventId: 'evt-dup', type: 'payment.succeeded', data: { id: 'evt-dup' } });
    prisma.webhookEvent.create.mockRejectedValue({ code: 'P2002' });

    await expect(service.processWebhook({ id: 'evt-dup' }, 'sig')).resolves.toEqual({ ok: true, duplicate: true });
    expect(prisma.paymentIntent.update).not.toHaveBeenCalled();
  });

  it('ignores unknown webhook event types safely', async () => {
    tranzilaProvider.webhookVerify.mockResolvedValue({ ok: true, eventId: 'evt-2', type: 'payment.unknown', data: { id: 'evt-2' } });

    await expect(service.processWebhook({ id: 'evt-2' }, 'sig')).resolves.toEqual({ ok: true, ignored: true });
    expect(prisma.webhookEvent.update).toHaveBeenCalledWith({
      where: { provider_eventId: { provider: 'tranzila', eventId: 'evt-2' } },
      data: { processed: true },
    });
  });

  it('processes allowed succeeded events and settles invoice once', async () => {
    tranzilaProvider.webhookVerify.mockResolvedValue({
      ok: true,
      eventId: 'evt-3',
      type: 'payment.succeeded',
      data: { id: 'evt-3' },
    });
    prisma.paymentIntent.findFirst.mockResolvedValue({
      id: 55,
      invoiceId: 101,
      status: 'PROCESSING' as any,
      provider: 'tranzila',
      providerIntentId: 'pi_123',
    });
    const confirmSpy = jest.spyOn(service, 'confirmPayment').mockResolvedValue({ id: 101 } as any);

    await expect(service.processWebhook({ id: 'evt-3', intentId: 'pi_123' }, 'sig')).resolves.toEqual({ ok: true });

    expect(prisma.paymentIntent.update).toHaveBeenCalledWith({
      where: { id: 55 },
      data: {
        status: 'SUCCEEDED' as any,
        metadata: { id: 'evt-3' },
      },
    });
    expect(confirmSpy).toHaveBeenCalledWith(101);
  });

  it('marks invoice unpaid on failed events', async () => {
    tranzilaProvider.webhookVerify.mockResolvedValue({ ok: true, eventId: 'evt-4', type: 'payment.failed', data: { id: 'evt-4' } });
    prisma.paymentIntent.findFirst.mockResolvedValue({
      id: 56,
      invoiceId: 102,
      status: 'PROCESSING' as any,
      provider: 'tranzila',
      providerIntentId: 'pi_456',
    });

    await expect(service.processWebhook({ id: 'evt-4', intentId: 'pi_456' }, 'sig')).resolves.toEqual({ ok: true });

    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 102 },
      data: { status: 'UNPAID' as any, collectionStatus: 'PAST_DUE' as any },
    });
  });

  it('fails over to fallback provider and persists fee estimate fields', async () => {
    prisma.invoice.findUnique.mockResolvedValue({ id: 77, amount: 100, residentId: 10 });
    prisma.paymentIntent.create.mockResolvedValue({ id: 700, status: 'REQUIRES_CONFIRMATION' });
    routingStrategy.selectProvider.mockReturnValue({ provider: tranzilaProvider, fallbackProvider: stripeProvider, reason: 'default_route' });
    tranzilaProvider.createPayment.mockRejectedValue(new Error('soft_decline'));
    stripeProvider.createPayment.mockResolvedValue({ providerIntentId: 'pi_fallback', requiresAction: false, raw: { ok: true } });

    await service.initiatePayment(77, undefined, undefined);

    expect(prisma.paymentIntent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          provider: 'tranzila',
          providerFeeEstimated: 5,
          netAmount: 95,
          grossAmount: 100,
        }),
      }),
    );
    expect(prisma.paymentIntent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          provider: 'stripe',
          providerIntentId: 'pi_fallback',
        }),
      }),
    );
  });

it('adds a resident payment method and marks first method as default', async () => {
    prisma.resident.findUnique.mockResolvedValue({ id: 10, userId: 99 });
    prisma.paymentMethod.count.mockResolvedValue(0);
    prisma.paymentMethod.create.mockResolvedValue({ id: 300, residentId: 10, isDefault: true, networkTokenized: true });

    const created = await service.addPaymentMethod(
      {
        provider: 'tranzila',
        token: 'tok_123',
        brand: 'visa',
        last4: '4242',
        networkTokenized: true,
      },
      99,
      'RESIDENT' as any,
    );

    expect(created.isDefault).toBe(true);
    expect(prisma.paymentMethod.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          residentId: 10,
          token: 'tok_123',
          networkTokenized: true,
          isDefault: true,
        }),
      }),
    );
  });

  it('runs autopay on due recurring invoices and sends success notification', async () => {
    prisma.recurringInvoice.findMany.mockResolvedValue([
      {
        id: 7,
        residentId: 10,
        items: [{ description: 'HOA' }],
        amount: 100,
        dueDaysAfterIssue: 30,
        lateFeeAmount: 0,
        recurrence: 'monthly',
        autopayEnabled: true,
      },
    ]);
    jest.spyOn(service, 'createInvoice').mockResolvedValue({ id: 401 } as any);
    prisma.recurringInvoice.update.mockResolvedValue({});
    prisma.resident.findUnique.mockResolvedValueOnce({ autopayEnabled: true, autopayRetrySchedule: [1, 3, 7] });
    prisma.paymentMethod.findFirst.mockResolvedValue({ id: 88, token: 'tok_default', residentId: 10, isDefault: true });
    prisma.invoice.findUniqueOrThrow.mockResolvedValue({ id: 401, amount: 100, residentId: 10 });
    prisma.paymentIntent.create.mockResolvedValue({ id: 900 });
    tranzilaProvider.createPayment.mockResolvedValue({ providerIntentId: 'pi_auto', raw: { ok: true } });
    tranzilaProvider.retrieve.mockResolvedValue({ status: 'succeeded', raw: { settled: true } });
    prisma.paymentIntent.update.mockResolvedValue({});
    jest.spyOn(service, 'confirmPayment').mockResolvedValue({ id: 401 } as any);
    prisma.resident.findUnique.mockResolvedValueOnce({ userId: 99 });

    const result = await service.runDueRecurring();

    expect(result.generated).toBe(1);
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 99, type: 'AUTOPAY_SUCCESS' }) }),
    );
  });

});

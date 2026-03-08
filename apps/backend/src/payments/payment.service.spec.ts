import { UnauthorizedException } from '@nestjs/common';
import { PaymentService } from './payment.service';

describe('PaymentService webhook processing', () => {
  let service: PaymentService;
  let prisma: any;
  let tranzilaProvider: any;

  beforeEach(() => {
    prisma = {
      webhookEvent: {
        create: jest.fn(),
        update: jest.fn(),
      },
      paymentIntent: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      invoice: {
        update: jest.fn(),
      },
      providerTransaction: {
        create: jest.fn(),
      },
    };

    tranzilaProvider = {
      name: 'tranzila',
      webhookVerify: jest.fn(),
    };

    service = new PaymentService(prisma as any, {} as any, tranzilaProvider as any, { log: jest.fn() } as any, {} as any);
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
});

import { InternalServerErrorException } from '@nestjs/common';
import { TranzilaProvider, mapProviderStatus } from './tranzila.provider';

describe('TranzilaProvider', () => {
  const baseEnv = {
    TRANZILA_MODE: 'sandbox',
    TRANZILA_TERMINAL_ID: 'term_1',
    TRANZILA_SECRET: 'secret_1',
    TRANZILA_API_BASE_URL: 'https://provider.example',
    TRANZILA_TIMEOUT_MS: '50',
    TRANZILA_WEBHOOK_SECRET: 'whsec_123',
  } as const;

  beforeEach(() => {
    jest.restoreAllMocks();
    Object.assign(process.env, baseEnv);
  });

  afterAll(() => {
    (global as any).fetch = undefined;
  });

  it('maps provider statuses into internal lifecycle statuses', () => {
    expect(mapProviderStatus('approved')).toBe('succeeded');
    expect(mapProviderStatus('pending_3ds')).toBe('requires_action');
    expect(mapProviderStatus('processing')).toBe('processing');
    expect(mapProviderStatus('declined')).toBe('failed');
  });

  it('creates payment and returns redirect/action details', async () => {
    const provider = new TranzilaProvider();
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          id: 'pi_1',
          status: 'redirect_required',
          redirectUrl: 'https://checkout.example/1',
          cardToken: 'tok_sensitive',
        }),
    });

    const result = await provider.createPayment({ amount: 123, currency: 'NIS', metadata: { invoiceId: 12 } });

    expect(result).toMatchObject({
      providerIntentId: 'pi_1',
      redirectUrl: 'https://checkout.example/1',
      requiresAction: true,
    });
    expect(result.raw.cardToken).toBe('[REDACTED]');
  });

  it('throws when provider responds with non-OK status', async () => {
    const provider = new TranzilaProvider();
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
      text: async () => JSON.stringify({ message: 'bad gateway' }),
    });

    await expect(provider.retrieve('pi_1')).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('aborts long-running requests using timeout', async () => {
    jest.useFakeTimers();
    process.env.TRANZILA_TIMEOUT_MS = '5';
    const provider = new TranzilaProvider();

    (global as any).fetch = jest.fn().mockImplementation((_url: string, init: any) => {
      return new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new Error('aborted')));
      });
    });

    const promise = provider.retrieve('pi_1');
    const assertion = expect(promise).rejects.toThrow('aborted');
    await jest.advanceTimersByTimeAsync(20);

    await assertion;
    jest.useRealTimers();
  });

  it('fails startup when production webhook secret is missing', () => {
    process.env.TRANZILA_MODE = 'production';
    delete process.env.TRANZILA_WEBHOOK_SECRET;
    const provider = new TranzilaProvider();

    expect(() => provider.onModuleInit()).toThrow(InternalServerErrorException);
  });
});

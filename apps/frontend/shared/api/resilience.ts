import { authFetch } from '../../lib/auth';

export type FetchResult<T> =
  | { ok: true; data: T; fromFallback: false }
  | { ok: true; data: T; fromFallback: true }
  | { ok: false; error: string; statusCode: number };

export type FallbackConfig<T> = {
  fallbackData: T;
  shouldFallback?: (statusCode: number) => boolean;
  onFallback?: (error: string) => void;
};

const DEFAULT_SHOULD_FALLBACK = (status: number) => status >= 500 || status === 0;

/**
 * Fetch with graceful degradation. Returns fallback data on transient failures
 * instead of throwing, allowing the UI to render with degraded but usable content.
 */
export async function resilientFetch<T>(
  path: string,
  config: FallbackConfig<T>,
): Promise<FetchResult<T>> {
  const shouldFallback = config.shouldFallback ?? DEFAULT_SHOULD_FALLBACK;

  try {
    const response = await authFetch(path);

    if (response.ok) {
      const data = await response.json() as T;
      return { ok: true, data, fromFallback: false };
    }

    if (shouldFallback(response.status)) {
      config.onFallback?.(`${path} returned ${response.status}`);
      return { ok: true, data: config.fallbackData, fromFallback: true };
    }

    return {
      ok: false,
      error: `${path} failed with ${response.status}`,
      statusCode: response.status,
    };
  } catch (error) {
    config.onFallback?.(`${path} network error: ${error}`);
    return { ok: true, data: config.fallbackData, fromFallback: true };
  }
}

/**
 * Fetch multiple endpoints in parallel with per-endpoint fallbacks.
 * Failed endpoints use their fallback data; successful ones return live data.
 */
export async function resilientFetchAll<T extends Record<string, unknown>>(
  requests: {
    [K in keyof T]: { path: string; fallback: T[K]; onFallback?: (error: string) => void };
  },
): Promise<{ data: T; degraded: (keyof T)[] }> {
  const keys = Object.keys(requests) as (keyof T)[];
  const results = await Promise.allSettled(
    keys.map((key) => {
      const req = requests[key];
      return resilientFetch<T[typeof key]>(req.path, {
        fallbackData: req.fallback,
        onFallback: req.onFallback,
      });
    }),
  );

  const data = {} as T;
  const degraded: (keyof T)[] = [];

  results.forEach((result, index) => {
    const key = keys[index];
    if (result.status === 'fulfilled' && result.value.ok) {
      data[key] = result.value.data;
      if (result.value.fromFallback) {
        degraded.push(key);
      }
    } else {
      data[key] = requests[key].fallback;
      degraded.push(key);
    }
  });

  return { data, degraded };
}

/**
 * Retry a fetch with exponential backoff.
 */
export async function fetchWithRetry<T>(
  path: string,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    shouldRetry?: (status: number) => boolean;
  } = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const shouldRetry = options.shouldRetry ?? ((status) => status >= 500 || status === 429);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await authFetch(path);

      if (response.ok) {
        return await response.json() as T;
      }

      if (!shouldRetry(response.status) || attempt === maxRetries) {
        throw new Error(`${path} failed with ${response.status}`);
      }

      lastError = new Error(`${path} returned ${response.status}`);
    } catch (error) {
      if (attempt === maxRetries) {
        throw lastError ?? error;
      }
      lastError = error as Error;
    }

    const delay = baseDelayMs * Math.pow(2, attempt);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw lastError ?? new Error(`${path} failed after ${maxRetries} retries`);
}

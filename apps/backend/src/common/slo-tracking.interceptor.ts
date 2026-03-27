import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export type SloThreshold = {
  p95Ms: number;
  p99Ms: number;
  warningMs: number;
};

const DEFAULT_SLO: SloThreshold = {
  p95Ms: 500,
  p99Ms: 1000,
  warningMs: 2000,
};

const ENDPOINT_SLOS: Record<string, SloThreshold> = {
  'GET /api/v1/dashboard/overview': { p95Ms: 800, p99Ms: 1500, warningMs: 3000 },
  'GET /api/v1/tickets': { p95Ms: 400, p99Ms: 800, warningMs: 1500 },
  'GET /api/v1/buildings': { p95Ms: 300, p99Ms: 600, warningMs: 1000 },
  'GET /api/v1/work-orders': { p95Ms: 300, p99Ms: 600, warningMs: 1000 },
  'GET /api/v1/invoices': { p95Ms: 500, p99Ms: 1000, warningMs: 2000 },
  'GET /api/v1/invoices/collections/summary': { p95Ms: 600, p99Ms: 1200, warningMs: 2000 },
  'GET /api/v1/budgets': { p95Ms: 300, p99Ms: 600, warningMs: 1000 },
  'GET /api/v1/operations/calendar': { p95Ms: 500, p99Ms: 1000, warningMs: 2000 },
  'GET /api/v1/notifications/user/:id': { p95Ms: 200, p99Ms: 500, warningMs: 1000 },
  'GET /api/v1/maintenance/exceptions': { p95Ms: 400, p99Ms: 800, warningMs: 1500 },
  'GET /api/v1/communications/resident-requests': { p95Ms: 400, p99Ms: 800, warningMs: 1500 },
};

type SloMetricEntry = {
  endpoint: string;
  durations: number[];
  violations: number;
  lastViolation?: Date;
};

const metricsStore = new Map<string, SloMetricEntry>();
const MAX_STORED_DURATIONS = 1000;

function getEndpointKey(method: string, url: string): string {
  const cleanUrl = url.split('?')[0].replace(/\/\d+/g, '/:id');
  return `${method} ${cleanUrl}`;
}

function recordMetric(endpointKey: string, durationMs: number, slo: SloThreshold) {
  let entry = metricsStore.get(endpointKey);
  if (!entry) {
    entry = { endpoint: endpointKey, durations: [], violations: 0 };
    metricsStore.set(endpointKey, entry);
  }

  entry.durations.push(durationMs);
  if (entry.durations.length > MAX_STORED_DURATIONS) {
    entry.durations = entry.durations.slice(-MAX_STORED_DURATIONS);
  }

  if (durationMs > slo.p99Ms) {
    entry.violations++;
    entry.lastViolation = new Date();
  }
}

export function getSloMetrics(): SloMetricEntry[] {
  return Array.from(metricsStore.values());
}

export function getSloMetricsForEndpoint(endpointKey: string): SloMetricEntry | undefined {
  return metricsStore.get(endpointKey);
}

export function getPercentile(durations: number[], percentile: number): number {
  if (!durations.length) return 0;
  const sorted = [...durations].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

@Injectable()
export class SloTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('SLO');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const startTime = Date.now();
    const endpointKey = getEndpointKey(method, url);
    const slo = ENDPOINT_SLOS[endpointKey] ?? DEFAULT_SLO;

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startTime;
        recordMetric(endpointKey, durationMs, slo);

        if (durationMs > slo.warningMs) {
          this.logger.warn(
            `SLO WARNING: ${endpointKey} took ${durationMs}ms (warning threshold: ${slo.warningMs}ms)`,
          );
        } else if (durationMs > slo.p99Ms) {
          this.logger.log(
            `SLO p99 breach: ${endpointKey} took ${durationMs}ms (p99: ${slo.p99Ms}ms)`,
          );
        }
      }),
    );
  }
}

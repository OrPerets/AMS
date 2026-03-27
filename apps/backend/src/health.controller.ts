import { Controller, Get } from '@nestjs/common';
import { getSloMetrics, getPercentile } from './common/slo-tracking.interceptor';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return { status: 'ok' };
  }

  @Get('slo')
  sloMetrics() {
    const metrics = getSloMetrics();
    return {
      endpoints: metrics.map((entry) => ({
        endpoint: entry.endpoint,
        sampleCount: entry.durations.length,
        p50Ms: getPercentile(entry.durations, 50),
        p95Ms: getPercentile(entry.durations, 95),
        p99Ms: getPercentile(entry.durations, 99),
        violations: entry.violations,
        lastViolation: entry.lastViolation?.toISOString() ?? null,
      })),
      collectedAt: new Date().toISOString(),
    };
  }
}

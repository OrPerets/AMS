import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { isMobileInteractionFeatureEnabled } from '../lib/mobile-interaction-flags';

const repoRoot = path.resolve(__dirname, '..');

async function read(relativePath: string) {
  return fs.readFile(path.resolve(repoRoot, relativePath), 'utf8');
}

test.describe('sprint 6 hardening regression shields', () => {
  test('sprint 1 + sprint 5 contracts are present in source', async () => {
    const swipeCard = await read('components/ui/mobile-swipe-action-card.tsx');
    const inbox = await read('components/ui/mobile-priority-inbox.tsx');
    const pullHook = await read('hooks/use-pull-to-refresh.ts');
    const pullIndicator = await read('components/ui/pull-to-refresh-indicator.tsx');

    expect(swipeCard).toContain('onUndoWindowStart');
    expect(swipeCard).toContain('swipeCollapseDuration');
    expect(inbox).toContain('interaction_undone');
    expect(pullHook).toContain('pullDistance');
    expect(pullHook).toContain('mapPullDistanceElastic');
    expect(pullIndicator).toContain('deltaSummary');
    expect(pullIndicator).toContain('completedLabel');
  });

  test('each interaction family remains independently flaggable', async () => {
    const primaryActionCard = await read('components/ui/primary-action-card.tsx');
    const swipeCard = await read('components/ui/mobile-swipe-action-card.tsx');
    const drawer = await read('components/ui/ams-drawer.tsx');
    const pullHook = await read('hooks/use-pull-to-refresh.ts');
    const layout = await read('components/Layout.tsx');

    expect(primaryActionCard).toContain("mobile-interactions-card-morph");
    expect(swipeCard).toContain("mobile-interactions-swipe-undo");
    expect(drawer).toContain("mobile-interactions-peek-drawers");
    expect(pullHook).toContain("mobile-interactions-elastic-refresh");
    expect(layout).toContain("mobile-interactions-live-choreography");
  });

  test('mobile interaction flags honor authenticated snapshot context', () => {
    expect(
      isMobileInteractionFeatureEnabled('mobile-interactions-swipe-undo', {
        accessToken: 't',
        refreshToken: 't',
        payload: { role: 'PM', sub: 7 },
        role: 'PM',
        userId: 7,
        isAuthenticated: true,
      }),
    ).toBe(true);

    expect(
      isMobileInteractionFeatureEnabled('mobile-interactions-swipe-undo', {
        accessToken: null,
        refreshToken: null,
        payload: null,
        role: null,
        userId: null,
        isAuthenticated: false,
      }),
    ).toBe(false);
  });
});

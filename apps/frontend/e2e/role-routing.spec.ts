import { expect, test } from '@playwright/test';
import { resolvePostLoginRoute, resolveWorkspaceRoute } from '../lib/route-resolver';

test.describe('role routing resolver', () => {
  test('unit: normalizes resident and sends to resident account', () => {
    const resolution = resolvePostLoginRoute({
      isAuthenticated: true,
      role: 'tenant',
    });

    expect(resolution.destination).toBe('/resident/account');
    expect(resolution.normalizedRole).toBe('RESIDENT');
  });

  test('unit: resolves impersonated PM into role-selection', () => {
    const resolution = resolvePostLoginRoute({
      isAuthenticated: true,
      role: 'property_manager',
    });

    expect(resolution.destination).toBe('/role-selection');
    expect(resolution.normalizedRole).toBe('PM');
  });

  test('unit: unsupported role is flagged', () => {
    const resolution = resolvePostLoginRoute({
      isAuthenticated: true,
      role: 'GUEST_VENDOR',
    });

    expect(resolution.destination).toBe('/role-selection');
    expect(resolution.unsupportedRole).toBe(true);
  });

  test('integration: login destination matrix by role', () => {
    const cases = [
      { role: 'RESIDENT', expected: '/resident/account' },
      { role: 'PM', expected: '/role-selection' },
      { role: 'TECH', expected: '/role-selection' },
      { role: 'ADMIN', expected: '/role-selection' },
      { role: 'ACCOUNTANT', expected: '/role-selection' },
      { role: 'MASTER', expected: '/role-selection' },
    ] as const;

    for (const entry of cases) {
      const resolution = resolvePostLoginRoute({ isAuthenticated: true, role: entry.role });
      expect(resolution.destination, `role ${entry.role}`).toBe(entry.expected);
    }
  });

  test('integration: workspace destination matrix by role', () => {
    expect(resolveWorkspaceRoute('ams', 'PM')?.destination).toBe('/home');
    expect(resolveWorkspaceRoute('gardens', 'PM')?.destination).toBe('/gardens');
    expect(resolveWorkspaceRoute('ams', 'RESIDENT')?.destination).toBe('/resident/account');
    expect(resolveWorkspaceRoute('gardens', 'ACCOUNTANT')).toBeNull();
    expect(resolveWorkspaceRoute('supervision', 'ADMIN')?.destination).toMatch(/^https:\/\//);
  });
});

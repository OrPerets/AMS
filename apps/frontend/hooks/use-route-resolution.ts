import { useMemo } from 'react';
import type { WorkspaceChoice } from '../lib/auth';
import { resolvePostLoginRoute, resolveWorkspaceRoute } from '../lib/route-resolver';

type PostLoginInput = {
  isAuthenticated: boolean;
  role?: string | null;
  next?: string | null;
  portal?: 'resident' | 'worker';
};

export function usePostLoginResolution(input: PostLoginInput) {
  return useMemo(
    () => resolvePostLoginRoute(input),
    [input.isAuthenticated, input.role, input.next, input.portal],
  );
}

export function useWorkspaceChoiceResolution(choice: WorkspaceChoice, role?: string | null) {
  return useMemo(() => resolveWorkspaceRoute(choice, role), [choice, role]);
}

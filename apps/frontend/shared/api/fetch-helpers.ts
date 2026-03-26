import { authFetch } from '../../lib/auth';

export type ApiErrorResponse = {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp?: string;
  path?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type ApiListResponse<T> = {
  items: T[];
  summary?: Record<string, number>;
  meta?: {
    total: number;
  };
};

export async function fetchRequiredJson<T>(path: string): Promise<T> {
  const response = await authFetch(path);
  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchOptionalJson<T>(path: string): Promise<T | null> {
  try {
    return await fetchRequiredJson<T>(path);
  } catch {
    return null;
  }
}

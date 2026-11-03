import { cookies } from 'next/headers';

const API_BASE_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message: string;
    details?: unknown;
  };
  message?: string;
}

/**
 * Server-side API client for calling NestJS backend from Next.js Server Components and Server Actions.
 * Automatically forwards HttpOnly session cookies.
 */
export async function serverFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;

  const cookieHeader = [
    accessToken ? `access_token=${accessToken}` : '',
    refreshToken ? `refresh_token=${refreshToken}` : '',
  ]
    .filter(Boolean)
    .join('; ');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (cookieHeader) {
    headers['Cookie'] = cookieHeader;
  }
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const url = `${API_BASE_URL.replace(/\/$/, '')}${
    endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  }`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      cache: options.cache || 'no-store',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: {
          code: data?.error?.code || `HTTP_${res.status}`,
          message: data?.message || data?.error?.message || 'API request failed',
          details: data?.error?.details || data?.message,
        },
      };
    }

    if (data && typeof data === 'object' && !('success' in data)) {
      return {
        success: true,
        data: data as T,
      };
    }

    return data;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error';
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: errorMsg,
      },
    };
  }
}

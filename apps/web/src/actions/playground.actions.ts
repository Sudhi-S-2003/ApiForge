'use server';

import { serverFetch } from '@/lib/api-client';

export interface ExecuteRequestParams {
  method: string;
  url: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: any;
  variables?: Array<{ key: string; value: string }>;
  endpointId?: string;
}

export interface ExecutionResult {
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  durationMs: number;
  responseSizeBytes: number;
}

/**
 * Server Action: Executes outbound HTTP test requests via the NestJS SSRF-hardened backend proxy.
 * Eliminates CORS issues, handles session cookies securely, and guarantees JSON responses.
 */
export async function executePlaygroundRequestAction(params: ExecuteRequestParams) {
  try {
    const res = await serverFetch<ExecutionResult>('/api/v1/playground/execute', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (!res.success) {
      return {
        success: false,
        error: res.error?.message || res.message || 'Request execution failed',
      };
    }

    return {
      success: true,
      data: res.data,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error during execution';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server Action: Retrieve execution history for the current user.
 */
export async function getPlaygroundHistoryAction() {
  try {
    const res = await serverFetch<any[]>('/api/v1/playground/history');
    return res.data || [];
  } catch {
    return [];
  }
}

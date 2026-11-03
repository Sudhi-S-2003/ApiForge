'use server';

import { serverFetch } from '../lib/api-client';

export interface ImportResultDto {
  versionId: string;
  format: string;
  endpointsImported: number;
  schemasImported: number;
  warnings: string[];
  unsupportedFeatures: string[];
}

export async function importOpenApiAction(
  projectId: string,
  content: string,
): Promise<{ success: boolean; data?: ImportResultDto; error?: string }> {
  try {
    const res = await serverFetch<ImportResultDto>(`/api/v1/import/${projectId}/openapi`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });

    if (res.error) {
      return { success: false, error: res.error.message || 'Import failed' };
    }

    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to import OpenAPI spec' };
  }
}

export async function importPostmanAction(
  projectId: string,
  content: string,
): Promise<{ success: boolean; data?: ImportResultDto; error?: string }> {
  try {
    const res = await serverFetch<ImportResultDto>(`/api/v1/import/${projectId}/postman`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });

    if (res.error) {
      return { success: false, error: res.error.message || 'Import failed' };
    }

    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to import Postman collection' };
  }
}

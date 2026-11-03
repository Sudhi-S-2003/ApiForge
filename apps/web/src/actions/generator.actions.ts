'use server';

import { serverFetch } from '@/lib/api-client';

export interface ArtifactResponse {
  token: string;
  downloadUrl: string;
  sizeBytes: number;
}

/**
 * Server Action: Generates a vector PDF / print-ready technical documentation manual.
 * Avoids browser CORS and relative fetch 404s.
 */
export async function generatePdfAction(versionId: string) {
  try {
    const rawRes: any = await serverFetch<ArtifactResponse>(`/api/v1/generator/${versionId}/pdf`, {
      method: 'POST',
    });

    if (rawRes?.error) {
      return {
        success: false,
        error: rawRes.error.message || 'Failed to generate PDF documentation manual',
      };
    }

    const artifactData: ArtifactResponse | null =
      rawRes?.data?.downloadUrl ? rawRes.data :
      rawRes?.downloadUrl ? rawRes :
      null;

    if (!artifactData) {
      return {
        success: false,
        error: rawRes?.message || 'Failed to generate PDF documentation manual',
      };
    }

    return {
      success: true,
      data: artifactData,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to generate PDF',
    };
  }
}

/**
 * Server Action: Packages complete archive with OpenAPI JSON/YAML, Postman Collection, and Docs.
 */
export async function packageZipAction(versionId: string) {
  try {
    const rawRes: any = await serverFetch<ArtifactResponse>(`/api/v1/generator/${versionId}/zip`, {
      method: 'POST',
    });

    if (rawRes?.error) {
      return {
        success: false,
        error: rawRes.error.message || 'Failed to package ZIP archive',
      };
    }

    const artifactData: ArtifactResponse | null =
      rawRes?.data?.downloadUrl ? rawRes.data :
      rawRes?.downloadUrl ? rawRes :
      null;

    if (!artifactData) {
      return {
        success: false,
        error: rawRes?.message || 'Failed to package ZIP archive',
      };
    }

    return {
      success: true,
      data: artifactData,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to package ZIP',
    };
  }
}

'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '@/lib/api-client';
import { CanonicalEndpoint, CanonicalFolder } from '@apiforge/shared';

export async function saveEndpointAction(
  versionId: string,
  endpoint: Partial<CanonicalEndpoint> & { id?: string },
) {
  let res;
  if (endpoint.id) {
    res = await serverFetch(`/api/v1/endpoints/${endpoint.id}`, {
      method: 'PATCH',
      body: JSON.stringify(endpoint),
    });
  } else {
    res = await serverFetch(`/api/v1/versions/${versionId}/endpoints`, {
      method: 'POST',
      body: JSON.stringify(endpoint),
    });
  }

  if (!res.success) {
    return { error: res.error?.message || 'Failed to save endpoint' };
  }

  revalidatePath('/editor');
  return { success: true, data: res.data };
}

export async function deleteEndpointAction(endpointId: string) {
  const res = await serverFetch(`/api/v1/endpoints/${endpointId}`, {
    method: 'DELETE',
  });

  if (!res.success) {
    return { error: res.error?.message || 'Failed to delete endpoint' };
  }

  revalidatePath('/editor');
  return { success: true };
}

export async function duplicateEndpointAction(endpointId: string) {
  const res = await serverFetch(`/api/v1/endpoints/${endpointId}/duplicate`, {
    method: 'POST',
  });

  if (!res.success) {
    return { error: res.error?.message || 'Failed to duplicate endpoint' };
  }

  revalidatePath('/editor');
  return { success: true, data: res.data };
}

export async function createFolderAction(versionId: string, name: string) {
  const res = await serverFetch(`/api/v1/versions/${versionId}/folders`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

  if (!res.success) {
    return { error: res.error?.message || 'Failed to create folder' };
  }

  revalidatePath('/editor');
  return { success: true, data: res.data };
}

export async function fetchContractAction(versionId: string) {
  const res = await serverFetch(`/api/v1/versions/${versionId}/contract`);
  if (!res.success) {
    return null;
  }
  return res.data;
}

'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '@/lib/api-client';

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  _count: {
    projects: number;
    members: number;
  };
  members: Array<{ role: string }>;
}

export async function getUserWorkspacesAction() {
  const res = await serverFetch<WorkspaceSummary[]>('/api/v1/workspaces');
  if (!res.success) {
    return [];
  }
  return res.data || [];
}

export async function createWorkspaceAction(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  if (!name) {
    return { error: 'Workspace name is required' };
  }

  const res = await serverFetch('/api/v1/workspaces', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });

  if (!res.success) {
    return { error: res.error?.message || 'Failed to create workspace' };
  }

  revalidatePath('/dashboard');
  return { success: true, data: res.data };
}

export interface WorkspaceDetail {
  id: string;
  name: string;
  slug: string;
  description?: string;
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };
  }>;
  projects: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    versions: Array<{
      id: string;
      semver: string;
      status: string;
      isLatest: boolean;
    }>;
  }>;
}

export async function getWorkspaceAction(workspaceId: string): Promise<WorkspaceDetail | null> {
  const res = await serverFetch<WorkspaceDetail>(`/api/v1/workspaces/${workspaceId}`);
  if (!res.success || !res.data) {
    return null;
  }
  return res.data;
}

export async function createProjectAction(
  workspaceId: string,
  data: {
    name: string;
    slug?: string;
    description?: string;
    initialVersion?: string;
  },
) {
  const res = await serverFetch<any>(`/api/v1/workspaces/${workspaceId}/projects`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!res.success) {
    return { error: res.error?.message || 'Failed to create project' };
  }

  revalidatePath('/dashboard');
  return { success: true, data: res.data };
}

export async function inviteMemberAction(
  workspaceId: string,
  email: string,
  role: 'ADMIN' | 'EDITOR' | 'VIEWER' = 'EDITOR',
) {
  const res = await serverFetch<any>(`/api/v1/workspaces/${workspaceId}/members/invite`, {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });

  if (!res.success) {
    return { error: res.error?.message || 'Failed to invite member' };
  }

  revalidatePath('/team');
  return { success: true, data: res.data };
}

export async function removeMemberAction(workspaceId: string, userId: string) {
  const res = await serverFetch<any>(`/api/v1/workspaces/${workspaceId}/members/${userId}`, {
    method: 'DELETE',
  });

  if (!res.success) {
    return { error: res.error?.message || 'Failed to remove member' };
  }

  revalidatePath('/team');
  return { success: true };
}

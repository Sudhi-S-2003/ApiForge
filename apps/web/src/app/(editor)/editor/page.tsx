import { redirect } from 'next/navigation';
import { getCurrentUserAction } from '@/actions/auth.actions';
import { getUserWorkspacesAction, getWorkspaceAction } from '@/actions/workspace.actions';
import { serverFetch } from '@/lib/api-client';
import { ContractStudio } from '@/components/editor/ContractStudio';
import { CanonicalContract } from '@apiforge/shared';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function EditorPage({
  searchParams,
}: {
  searchParams: { versionId?: string; projectId?: string };
}) {
  const user = await getCurrentUserAction();
  if (!user) redirect('/login');

  const workspaces = await getUserWorkspacesAction();
  if (workspaces.length === 0) redirect('/dashboard');

  const primaryWorkspace = await getWorkspaceAction(workspaces[0].id);
  const projects = primaryWorkspace?.projects || [];

  if (projects.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center bg-background">
        <h2 className="text-xl font-bold">No API Projects Found</h2>
        <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-md">
          Please create an API project first from your dashboard before opening the Contract Studio.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Go to Dashboard
        </Link>
      </div>
    );
  }

  // Determine active project and version safely
  const activeProject =
    (searchParams.projectId ? projects.find((p: any) => p.id === searchParams.projectId) : null) ||
    projects[0];

  const versions = activeProject?.versions || [];
  const version =
    (searchParams.versionId ? versions.find((v: any) => v.id === searchParams.versionId) : null) ||
    versions[0] || { id: 'default-version', semver: '1.0.0' };

  let contractData: CanonicalContract | null = null;
  if (version.id !== 'default-version') {
    const contractRes = await serverFetch<CanonicalContract>(
      `/api/v1/versions/${version.id}/contract`,
    );
    if (contractRes.success && contractRes.data) {
      contractData = contractRes.data;
    }
  }

  const initialContract: CanonicalContract = contractData || {
    id: version.id,
    name: activeProject?.name || 'Untitled API',
    version: version.semver || '1.0.0',
    description: activeProject?.description || '',
    servers: [],
    tags: [],
    folders: [],
    endpoints: [],
    reusableSchemas: {},
    securitySchemes: {},
  };

  return (
    <ContractStudio
      initialContract={initialContract}
      versionId={version.id}
      projectId={activeProject?.id}
    />
  );
}

import { redirect } from 'next/navigation';
import { getCurrentUserAction } from '@/actions/auth.actions';
import { getUserWorkspacesAction, getWorkspaceAction } from '@/actions/workspace.actions';
import { serverFetch } from '@/lib/api-client';
import { DocsViewer } from '@/components/docs/DocsViewer';
import { CanonicalContract } from '@apiforge/shared';
import Link from 'next/link';
import { Plus, ArrowLeft } from 'lucide-react';

export default async function InternalDocsPage({
  searchParams,
}: {
  searchParams: { versionId?: string; projectId?: string };
}) {
  const user = await getCurrentUserAction();
  if (!user) redirect('/login');

  const workspaces = await getUserWorkspacesAction();
  if (!workspaces || workspaces.length === 0) redirect('/dashboard');

  const primaryWorkspace = await getWorkspaceAction(workspaces[0].id);
  const projects = primaryWorkspace?.projects || [];

  if (projects.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center bg-background">
        <h2 className="text-xl font-bold">No API Projects Found</h2>
        <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-md">
          Please create an API project first from your dashboard before generating interactive documentation.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Create API Project
          </Link>
        </div>
      </div>
    );
  }

  // Find targeted project and version
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

  const contract: CanonicalContract = contractData || {
    id: version.id,
    name: activeProject?.name || 'API Documentation',
    version: version.semver || '1.0.0',
    description: activeProject?.description || 'Interactive API documentation suite.',
    servers: [{ id: 'server-1', url: 'http://localhost:4000/api/v1', description: 'Local Development Server' }],
    tags: [],
    folders: [],
    endpoints: [],
    reusableSchemas: {},
    securitySchemes: {},
  };

  return <DocsViewer contract={contract} versionId={version.id} />;
}

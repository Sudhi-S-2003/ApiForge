import Link from 'next/link';
import { getUserWorkspacesAction, getWorkspaceAction } from '@/actions/workspace.actions';
import { getCurrentUserAction } from '@/actions/auth.actions';
import { UserNavDropdown } from '@/components/navigation/UserNavDropdown';
import { Plus, FolderPlus, ArrowRight, Layers, FileCode, Users, Terminal, ExternalLink } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getCurrentUserAction();
  const workspaces = await getUserWorkspacesAction();
  const primaryWorkspaceSummary = workspaces[0];

  const primaryWorkspace = primaryWorkspaceSummary
    ? await getWorkspaceAction(primaryWorkspaceSummary.id)
    : null;

  const projects = primaryWorkspace?.projects || [];

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your API contract definitions, documentation suites, and active test environments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New API Project</span>
          </Link>
          {user && <UserNavDropdown user={user} />}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Active Workspaces</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-3xl font-bold">{workspaces.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Primary: {primaryWorkspace?.name || 'Default Workspace'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">API Contracts</span>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-3xl font-bold">{projects.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Versioned & schema-validated</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Interactive Tools</span>
            <FileCode className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-sm font-medium text-foreground">Playground & Docs</div>
          <p className="text-xs text-muted-foreground mt-1">SSRF-safe testing & Stripe-style docs</p>
        </div>
      </div>

      {/* Projects Grid / Empty State */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Recent Projects</h2>
          {projects.length > 0 && (
            <Link
              href="/projects/new"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add another project</span>
            </Link>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-card/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
              <FolderPlus className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">No API projects yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
              Create your first API project to begin visually modeling endpoints, request schemas, and responses.
            </p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create First API Project</span>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project: any) => {
              const versions = project?.versions || [];
              const latestVersion = versions[0] || null;
              const versionId = latestVersion?.id || '';

              return (
                <div
                  key={project.id}
                  className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs hover:border-primary/50 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                        ⚡
                      </div>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-mono font-medium text-muted-foreground">
                        v{latestVersion?.semver || '1.0.0'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {project.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border mt-5 pt-3 flex items-center justify-between">
                    <Link
                      href={`/editor?projectId=${project.id}&versionId=${versionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>Open Studio</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>

                    <div className="flex items-center gap-1">
                      <Link
                        href="/playground"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="API Playground (opens in new tab)"
                      >
                        <Terminal className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href={`/docs?projectId=${project.id}&versionId=${versionId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="Interactive Documentation (opens in new tab)"
                      >
                        <FileCode className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

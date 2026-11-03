import { redirect } from 'next/navigation';
import { getCurrentUserAction } from '@/actions/auth.actions';
import { getUserWorkspacesAction, getWorkspaceAction } from '@/actions/workspace.actions';
import { InviteMemberForm } from './InviteMemberForm';
import { Users, Shield, ShieldCheck, UserCheck, Eye, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function TeamPage() {
  const user = await getCurrentUserAction();
  if (!user) redirect('/login');

  const workspaces = await getUserWorkspacesAction();
  if (workspaces.length === 0) redirect('/dashboard');

  const primaryWorkspace = await getWorkspaceAction(workspaces[0].id);
  const members = primaryWorkspace?.members || [];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-500 border border-purple-500/20">
            <ShieldCheck className="h-3 w-3" /> OWNER
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-500 border border-blue-500/20">
            <Shield className="h-3 w-3" /> ADMIN
          </span>
        );
      case 'EDITOR':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
            <UserCheck className="h-3 w-3" /> EDITOR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            <Eye className="h-3 w-3" /> VIEWER
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Projects
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Team & RBAC</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage members, roles, and granular workspace permissions for{' '}
            <strong className="text-foreground">{primaryWorkspace?.name || 'Workspace'}</strong>.
          </p>
        </div>
      </div>

      {/* Invite Member Section */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Invite Team Member</h2>
            <p className="text-xs text-muted-foreground">
              Add collaborators with role-based access control.
            </p>
          </div>
        </div>

        {primaryWorkspace && <InviteMemberForm workspaceId={primaryWorkspace.id} />}
      </div>

      {/* Active Members Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-border bg-muted/20">
          <h2 className="text-sm font-semibold tracking-tight">Active Members ({members.length})</h2>
        </div>

        <div className="divide-y divide-border">
          {members.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No members found in this workspace.
            </div>
          ) : (
            members.map((member: any) => {
              const u = member.user || { name: 'Member', email: 'user@example.com' };
              const initial = (u.name || u.email || 'U').charAt(0).toUpperCase();

              return (
                <div key={member.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold text-xs">
                      {initial}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getRoleBadge(member.role)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RBAC Reference */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <h3 className="text-sm font-semibold mb-3">Workspace Role Matrix</h3>
        <div className="grid gap-3 sm:grid-cols-4 text-xs">
          <div className="rounded-lg border border-border p-3 bg-muted/20">
            <div className="font-semibold text-purple-500 mb-1">OWNER</div>
            <p className="text-muted-foreground">Full workspace ownership, billing, delete workspace.</p>
          </div>
          <div className="rounded-lg border border-border p-3 bg-muted/20">
            <div className="font-semibold text-blue-500 mb-1">ADMIN</div>
            <p className="text-muted-foreground">Manage members, invite users, update metadata.</p>
          </div>
          <div className="rounded-lg border border-border p-3 bg-muted/20">
            <div className="font-semibold text-emerald-500 mb-1">EDITOR</div>
            <p className="text-muted-foreground">Create projects, author endpoints, build schemas.</p>
          </div>
          <div className="rounded-lg border border-border p-3 bg-muted/20">
            <div className="font-semibold text-muted-foreground mb-1">VIEWER</div>
            <p className="text-muted-foreground">Read-only documentation and playground access.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

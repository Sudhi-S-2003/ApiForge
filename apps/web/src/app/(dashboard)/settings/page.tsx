import { redirect } from 'next/navigation';
import { getCurrentUserAction } from '@/actions/auth.actions';
import { getUserWorkspacesAction, getWorkspaceAction } from '@/actions/workspace.actions';
import { Settings, Shield, HardDrive, Key, User, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default async function SettingsPage() {
  const user = await getCurrentUserAction();
  if (!user) redirect('/login');

  const workspaces = await getUserWorkspacesAction();
  const primaryWorkspace = workspaces[0] ? await getWorkspaceAction(workspaces[0].id) : null;

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
          <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Workspace configuration, local storage vault status, and security preferences.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Account Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold">User Profile</h2>
              <p className="text-xs text-muted-foreground">Your authenticated account credentials</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-muted-foreground">Display Name</span>
              <p className="font-semibold text-foreground text-sm">{user.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email Address</span>
              <p className="font-semibold text-foreground text-sm">{user.email}</p>
            </div>
            <div>
              <span className="text-muted-foreground">User ID</span>
              <p className="font-mono text-muted-foreground text-[11px] break-all">{user.id}</p>
            </div>
          </div>
        </div>

        {/* Workspace Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Workspace Settings</h2>
              <p className="text-xs text-muted-foreground">Default active organization workspace</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-muted-foreground">Workspace Name</span>
              <p className="font-semibold text-foreground text-sm">{primaryWorkspace?.name || 'Default'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Workspace Slug</span>
              <p className="font-mono text-muted-foreground text-[11px]">{primaryWorkspace?.slug || 'default'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Description</span>
              <p className="text-muted-foreground">{primaryWorkspace?.description || 'No description'}</p>
            </div>
          </div>
        </div>

        {/* Storage Vault Status */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <HardDrive className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Local Storage Vault</h2>
              <p className="text-xs text-muted-foreground">Zero cloud cost local filesystem storage</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Storage Engine</span>
              <span className="font-semibold text-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Local Filesystem
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Vault Directory</span>
              <span className="font-mono text-[11px] text-muted-foreground">./storage/exports</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Streaming Downloads</span>
              <span className="text-emerald-500 font-semibold">Opaque Hash Tokens</span>
            </div>
          </div>
        </div>

        {/* Security & SSRF Defense */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Security & Defenses</h2>
              <p className="text-xs text-muted-foreground">Hardened proxy and cryptographic protections</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Password Hashing</span>
              <span className="font-semibold text-foreground">Argon2id (Salted & Peppered)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">SSRF Proxy Defense</span>
              <span className="font-semibold text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Socket IP Pinning Active
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Session Token Auth</span>
              <span className="font-semibold text-foreground">HttpOnly Strict JWT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

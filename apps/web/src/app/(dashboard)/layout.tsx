import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserAction } from '@/actions/auth.actions';
import { getUserWorkspacesAction } from '@/actions/workspace.actions';
import { logoutAction } from '@/actions/auth.actions';
import {
  FolderTree,
  Play,
  Building,
  LogOut,
  Users,
  Settings,
  Layers,
  FileCode,
} from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserAction();
  if (!user) {
    redirect('/login');
  }

  const workspaces = await getUserWorkspacesAction();
  const activeWorkspace = workspaces[0] || null;

  const displayName = user.name || user.email || 'User';
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-6">
          {/* Logo Branding */}
          <Link href="/dashboard" className="flex items-center gap-2 px-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <span className="font-bold text-lg tracking-tight">ApiForge</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium">
              SaaS
            </span>
          </Link>

          {/* Active Workspace Card */}
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Building className="h-3.5 w-3.5" />
              <span className="font-semibold tracking-wider text-[10px]">ACTIVE WORKSPACE</span>
            </div>
            <div className="font-semibold text-sm truncate text-foreground">
              {activeWorkspace?.name || 'Personal Workspace'}
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">
              Role: {activeWorkspace?.members?.[0]?.role || 'OWNER'}
            </div>
          </div>

          {/* Complete Navigation Suite */}
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <FolderTree className="h-4 w-4 text-primary" />
              <span>Projects</span>
            </Link>
            <Link
              href="/editor"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Layers className="h-4 w-4 text-blue-500" />
              <span>Contract Studio</span>
            </Link>
            <Link
              href="/docs"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <FileCode className="h-4 w-4 text-purple-500" />
              <span>Documentation</span>
            </Link>
            <Link
              href="/playground"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Play className="h-4 w-4 text-emerald-500" />
              <span>API Playground</span>
            </Link>
            <Link
              href="/team"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Users className="h-4 w-4 text-amber-500" />
              <span>Team & RBAC</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>

        {/* User Profile & Quick Actions */}
        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                {displayInitial}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-medium truncate">{displayName}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
            </div>
          </div>

          {/* Secondary Links & Sign Out */}
          <div className="space-y-0.5 pt-1">
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

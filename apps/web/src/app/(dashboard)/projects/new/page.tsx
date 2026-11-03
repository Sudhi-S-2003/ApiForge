import { redirect } from 'next/navigation';
import { getCurrentUserAction } from '@/actions/auth.actions';
import { getUserWorkspacesAction } from '@/actions/workspace.actions';
import { CreateProjectForm } from './CreateProjectForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function NewProjectPage() {
  const user = await getCurrentUserAction();
  if (!user) redirect('/login');

  const workspaces = await getUserWorkspacesAction();
  if (workspaces.length === 0) {
    redirect('/dashboard');
  }

  return (
    <div className="p-8 max-w-3xl mx-auto w-full space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Create New API Project</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define an API contract from scratch or immediately import existing OpenAPI / Postman specifications.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <CreateProjectForm workspaces={workspaces} />
      </div>
    </div>
  );
}

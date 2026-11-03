import Link from 'next/link';
import { LoginForm } from './LoginForm';

export const metadata = {
  title: 'Sign In | ApiForge',
  description: 'Sign in to access your API contracts, documentation suites, and playgrounds.',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 shadow-xl">
        <div className="space-y-2 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl shadow-md">
            ⚡
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back to ApiForge</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage API contracts, interactive docs, and mock servers.
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}

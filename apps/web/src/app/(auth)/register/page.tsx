'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { registerAction } from '@/actions/auth.actions';
import { AlertCircle, ArrowRight, Lock, Mail, User } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      {pending ? (
        <span>Creating account...</span>
      ) : (
        <>
          <span>Create Account</span>
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useFormState(registerAction, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">
            ⚡
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create your ApiForge account</h1>
          <p className="text-sm text-muted-foreground">
            Get started with visually authoring and documenting production API contracts.
          </p>
        </div>

        {state?.error && (
          <div className="flex items-center gap-3 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none" htmlFor="name">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Alex Mercer"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="developer@example.com"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none" htmlFor="password">
              Password (min. 8 characters)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <SubmitButton />
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary underline underline-offset-4">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

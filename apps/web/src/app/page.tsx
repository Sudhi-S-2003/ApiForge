import Link from 'next/link';
import { Layers, FileCode, Play, ShieldCheck, ArrowRight, Terminal, LayoutDashboard } from 'lucide-react';
import { getCurrentUserAction } from '@/actions/auth.actions';
import { UserNavDropdown } from '@/components/navigation/UserNavDropdown';

export default async function HomePage() {
  const user = await getCurrentUserAction();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
              ⚡
            </div>
            <span className="font-bold text-xl tracking-tight">ApiForge</span>
          </Link>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium">v1.0.0</span>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 text-primary" />
                <span>Dashboard</span>
              </Link>
              <UserNavDropdown user={user} />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center md:py-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Enterprise-Grade • Zero Cloud Storage Lock-In • SSRF-Hardened</span>
          </div>
          <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            The Modern API Contract & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Documentation Engine
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Visually design API contracts, auto-generate Stripe-caliber documentation, test requests in a secure Postman-style playground, and export vector PDFs and OpenAPI 3.1 specs with zero cloud costs.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              Open Studio <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-input bg-background px-6 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Terminal className="h-4 w-4" /> View Documentation
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="container mx-auto px-4 py-16 border-t border-border/40">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">3-Panel Visual Studio</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Drag-and-drop endpoints, build nested JSON schemas visually, and watch live Monaco JSON sync with Ajv validation in real time.
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                <FileCode className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">Stripe-Caliber Docs</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Server-Side Rendered (SSR) interactive documentation with deep URL hash navigation, parameter tables, and live multi-language code snippets.
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <Play className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">Postman-Style Playground</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Execute test requests through an SSRF-protected proxy with DNS rebinding defenses, latency breakdown, and execution history.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <p>ApiForge © {new Date().getFullYear()} — Engineered for High-Fidelity API Lifecycle Management.</p>
      </footer>
    </div>
  );
}

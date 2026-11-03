'use client';

import React, { useState } from 'react';
import { DocsHeader } from './DocsHeader';
import { DocsSidebar } from './DocsSidebar';
import { EndpointDocCard } from './EndpointDocCard';
import { SearchModal } from './SearchModal';
import { CanonicalContract } from '@apiforge/shared';
import { BookOpen, Key, Globe, ShieldAlert, Database, History } from 'lucide-react';

export function DocsViewer({
  contract,
  versionId,
}: {
  contract: CanonicalContract;
  versionId: string;
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const servers = contract.servers || [];
  const endpoints = contract.endpoints || [];
  const baseUrl = servers[0]?.url || 'https://api.example.com';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Header */}
      <DocsHeader
        apiName={contract.name || 'API Documentation'}
        version={contract.version || '1.0.0'}
        versionId={versionId}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Body */}
      <div className="flex flex-1">
        {/* Left Sticky Sidebar */}
        <DocsSidebar contract={contract} />

        {/* Center & Right Main Documentation Area */}
        <main className="flex-1 px-8 py-10 max-w-7xl mx-auto w-full space-y-16 min-w-0">
          {/* 1. Introduction Section */}
          <section id="introduction" className="space-y-4 pb-8 border-b border-border/60 scroll-mt-20">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-500 uppercase tracking-wider">
              <BookOpen className="h-4 w-4" />
              <span>API Overview</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">{contract.name || 'API Documentation'}</h1>
            <p className="text-base text-muted-foreground max-w-3xl leading-relaxed">
              {contract.description ||
                'Welcome to the official API contract and developer documentation. Use this reference to explore endpoints, data schemas, request parameters, and live code examples.'}
            </p>
          </section>

          {/* 2. Authentication Section */}
          <section id="authentication" className="space-y-4 pb-8 border-b border-border/60 scroll-mt-20">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 uppercase tracking-wider">
              <Key className="h-4 w-4" />
              <span>Authentication</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Security & API Keys</h2>
            <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
              Authenticate requests by including your secret API token in the{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground font-semibold">
                Authorization
              </code>{' '}
              header:
            </p>
            <div className="rounded-lg border border-border bg-card p-4 font-mono text-xs max-w-xl">
              Authorization: Bearer YOUR_API_KEY
            </div>
          </section>

          {/* 3. Base URLs & Environments Section */}
          <section id="environments" className="space-y-4 pb-8 border-b border-border/60 scroll-mt-20">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500 uppercase tracking-wider">
              <Globe className="h-4 w-4" />
              <span>Base URLs</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Environments & Gateways</h2>
            <div className="rounded-lg border border-border divide-y divide-border overflow-hidden max-w-2xl text-xs">
              {servers.length > 0 ? (
                servers.map((srv) => (
                  <div key={srv.id || srv.url} className="p-3 flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground">
                      {srv.description || 'API Server'}
                    </span>
                    <span className="font-mono font-bold text-foreground">{srv.url}</span>
                  </div>
                ))
              ) : (
                <div className="p-3 flex items-center justify-between">
                  <span className="font-semibold text-muted-foreground">Production</span>
                  <span className="font-mono font-bold text-foreground">
                    https://api.example.com/v1
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* 4. Errors & Rate Limits */}
          <section id="errors" className="space-y-4 pb-8 border-b border-border/60 scroll-mt-20">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-500 uppercase tracking-wider">
              <ShieldAlert className="h-4 w-4" />
              <span>Errors & Reliability</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">HTTP Status Codes & Rate Limits</h2>
            <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
              All responses return standard HTTP status codes. Rate limits are set to 100 requests per minute per IP. When limits are exceeded, the API responds with{' '}
              <code className="font-mono text-xs font-bold text-rose-500">429 Too Many Requests</code>.
            </p>
          </section>

          {/* 5. Endpoints Specifications */}
          <div className="space-y-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Endpoints ({endpoints.length})
            </div>
            {endpoints.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No endpoints added to this contract version yet. Open the Contract Studio to create your first endpoint.
              </div>
            ) : (
              endpoints.map((ep) => (
                <EndpointDocCard key={ep.id} endpoint={ep} baseUrl={baseUrl} />
              ))
            )}
          </div>

          {/* 6. Reusable Schemas Section */}
          {contract.reusableSchemas && Object.keys(contract.reusableSchemas).length > 0 && (
            <section id="schemas" className="space-y-6 pt-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-500 uppercase tracking-wider">
                <Database className="h-4 w-4" />
                <span>Data Schemas</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Reusable Schema Registry</h2>
              <div className="space-y-6">
                {Object.entries(contract.reusableSchemas).map(([name, schemaDef]) => (
                  <div
                    key={name}
                    id={`schemas-${name.toLowerCase()}`}
                    className="rounded-xl border border-border p-6 bg-card space-y-3 scroll-mt-20"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold font-mono">{name}</h3>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
                        {schemaDef.type || 'object'}
                      </span>
                    </div>
                    {schemaDef.description && (
                      <p className="text-xs text-muted-foreground">{schemaDef.description}</p>
                    )}
                    <pre className="rounded-lg bg-muted/30 p-4 font-mono text-xs overflow-x-auto">
                      {JSON.stringify(schemaDef, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 7. Changelog */}
          <section id="changelog" className="space-y-4 pt-6 border-t border-border/60 scroll-mt-20">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <History className="h-4 w-4" />
              <span>Changelog</span>
            </div>
            <h2 className="text-xl font-bold">Release History</h2>
            <div className="rounded-lg border border-border p-4 bg-card text-xs space-y-1">
              <div className="font-bold text-foreground">v{contract.version || '1.0.0'}</div>
              <div className="text-muted-foreground">
                Current active semantic contract release.
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Global Search Modal */}
      <SearchModal
        contract={contract}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}

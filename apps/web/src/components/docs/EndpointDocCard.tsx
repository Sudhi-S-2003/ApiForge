'use client';

import React, { useState } from 'react';
import { MethodBadge } from '../editor/MethodBadge';
import { CodeSnippetTabs } from './CodeSnippetTabs';
import { Copy, Check, ShieldCheck, Key } from 'lucide-react';
import { CanonicalEndpoint } from '@apiforge/shared';

export function EndpointDocCard({
  endpoint,
  baseUrl,
}: {
  endpoint: CanonicalEndpoint;
  baseUrl?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [activeBodyTab, setActiveBodyTab] = useState<'schema' | 'example'>('schema');

  const anchorId = `${(endpoint.method || 'get').toLowerCase()}-${(endpoint.path || '').replace(/[^a-zA-Z0-9]/g, '-')}`;

  const handleCopyPath = () => {
    try {
      navigator.clipboard.writeText(endpoint?.path || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const parseSafe = (val: any, fallback: any) => {
    if (!val) return fallback;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return fallback;
      }
    }
    return val;
  };

  const rawParameters = parseSafe(endpoint?.parameters, []);
  const parameters: any[] = Array.isArray(rawParameters) ? rawParameters : [];

  const rawResponses = parseSafe(endpoint?.responses, []);
  const responses: any[] = Array.isArray(rawResponses) ? rawResponses : [];

  const rawTags = parseSafe(endpoint?.tags, []);
  const tags: string[] = Array.isArray(rawTags)
    ? rawTags
    : typeof endpoint?.tags === 'string'
    ? (endpoint.tags as string).split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const pathParams = parameters.filter((p) => String(p?.in || '').toLowerCase() === 'path');
  const queryParams = parameters.filter((p) => String(p?.in || '').toLowerCase() === 'query');
  const headerParams = parameters.filter((p) => String(p?.in || '').toLowerCase() === 'header');

  const rawRequestBody = parseSafe(endpoint?.requestBody, endpoint?.requestBody);
  const requestBodySchema = rawRequestBody?.content?.['application/json']?.schema;
  const requestBodyExample =
    rawRequestBody?.content?.['application/json']?.examples?.['default']?.value ||
    requestBodySchema?.example ||
    {};

  return (
    <section id={anchorId} className="pt-8 pb-12 border-b border-border/60 scroll-mt-20 space-y-6">
      {/* 2-Column Responsive Layout: Left Documentation, Right Code Snippet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: API Specification (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Title & Method */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <MethodBadge method={endpoint?.method || 'GET'} />
              <button
                onClick={handleCopyPath}
                className="group inline-flex items-center gap-1.5 font-mono text-sm font-semibold hover:text-primary transition-colors"
                title="Click to copy path"
              >
                <span>{endpoint?.path || ''}</span>
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                )}
              </button>
            </div>

            <h2 className="text-2xl font-bold tracking-tight">{endpoint?.summary || endpoint?.path || 'Endpoint'}</h2>

            {endpoint?.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {endpoint.description}
              </p>
            )}

            {/* Tags & Security Badges */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {endpoint?.security && endpoint.security.length > 0 && (
                <div className="inline-flex items-center gap-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 text-[11px] font-medium">
                  <Key className="h-3 w-3" />
                  <span>Bearer Auth Required</span>
                </div>
              )}
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* 1. Path Parameters */}
          {pathParams.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Path Parameters
              </h3>
              <ParameterTable parameters={pathParams} />
            </div>
          )}

          {/* 2. Query Parameters */}
          {queryParams.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Query Parameters
              </h3>
              <ParameterTable parameters={queryParams} />
            </div>
          )}

          {/* 3. Header Parameters */}
          {headerParams.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Header Parameters
              </h3>
              <ParameterTable parameters={headerParams} />
            </div>
          )}

          {/* 4. Request Body */}
          {requestBodySchema && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Request Body (application/json)
                </h3>
                <div className="flex rounded border border-border p-0.5 text-xs">
                  <button
                    onClick={() => setActiveBodyTab('schema')}
                    className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
                      activeBodyTab === 'schema'
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Schema
                  </button>
                  <button
                    onClick={() => setActiveBodyTab('example')}
                    className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
                      activeBodyTab === 'example'
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Example
                  </button>
                </div>
              </div>

              {activeBodyTab === 'schema' ? (
                <div className="rounded-lg border border-border divide-y divide-border overflow-hidden text-xs">
                  {Object.entries(requestBodySchema?.properties || {}).map(([propKey, prop]: [string, any]) => {
                    const isRequired = Array.isArray(requestBodySchema?.required) && requestBodySchema.required.includes(propKey);
                    return (
                      <div key={propKey} className="p-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">{propKey}</span>
                          <span className="font-mono text-muted-foreground text-[11px]">
                            {prop?.type || prop?.$ref ? (prop?.$ref ? 'object ($ref)' : prop?.type) : 'any'}
                          </span>
                          {isRequired && (
                            <span className="text-[10px] text-rose-500 font-bold uppercase">
                              required
                            </span>
                          )}
                        </div>
                        {prop?.description && (
                          <div className="text-muted-foreground">{prop.description}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-border p-3 bg-muted/20 font-mono text-xs overflow-x-auto">
                  <pre>{JSON.stringify(requestBodyExample, null, 2)}</pre>
                </div>
              )}
            </div>
          )}

          {/* 5. Response Status Codes */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Responses
            </h3>
            <div className="space-y-2">
              {responses.map((resp) => {
                const codeStr = String(resp?.statusCode || '200');
                const is2xx = codeStr.startsWith('2');

                return (
                  <div
                    key={codeStr}
                    className="flex items-start gap-3 rounded-lg border border-border p-3 text-xs"
                  >
                    <span
                      className={`rounded px-2 py-0.5 font-mono font-bold text-[11px] ${
                        is2xx
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}
                    >
                      {codeStr}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium">{resp?.description || 'Response'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Code Snippet & Response Preview (5 Cols) */}
        <div className="lg:col-span-5 sticky top-20">
          <CodeSnippetTabs endpoint={endpoint} baseUrl={baseUrl} />
        </div>
      </div>
    </section>
  );
}

function ParameterTable({ parameters }: { parameters: any[] }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 border-b border-border text-muted-foreground text-left">
          <tr>
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {parameters.map((p) => (
            <tr key={p?.id || p?.name} className="hover:bg-muted/20">
              <td className="p-3">
                <div className="font-mono font-bold">{p?.name}</div>
                {p?.required && (
                  <span className="text-[10px] text-rose-500 font-bold uppercase">
                    required
                  </span>
                )}
              </td>
              <td className="p-3 font-mono text-muted-foreground text-[11px]">
                {p?.schema?.type || 'string'}
              </td>
              <td className="p-3 text-muted-foreground">
                {p?.description || '—'}
                {p?.example !== undefined && (
                  <div className="mt-1 font-mono text-[10px] text-foreground/80">
                    Example: {String(p.example)}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

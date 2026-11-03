'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  generateCurlSnippet,
  generateFetchSnippet,
  generatePythonSnippet,
  generateGoSnippet,
  CanonicalEndpoint,
} from '@apiforge/shared';
import { Copy, Check, Play } from 'lucide-react';

export function CodeSnippetTabs({
  endpoint,
  baseUrl,
}: {
  endpoint: CanonicalEndpoint;
  baseUrl?: string;
}) {
  const [lang, setLang] = useState<'curl' | 'fetch' | 'python' | 'go'>('curl');
  const [copied, setCopied] = useState(false);

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

  const rawResponses = parseSafe(endpoint?.responses, []);
  const responses: any[] = Array.isArray(rawResponses) ? rawResponses : [];
  const rawParams = parseSafe(endpoint?.parameters, []);
  const parameters: any[] = Array.isArray(rawParams) ? rawParams : [];

  const initialStatus = responses[0]?.statusCode ? String(responses[0].statusCode) : '200';
  const [activeRespTab, setActiveRespTab] = useState<string>(initialStatus);

  const getSnippet = () => {
    // Normalize parameters to lowercase in case backend sent uppercase
    const normalizedEp: CanonicalEndpoint = {
      ...endpoint,
      parameters: parameters.map((p) => ({
        ...p,
        in: (p.in || 'query').toLowerCase() as any,
      })),
    };

    switch (lang) {
      case 'curl':
        return generateCurlSnippet(normalizedEp, { baseUrl });
      case 'fetch':
        return generateFetchSnippet(normalizedEp, { baseUrl });
      case 'python':
        return generatePythonSnippet(normalizedEp, { baseUrl });
      case 'go':
        return generateGoSnippet(normalizedEp, { baseUrl });
      default:
        return generateCurlSnippet(normalizedEp, { baseUrl });
    }
  };

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(getSnippet());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const selectedResponse =
    responses.find((r) => String(r.statusCode) === String(activeRespTab)) || responses[0];

  const responseExample =
    selectedResponse?.content?.['application/json']?.examples?.['default']?.value ||
    selectedResponse?.content?.['application/json']?.schema?.example || {
      status: 'ok',
      message: selectedResponse?.description || 'Success',
    };

  return (
    <div className="space-y-4">
      {/* Code Snippets Card */}
      <div className="rounded-xl border border-border bg-card/80 overflow-hidden shadow-xs">
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5">
          <div className="flex items-center gap-1">
            {[
              { id: 'curl', label: 'cURL' },
              { id: 'fetch', label: 'JavaScript' },
              { id: 'python', label: 'Python' },
              { id: 'go', label: 'Go' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setLang(tab.id as any)}
                className={`rounded px-2.5 py-1 text-xs font-mono transition-colors ${
                  lang === tab.id
                    ? 'bg-background text-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded border border-input bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <Link
              href={`/playground?endpointId=${endpoint.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-medium hover:bg-emerald-500/20 transition-colors"
            >
              <Play className="h-3 w-3" />
              <span>Try It</span>
            </Link>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 bg-muted/10 overflow-x-auto">
          <pre className="font-mono text-xs text-foreground/90 whitespace-pre leading-relaxed">
            {getSnippet()}
          </pre>
        </div>
      </div>

      {/* Response Preview Card */}
      {responses.length > 0 && (
        <div className="rounded-xl border border-border bg-card/80 overflow-hidden shadow-xs">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Response Preview
            </span>
            <div className="flex items-center gap-1">
              {responses.map((resp) => {
                const code = String(resp.statusCode || '200');
                const isSelected = String(activeRespTab) === code;

                return (
                  <button
                    key={code}
                    onClick={() => setActiveRespTab(code)}
                    className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {code}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-muted/10 overflow-x-auto">
            <pre className="font-mono text-xs text-foreground/90 leading-relaxed">
              {JSON.stringify(responseExample, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

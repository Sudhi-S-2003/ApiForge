import React from 'react';
import { HttpMethod } from '@apiforge/shared';

const METHOD_STYLES: Record<HttpMethod, string> = {
  GET: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  POST: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  PUT: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  PATCH: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  DELETE: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  HEAD: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  OPTIONS: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
};

export function MethodBadge({ method }: { method: HttpMethod }) {
  const style = METHOD_STYLES[method] || 'bg-muted text-muted-foreground';
  return (
    <span
      className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase border ${style}`}
    >
      {method}
    </span>
  );
}

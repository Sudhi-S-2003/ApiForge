'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { MethodBadge } from '../editor/MethodBadge';
import { CanonicalContract } from '@apiforge/shared';

export function SearchModal({
  contract,
  isOpen,
  onClose,
}: {
  contract: CanonicalContract;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(); // Toggle
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const endpoints = contract?.endpoints || [];
  const results = endpoints.filter((ep) => {
    const q = (query || '').toLowerCase().trim();
    if (!q) return true;
    const pathStr = (ep.path || '').toLowerCase();
    const summaryStr = (ep.summary || '').toLowerCase();
    const methodStr = (ep.method || '').toLowerCase();
    const tags = ep.tags || [];
    return (
      pathStr.includes(q) ||
      summaryStr.includes(q) ||
      methodStr.includes(q) ||
      tags.some((t) => (t || '').toLowerCase().includes(q))
    );
  });

  const handleSelect = (anchorId: string) => {
    onClose();
    try {
      const el = document.getElementById(anchorId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        if (typeof history !== 'undefined') {
          history.pushState(null, '', `#${anchorId}`);
        }
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-20 p-4 backdrop-blur-xs animate-in fade-in-50">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search endpoints, paths, tags..."
            autoFocus
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No results found for &quot;{query}&quot;.
            </div>
          ) : (
            results.map((ep, idx) => {
              const anchorId = `${(ep.method || 'get').toLowerCase()}-${(ep.path || '').replace(/[^a-zA-Z0-9]/g, '-')}`;
              return (
                <div
                  key={ep.id}
                  onClick={() => handleSelect(anchorId)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs cursor-pointer transition-colors ${
                    idx === selectedIndex
                      ? 'bg-accent text-accent-foreground font-semibold'
                      : 'hover:bg-accent/50 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <MethodBadge method={ep.method || 'GET'} />
                    <div className="overflow-hidden">
                      <div className="font-mono text-foreground font-medium truncate">
                        {ep.path}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {ep.summary || 'No summary'}
                      </div>
                    </div>
                  </div>

                  <ArrowRight className="h-3.5 w-3.5 opacity-50 shrink-0 ml-2" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useEditorStore } from '@/stores/editor-store';
import {
  generateCurlSnippet,
  generateFetchSnippet,
  generatePythonSnippet,
  generateGoSnippet,
} from '@apiforge/shared';
import { AlertCircle, CheckCircle, Code, Copy, Check } from 'lucide-react';

export function RightPanel() {
  const { monacoContent, updateMonacoContent, validationIssues, contract, activeEndpointId } =
    useEditorStore();

  const [view, setView] = useState<'json' | 'snippets' | 'validation'>('json');
  const [snippetLang, setSnippetLang] = useState<'curl' | 'fetch' | 'python' | 'go'>('curl');
  const [copied, setCopied] = useState(false);

  const activeEndpoint = contract?.endpoints.find((ep) => ep.id === activeEndpointId);

  const getActiveSnippet = () => {
    if (!activeEndpoint) return '// Select an endpoint to view generated code snippets';
    switch (snippetLang) {
      case 'curl':
        return generateCurlSnippet(activeEndpoint);
      case 'fetch':
        return generateFetchSnippet(activeEndpoint);
      case 'python':
        return generatePythonSnippet(activeEndpoint);
      case 'go':
        return generateGoSnippet(activeEndpoint);
    }
  };

  const handleCopy = () => {
    const textToCopy = view === 'snippets' ? getActiveSnippet() : monacoContent;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full w-[440px] flex-col border-l border-border bg-card">
      {/* Top Header Switcher */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2 bg-muted/40">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setView('json')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              view === 'json'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Live JSON
          </button>
          <button
            onClick={() => setView('snippets')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              view === 'snippets'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Code Snippets
          </button>
          <button
            onClick={() => setView('validation')}
            className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              view === 'validation'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Validation</span>
            {validationIssues.length > 0 ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground font-bold">
                {validationIssues.length}
              </span>
            ) : (
              <CheckCircle className="h-3 w-3 text-emerald-500" />
            )}
          </button>
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded border border-input bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* View 1: Monaco Editor */}
      {view === 'json' && (
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="json"
            theme="vs-dark"
            value={monacoContent}
            onChange={(val) => updateMonacoContent(val || '{}')}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              formatOnPaste: true,
              formatOnType: true,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
            }}
          />
        </div>
      )}

      {/* View 2: Code Snippets */}
      {view === 'snippets' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Language Selector Bar */}
          <div className="flex items-center gap-1 border-b border-border bg-muted/20 px-3 py-1.5">
            {[
              { id: 'curl', label: 'cURL' },
              { id: 'fetch', label: 'JavaScript' },
              { id: 'python', label: 'Python' },
              { id: 'go', label: 'Go' },
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSnippetLang(lang.id as any)}
                className={`rounded px-2 py-0.5 text-xs font-mono transition-colors ${
                  snippetLang === lang.id
                    ? 'bg-primary/20 text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-4 bg-muted/10 font-mono text-xs">
            <pre className="whitespace-pre-wrap">{getActiveSnippet()}</pre>
          </div>
        </div>
      )}

      {/* View 3: Validation Issues */}
      {view === 'validation' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {validationIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-muted-foreground">
              <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
              <p className="font-semibold text-foreground">Schema is valid!</p>
              <p className="text-muted-foreground">Zero Ajv syntax or structural issues detected.</p>
            </div>
          ) : (
            validationIssues.map((issue, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs"
              >
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-mono font-bold text-destructive">{issue.path}</div>
                  <div className="text-destructive/90">{issue.message}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { importOpenApiAction, importPostmanAction, ImportResultDto } from '../../actions/import-export.actions';

interface ImportModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export function ImportModal({ projectId, isOpen, onClose, onImportComplete }: ImportModalProps) {
  const [importType, setImportType] = useState<'openapi' | 'postman'>('openapi');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResultDto | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please provide specification content or upload a file.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    const action = importType === 'openapi' ? importOpenApiAction : importPostmanAction;
    const res = await action(projectId, content);

    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Import failed');
    } else if (res.data) {
      setResult(res.data);
      if (onImportComplete) {
        setTimeout(onImportComplete, 1500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Import API Specification</h2>
            <p className="text-xs text-muted-foreground">
              Ingest OpenAPI 3.0 / 3.1 YAML/JSON or Postman Collection v2.1 into your project.
            </p>
          </div>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-500">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Specification Imported Successfully!</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Imported {result.endpointsImported} endpoints and {result.schemasImported} reusable schemas.
                </p>
              </div>
            </div>

            {result.warnings.length > 0 && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-500">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Diagnostic Warnings:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                Close & Refresh
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-2 border-b border-border pb-3">
              <button
                type="button"
                onClick={() => setImportType('openapi')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  importType === 'openapi'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                OpenAPI 3.x (JSON / YAML)
              </button>
              <button
                type="button"
                onClick={() => setImportType('postman')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  importType === 'postman'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Postman Collection v2.1
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5">Upload File</label>
              <input
                type="file"
                accept=".json,.yaml,.yml"
                onChange={handleFileUpload}
                className="w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5">Or Paste Raw Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  importType === 'openapi'
                    ? 'openapi: 3.1.0\ninfo:\n  title: My API\n...'
                    : '{\n  "info": {\n    "name": "My Collection"\n  }...\n}'
                }
                rows={10}
                className="w-full rounded-md border border-input bg-background p-3 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-input px-4 py-2 text-xs font-medium hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Parsing & Ingesting...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-3.5 w-3.5" />
                    <span>Import Specification</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

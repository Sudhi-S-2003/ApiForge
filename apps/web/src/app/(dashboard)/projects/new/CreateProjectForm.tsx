'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProjectAction } from '@/actions/workspace.actions';
import { importOpenApiAction, importPostmanAction } from '@/actions/import-export.actions';
import { Layers, UploadCloud, FileCode, Loader2, Sparkles } from 'lucide-react';

interface CreateProjectFormProps {
  workspaces: Array<{ id: string; name: string }>;
}

export function CreateProjectForm({ workspaces }: CreateProjectFormProps) {
  const router = useRouter();

  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id || '');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [initialVersion, setInitialVersion] = useState('1.0.0');

  const [mode, setMode] = useState<'blank' | 'import'>('blank');
  const [importFormat, setImportFormat] = useState<'openapi' | 'postman'>('openapi');
  const [specContent, setSpecContent] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(autoSlug);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSpecContent((event.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Create project
      const projRes = await createProjectAction(workspaceId, {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        initialVersion: initialVersion.trim() || '1.0.0',
      });

      if (!projRes.success || !projRes.data) {
        setError(projRes.error || 'Failed to create project');
        setIsSubmitting(false);
        return;
      }

      const project = projRes.data;
      const projectId = project.id;
      let versionId = project.versions?.[0]?.id;

      // 2. If import mode, ingest the specification
      if (mode === 'import' && specContent.trim()) {
        const importFn = importFormat === 'openapi' ? importOpenApiAction : importPostmanAction;
        const impRes = await importFn(projectId, specContent.trim());
        if (impRes.success && impRes.data?.versionId) {
          versionId = impRes.data.versionId;
        }
      }

      // 3. Navigate to Contract Studio
      router.push(`/editor?projectId=${projectId}&versionId=${versionId || ''}`);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Workspace Selector */}
      {workspaces.length > 1 && (
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Target Workspace</label>
          <select
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Project Name & Slug */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Project Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Payments Gateway API"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            URL Slug <span className="text-muted-foreground font-normal">(auto-generated)</span>
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="payments-gateway-api"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-foreground mb-1.5">Description (Optional)</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the API services, authentication, and use cases..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Initial Version */}
      <div>
        <label className="block text-xs font-medium text-foreground mb-1.5">Initial Semantic Version</label>
        <input
          type="text"
          value={initialVersion}
          onChange={(e) => setInitialVersion(e.target.value)}
          placeholder="1.0.0"
          className="w-32 rounded-md border border-input bg-background px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Creation Mode Tabs */}
      <div className="border-t border-border pt-4">
        <label className="block text-xs font-medium text-foreground mb-2">Getting Started Option</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('blank')}
            className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
              mode === 'blank'
                ? 'border-primary bg-primary/5 text-foreground shadow-xs'
                : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <Sparkles className="h-5 w-5 mt-0.5 text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold">Blank Canvas</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Start clean and visually design endpoints, models, and schemas in the studio.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode('import')}
            className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
              mode === 'import'
                ? 'border-primary bg-primary/5 text-foreground shadow-xs'
                : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <UploadCloud className="h-5 w-5 mt-0.5 text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold">Import Existing Spec</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Upload or paste an OpenAPI 3.x (JSON/YAML) or Postman Collection v2.1.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Import Spec Controls */}
      {mode === 'import' && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 animate-in fade-in">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setImportFormat('openapi')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                importFormat === 'openapi'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground border border-input'
              }`}
            >
              OpenAPI 3.x (YAML / JSON)
            </button>
            <button
              type="button"
              onClick={() => setImportFormat('postman')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                importFormat === 'postman'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground border border-input'
              }`}
            >
              Postman Collection v2.1
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">Upload File</label>
            <input
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleFileUpload}
              className="w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-primary-foreground cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">Or Paste Spec Text</label>
            <textarea
              rows={6}
              value={specContent}
              onChange={(e) => setSpecContent(e.target.value)}
              placeholder={
                importFormat === 'openapi'
                  ? 'openapi: 3.1.0\ninfo:\n  title: My API\n...'
                  : '{\n  "info": {\n    "name": "My Postman Collection"\n  }...\n}'
              }
              className="w-full rounded-md border border-input bg-background p-2.5 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="rounded-md border border-input bg-background px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating Project...</span>
            </>
          ) : (
            <>
              <Layers className="h-4 w-4" />
              <span>Create & Launch Studio</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

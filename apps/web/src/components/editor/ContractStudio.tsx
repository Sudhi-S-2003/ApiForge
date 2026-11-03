'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useEditorStore } from '@/stores/editor-store';
import { LeftPanel } from './LeftPanel';
import { CenterPanel } from './CenterPanel';
import { RightPanel } from './RightPanel';
import { saveEndpointAction } from '@/actions/contract.actions';
import { CanonicalContract } from '@apiforge/shared';
import { ArrowLeft, FileCode, Play, CheckCircle2, RefreshCw, ExternalLink } from 'lucide-react';

export function ContractStudio({
  initialContract,
  versionId,
  projectId,
}: {
  initialContract: CanonicalContract;
  versionId: string;
  projectId?: string;
}) {
  const { setContract, contract, activeEndpointId, isSaving, isDirty, setIsSaving, markSaved } =
    useEditorStore();

  useEffect(() => {
    if (initialContract) {
      setContract(initialContract);
    }
  }, [initialContract, setContract]);

  const handleSave = async () => {
    if (!contract || !activeEndpointId) return;
    const activeEp = contract.endpoints.find((ep) => ep.id === activeEndpointId);
    if (!activeEp) return;

    setIsSaving(true);
    try {
      await saveEndpointAction(versionId, activeEp);
      markSaved();
    } finally {
      setIsSaving(false);
    }
  };

  const projectName = contract?.name || 'API Project';
  const versionSemver = contract?.version || '1.0.0';

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Studio Top Header Bar */}
      <header className="flex h-12 w-full shrink-0 items-center justify-between border-b border-border bg-card px-4">
        {/* Left: Back to Dashboard & Project Breadcrumbs */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>

          <div className="h-4 w-[1px] bg-border" />

          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs tracking-tight text-foreground truncate max-w-[200px]">
              {projectName}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
              v{versionSemver}
            </span>
          </div>
        </div>

        {/* Right: Docs, Playground & Save Status */}
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 px-2 text-[11px] text-muted-foreground">
            {isSaving ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />
                <span>Saving...</span>
              </>
            ) : isDirty ? (
              <span className="text-amber-500 font-medium">Unsaved changes</span>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span>Saved</span>
              </>
            )}
          </div>

          <div className="h-4 w-[1px] bg-border" />

          <Link
            href={`/docs?versionId=${versionId}&projectId=${projectId || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors shadow-2xs"
            title="Open interactive documentation in new tab"
          >
            <FileCode className="h-3.5 w-3.5 text-primary" />
            <span>View Docs</span>
            <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
          </Link>

          <Link
            href="/playground"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors shadow-2xs"
            title="Open API playground in new tab"
          >
            <Play className="h-3.5 w-3.5 text-emerald-500" />
            <span>Playground</span>
            <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
          </Link>
        </div>
      </header>

      {/* 3-Panel Main Area */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        <LeftPanel versionId={versionId} projectId={projectId} />
        <CenterPanel onSave={handleSave} />
        <RightPanel />
      </div>
    </div>
  );
}

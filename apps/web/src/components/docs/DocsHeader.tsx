'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Copy,
  Check,
  Download,
  FileCode,
  FileText,
  Package,
  Layers,
  Sun,
  Moon,
  ChevronDown,
} from 'lucide-react';

import { generatePdfAction, packageZipAction } from '@/actions/generator.actions';

export interface DocsHeaderProps {
  apiName: string;
  version: string;
  versionId: string;
  onOpenSearch: () => void;
}

export function DocsHeader({ apiName, version, versionId, onOpenSearch }: DocsHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerDownload = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const res = await generatePdfAction(versionId);
      if (res.success && res.data?.downloadUrl) {
        triggerDownload(`${apiUrl}${res.data.downloadUrl}`);
      } else {
        alert(res.error || 'Failed to generate PDF manual');
      }
    } catch {
      alert('Failed to generate PDF manual');
    } finally {
      setIsGeneratingPdf(false);
      setIsExportOpen(false);
    }
  };

  const handleDownloadZip = async () => {
    setIsGeneratingZip(true);
    try {
      const res = await packageZipAction(versionId);
      if (res.success && res.data?.downloadUrl) {
        triggerDownload(`${apiUrl}${res.data.downloadUrl}`);
      } else {
        alert(res.error || 'Failed to generate ZIP archive');
      }
    } catch {
      alert('Failed to generate ZIP archive');
    } finally {
      setIsGeneratingZip(false);
      setIsExportOpen(false);
    }
  };

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('dark');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
      {/* Brand & Version Badge */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            ⚡
          </div>
          <span className="font-bold text-base tracking-tight">{apiName}</span>
        </Link>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-mono font-medium text-muted-foreground">
          v{version}
        </span>
      </div>

      {/* Center Search Trigger (Cmd+K) */}
      <button
        onClick={onOpenSearch}
        className="flex w-64 items-center justify-between rounded-md border border-input bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5" />
          <span>Search docs...</span>
        </div>
        <kbd className="rounded bg-background px-1.5 py-0.5 text-[10px] font-mono border border-border shadow-xs">
          ⌘K
        </kbd>
      </button>

      {/* Right Actions: Theme Toggle, Copy Link, Export Menu */}
      <div className="flex items-center gap-2">
        {/* Open in Studio Link */}
        <Link
          href={`/editor?versionId=${versionId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Open in Contract Studio (new tab)"
        >
          <Layers className="h-3.5 w-3.5 text-primary" />
          <span>Studio</span>
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-md border border-input p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? 'Copied' : 'Share'}</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
            <ChevronDown className="h-3 w-3 opacity-80" />
          </button>

          {isExportOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card p-1 shadow-lg z-50 animate-in fade-in-80">
              <a
                href={`${apiUrl}/api/v1/export/${versionId}/openapi/json`}
                download="openapi.json"
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
              >
                <FileCode className="h-4 w-4 text-blue-500" />
                <span>OpenAPI 3.1 (JSON)</span>
              </a>
              <a
                href={`${apiUrl}/api/v1/export/${versionId}/openapi/yaml`}
                download="openapi.yaml"
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
              >
                <FileText className="h-4 w-4 text-amber-500" />
                <span>OpenAPI 3.1 (YAML)</span>
              </a>
              <a
                href={`${apiUrl}/api/v1/export/${versionId}/postman`}
                download="postman_collection.json"
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
              >
                <Layers className="h-4 w-4 text-orange-500" />
                <span>Postman Collection v2.1</span>
              </a>
              <div className="border-t border-border my-1" />
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium hover:bg-accent hover:text-accent-foreground text-left disabled:opacity-50"
              >
                <FileText className="h-4 w-4 text-rose-500" />
                <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Manual'}</span>
              </button>
              <button
                onClick={handleDownloadZip}
                disabled={isGeneratingZip}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium hover:bg-accent hover:text-accent-foreground text-left disabled:opacity-50"
              >
                <Package className="h-4 w-4 text-purple-500" />
                <span>{isGeneratingZip ? 'Packaging ZIP...' : 'Download Complete ZIP'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

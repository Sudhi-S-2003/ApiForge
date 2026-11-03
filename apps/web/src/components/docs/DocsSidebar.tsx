'use client';

import React, { useEffect, useState } from 'react';
import { MethodBadge } from '../editor/MethodBadge';
import {
  BookOpen,
  Key,
  Globe,
  ShieldAlert,
  Folder,
  Database,
  History,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { CanonicalContract } from '@apiforge/shared';

export interface DocsSidebarProps {
  contract: CanonicalContract;
}

export function DocsSidebar({ contract }: { contract: CanonicalContract }) {
  const [activeHash, setActiveHash] = useState<string>('#introduction');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  const folders = contract?.folders || [];
  const endpoints = contract?.endpoints || [];

  useEffect(() => {
    // Read initial URL hash safely
    if (typeof window !== 'undefined' && window.location.hash) {
      const cleanId = window.location.hash.replace(/^#/, '');
      setActiveHash(window.location.hash);
      try {
        const targetEl = document.getElementById(cleanId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      } catch {
        // Safe fallback
      }
    }

    // IntersectionObserver to sync scroll position with active hash
    try {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = `#${entry.target.id}`;
              setActiveHash(id);
              if (typeof history !== 'undefined') {
                history.replaceState(null, '', id);
              }
            }
          });
        },
        { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
      );

      const sections = document.querySelectorAll('section[id]');
      sections.forEach((section) => observer.observe(section));

      return () => observer.disconnect();
    } catch {
      // Safe fallback
    }
  }, []);

  const handleNavClick = (hash: string) => {
    setActiveHash(hash);
    const cleanId = hash.replace(/^#/, '');
    try {
      const target = document.getElementById(cleanId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        if (typeof history !== 'undefined') {
          history.pushState(null, '', hash);
        }
      }
    } catch {
      // Safe fallback
    }
  };

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-72 overflow-y-auto border-r border-border bg-card p-4 space-y-6 text-xs shrink-0">
      {/* 1. Getting Started Navigation */}
      <div className="space-y-1">
        <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Getting Started
        </div>
        <NavItem
          label="Introduction"
          icon={<BookOpen className="h-3.5 w-3.5 text-blue-500" />}
          hash="#introduction"
          isActive={activeHash === '#introduction'}
          onClick={() => handleNavClick('#introduction')}
        />
        <NavItem
          label="Authentication"
          icon={<Key className="h-3.5 w-3.5 text-amber-500" />}
          hash="#authentication"
          isActive={activeHash === '#authentication'}
          onClick={() => handleNavClick('#authentication')}
        />
        <NavItem
          label="Base URLs & Envs"
          icon={<Globe className="h-3.5 w-3.5 text-emerald-500" />}
          hash="#environments"
          isActive={activeHash === '#environments'}
          onClick={() => handleNavClick('#environments')}
        />
        <NavItem
          label="Errors & Rate Limits"
          icon={<ShieldAlert className="h-3.5 w-3.5 text-rose-500" />}
          hash="#errors"
          isActive={activeHash === '#errors'}
          onClick={() => handleNavClick('#errors')}
        />
      </div>

      {/* 2. API Reference (Folders & Endpoints) */}
      <div className="space-y-2">
        <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          API Reference ({endpoints.length})
        </div>

        {/* Folders */}
        {folders.map((folder) => {
          const isCollapsed = collapsedFolders[folder.id];
          const folderEndpoints = endpoints.filter((ep) => ep.folderId === folder.id);

          return (
            <div key={folder.id} className="space-y-1">
              <button
                onClick={() => toggleFolder(folder.id)}
                className="flex w-full items-center justify-between rounded px-2 py-1 font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  <Folder className="h-3.5 w-3.5 text-blue-500" />
                  <span>{folder.name}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{folderEndpoints.length}</span>
              </button>

              {!isCollapsed && (
                <div className="pl-3 space-y-1">
                  {folderEndpoints.map((ep) => {
                    const epHash = `#${(ep.method || 'get').toLowerCase()}-${(ep.path || '').replace(/[^a-zA-Z0-9]/g, '-')}`;
                    return (
                      <NavItem
                        key={ep.id}
                        label={ep.summary || ep.path}
                        badge={<MethodBadge method={ep.method || 'GET'} />}
                        hash={epHash}
                        isActive={activeHash === epHash}
                        onClick={() => handleNavClick(epHash)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Uncategorized Endpoints */}
        {endpoints
          .filter((ep) => !ep.folderId)
          .map((ep) => {
            const epHash = `#${(ep.method || 'get').toLowerCase()}-${(ep.path || '').replace(/[^a-zA-Z0-9]/g, '-')}`;
            return (
              <NavItem
                key={ep.id}
                label={ep.summary || ep.path}
                badge={<MethodBadge method={ep.method || 'GET'} />}
                hash={epHash}
                isActive={activeHash === epHash}
                onClick={() => handleNavClick(epHash)}
              />
            );
          })}
      </div>

      {/* 3. Reusable Schemas */}
      {contract?.reusableSchemas && Object.keys(contract.reusableSchemas).length > 0 && (
        <div className="space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Schemas
          </div>
          <NavItem
            label="Schema Models"
            icon={<Database className="h-3.5 w-3.5 text-purple-500" />}
            hash="#schemas"
            isActive={activeHash === '#schemas'}
            onClick={() => handleNavClick('#schemas')}
          />
        </div>
      )}

      {/* 4. Changelog */}
      <div className="space-y-1">
        <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Release History
        </div>
        <NavItem
          label="Changelog"
          icon={<History className="h-3.5 w-3.5 text-slate-400" />}
          hash="#changelog"
          isActive={activeHash === '#changelog'}
          onClick={() => handleNavClick('#changelog')}
        />
      </div>
    </aside>
  );
}

function NavItem({
  label,
  icon,
  badge,
  hash,
  isActive,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  hash: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors ${
        isActive
          ? 'bg-accent font-semibold text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      }`}
    >
      <div className="flex items-center gap-2 truncate">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      {badge && <div className="shrink-0 ml-1.5">{badge}</div>}
    </button>
  );
}

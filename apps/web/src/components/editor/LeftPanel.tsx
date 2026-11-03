'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { MethodBadge } from './MethodBadge';
import {
  Folder,
  Plus,
  Search,
  Trash2,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  UploadCloud,
  FolderInput,
  Check,
} from 'lucide-react';
import { CanonicalEndpoint, CanonicalFolder, HttpMethod } from '@apiforge/shared';
import { ImportModal } from '../studio/ImportModal';

export function LeftPanel({
  versionId,
  projectId,
}: {
  versionId: string;
  projectId?: string;
}) {
  const {
    contract,
    activeEndpointId,
    selectEndpoint,
    addEndpoint,
    deleteEndpoint,
    addFolder,
    deleteFolder,
    moveEndpointToFolder,
  } = useEditorStore();

  const [search, setSearch] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [showImportModal, setShowImportModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewEndpointModal, setShowNewEndpointModal] = useState(false);
  const [newEndpointMethod, setNewEndpointMethod] = useState<HttpMethod>('GET');
  const [newEndpointPath, setNewEndpointPath] = useState('/api/v1/new-endpoint');
  const [newEndpointSummary, setNewEndpointSummary] = useState('New endpoint summary');
  const [newEndpointFolderId, setNewEndpointFolderId] = useState<string>('');

  if (!contract) return null;

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleOpenAddEndpointModal = (preselectedFolderId: string = '') => {
    setNewEndpointFolderId(preselectedFolderId);
    setShowNewEndpointModal(true);
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const newF: CanonicalFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      orderIndex: contract.folders.length,
    };
    addFolder(newF);
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  const handleCreateEndpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEndpointPath.trim()) return;
    const newEp: CanonicalEndpoint = {
      id: `ep-${Date.now()}`,
      method: newEndpointMethod,
      path: newEndpointPath.trim(),
      summary: newEndpointSummary.trim() || 'New Endpoint',
      folderId: newEndpointFolderId ? newEndpointFolderId : null,
      tags: [],
      orderIndex: contract.endpoints.length,
      parameters: [],
      responses: [
        {
          id: `r-${Date.now()}`,
          statusCode: '200',
          description: 'Successful response',
        },
      ],
      security: [],
    };
    addEndpoint(newEp);
    setShowNewEndpointModal(false);
    setNewEndpointFolderId('');
  };

  const filteredEndpoints = contract.endpoints.filter((ep) => {
    const query = search.toLowerCase();
    return (
      ep.path.toLowerCase().includes(query) ||
      ep.summary.toLowerCase().includes(query) ||
      ep.method.toLowerCase().includes(query)
    );
  });

  const uncategorizedEndpoints = filteredEndpoints.filter((ep) => !ep.folderId);

  return (
    <div className="flex h-full w-80 flex-col border-r border-border bg-card">
      {/* Top Search & Actions */}
      <div className="border-b border-border p-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search endpoints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenAddEndpointModal('')}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Endpoint</span>
          </button>
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            <span>Folder</span>
          </button>
          {projectId && (
            <button
              onClick={() => setShowImportModal(true)}
              title="Import OpenAPI or Postman specification"
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Import</span>
            </button>
          )}
        </div>
      </div>

      {/* Endpoints & Folders Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Folders Section */}
        {contract.folders.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Folders ({contract.folders.length})
            </div>

            {contract.folders.map((folder) => {
              const isCollapsed = collapsedFolders[folder.id];
              const folderEndpoints = filteredEndpoints.filter((ep) => ep.folderId === folder.id);

              return (
                <div key={folder.id} className="space-y-1">
                  <div className="group/folder flex w-full items-center justify-between rounded px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                    <button
                      type="button"
                      onClick={() => toggleFolder(folder.id)}
                      className="flex flex-1 items-center gap-1.5 text-left truncate mr-2"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <Folder className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{folder.name}</span>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {folderEndpoints.length}
                      </span>

                      {/* Add endpoint directly to this folder */}
                      <button
                        type="button"
                        onClick={() => handleOpenAddEndpointModal(folder.id)}
                        className="opacity-0 group-hover/folder:opacity-100 p-1 text-muted-foreground hover:text-foreground hover:bg-background/80 rounded transition-all"
                        title={`Add endpoint into "${folder.name}"`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>

                      {/* Delete Folder */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete folder "${folder.name}"? Any endpoints inside will be moved to Ungrouped.`)) {
                            deleteFolder(folder.id);
                          }
                        }}
                        className="opacity-0 group-hover/folder:opacity-100 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-all"
                        title="Delete folder"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="pl-3 space-y-1">
                      {folderEndpoints.length === 0 ? (
                        <div className="pl-4 py-1.5 text-[11px] text-muted-foreground/60 italic flex items-center justify-between">
                          <span>Empty folder</span>
                          <button
                            type="button"
                            onClick={() => handleOpenAddEndpointModal(folder.id)}
                            className="text-primary hover:underline text-[10px] not-italic mr-1"
                          >
                            + Add endpoint
                          </button>
                        </div>
                      ) : (
                        folderEndpoints.map((ep) => (
                          <EndpointListItem
                            key={ep.id}
                            endpoint={ep}
                            folders={contract.folders}
                            isActive={ep.id === activeEndpointId}
                            onSelect={() => selectEndpoint(ep.id)}
                            onDelete={() => deleteEndpoint(ep.id)}
                            onMoveFolder={(fId) => moveEndpointToFolder(ep.id, fId)}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Ungrouped Endpoints Section */}
        <div className="space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>
              {contract.folders.length > 0 ? 'Ungrouped Endpoints' : 'Endpoints'} ({uncategorizedEndpoints.length})
            </span>
          </div>

          {uncategorizedEndpoints.length === 0 && contract.folders.length > 0 ? (
            <div className="px-2 py-2 text-[11px] text-muted-foreground/60 italic text-center">
              All endpoints organized in folders
            </div>
          ) : (
            uncategorizedEndpoints.map((ep) => (
              <EndpointListItem
                key={ep.id}
                endpoint={ep}
                folders={contract.folders}
                isActive={ep.id === activeEndpointId}
                onSelect={() => selectEndpoint(ep.id)}
                onDelete={() => deleteEndpoint(ep.id)}
                onMoveFolder={(fId) => moveEndpointToFolder(ep.id, fId)}
              />
            ))
          )}
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-xl space-y-4">
            <h3 className="font-semibold text-base">Create New Folder</h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Folder Name</label>
                <input
                  type="text"
                  placeholder="e.g. Authentication"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  required
                  autoFocus
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Endpoint Modal */}
      {showNewEndpointModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl space-y-4">
            <h3 className="font-semibold text-base">Add New Endpoint</h3>
            <form onSubmit={handleCreateEndpoint} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-xs font-medium text-muted-foreground">Method</label>
                  <select
                    value={newEndpointMethod}
                    onChange={(e) => setNewEndpointMethod(e.target.value as HttpMethod)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                    <option value="HEAD">HEAD</option>
                    <option value="OPTIONS">OPTIONS</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Endpoint Path</label>
                  <input
                    type="text"
                    value={newEndpointPath}
                    onChange={(e) => setNewEndpointPath(e.target.value)}
                    required
                    placeholder="/api/v1/resource"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Summary / Title</label>
                <input
                  type="text"
                  value={newEndpointSummary}
                  onChange={(e) => setNewEndpointSummary(e.target.value)}
                  placeholder="e.g. List all customer records"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Folder Selector in Modal */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Folder / Group</label>
                <select
                  value={newEndpointFolderId}
                  onChange={(e) => setNewEndpointFolderId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">(No Folder - Ungrouped)</option>
                  {contract.folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      📁 {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewEndpointModal(false)}
                  className="rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90"
                >
                  Add Endpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {projectId && (
        <ImportModal
          projectId={projectId}
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportComplete={() => window.location.reload()}
        />
      )}
    </div>
  );
}

function EndpointListItem({
  endpoint,
  folders,
  isActive,
  onSelect,
  onDelete,
  onMoveFolder,
}: {
  endpoint: CanonicalEndpoint;
  folders: CanonicalFolder[];
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMoveFolder: (folderId: string | null) => void;
}) {
  const [showFolderMenu, setShowFolderMenu] = useState(false);

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs cursor-pointer transition-colors ${
        isActive
          ? 'bg-accent text-accent-foreground font-semibold shadow-xs'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      }`}
    >
      <div className="flex items-center gap-2 overflow-hidden mr-2">
        <MethodBadge method={endpoint.method} />
        <span className="truncate">{endpoint.path}</span>
      </div>

      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
        {/* Quick Folder Move Menu */}
        {folders.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowFolderMenu(!showFolderMenu);
              }}
              className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-background/80 transition-colors"
              title="Move to folder"
            >
              <FolderInput className="h-3 w-3" />
            </button>

            {showFolderMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card p-1 shadow-xl text-xs space-y-0.5 animate-in fade-in-50"
              >
                <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase border-b border-border/60">
                  Move to folder
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onMoveFolder(null);
                    setShowFolderMenu(false);
                  }}
                  className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs hover:bg-accent ${
                    !endpoint.folderId ? 'font-bold text-primary' : 'text-foreground'
                  }`}
                >
                  <span>(No Folder / Root)</span>
                  {!endpoint.folderId && <Check className="h-3 w-3 text-primary" />}
                </button>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      onMoveFolder(f.id);
                      setShowFolderMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs hover:bg-accent ${
                      endpoint.folderId === f.id ? 'font-bold text-primary' : 'text-foreground'
                    }`}
                  >
                    <span className="truncate">📁 {f.name}</span>
                    {endpoint.folderId === f.id && <Check className="h-3 w-3 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-background/80 transition-colors"
          title="Delete endpoint"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

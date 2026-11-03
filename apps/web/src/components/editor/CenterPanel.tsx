'use client';

import React from 'react';
import Link from 'next/link';
import { useEditorStore } from '@/stores/editor-store';
import { MethodBadge } from './MethodBadge';
import {
  Save,
  Play,
  Plus,
  Trash2,
  CheckCircle2,
  FileCode,
  Tag,
  Shield,
  Layers,
  ArrowRight,
  Folder,
} from 'lucide-react';
import { HttpMethod, ParameterIn } from '@apiforge/shared';

export function CenterPanel({ onSave }: { onSave: () => void }) {
  const {
    contract,
    activeEndpointId,
    activeTab,
    setActiveTab,
    activeResponseCode,
    setActiveResponseCode,
    updateActiveEndpoint,
    isDirty,
    isSaving,
  } = useEditorStore();

  if (!contract || !activeEndpointId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background/50 p-8 text-center text-muted-foreground">
        Select an endpoint from the left sidebar or create a new one to begin editing.
      </div>
    );
  }

  const endpoint = contract.endpoints.find((ep) => ep.id === activeEndpointId);
  if (!endpoint) return null;

  // Add parameter row helper
  const handleAddParam = (paramIn: ParameterIn) => {
    const newParam = {
      id: `p-${Date.now()}`,
      name: `param_${endpoint.parameters.length + 1}`,
      in: paramIn,
      required: paramIn === 'path',
      description: '',
      schema: { type: 'string' as const },
    };
    updateActiveEndpoint({
      parameters: [...endpoint.parameters, newParam],
    });
  };

  const handleUpdateParam = (paramId: string, updates: any) => {
    const updated = endpoint.parameters.map((p) =>
      p.id === paramId ? { ...p, ...updates } : p,
    );
    updateActiveEndpoint({ parameters: updated });
  };

  const handleDeleteParam = (paramId: string) => {
    updateActiveEndpoint({
      parameters: endpoint.parameters.filter((p) => p.id !== paramId),
    });
  };

  // Response code helpers
  const currentResponse =
    endpoint.responses.find((r) => r.statusCode === activeResponseCode) ||
    endpoint.responses[0] ||
    null;

  const handleAddResponse = (code: string) => {
    if (endpoint.responses.some((r) => r.statusCode === code)) {
      setActiveResponseCode(code);
      return;
    }
    const newR = {
      id: `r-${Date.now()}`,
      statusCode: code,
      description: `${code} Response`,
    };
    updateActiveEndpoint({ responses: [...endpoint.responses, newR] });
    setActiveResponseCode(code);
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-background">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between border-b border-border bg-card/60 px-6 py-3 sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center gap-2 flex-1 max-w-2xl mr-4">
          <select
            value={endpoint.method}
            onChange={(e) => updateActiveEndpoint({ method: e.target.value as HttpMethod })}
            className="rounded border border-input bg-background px-2.5 py-1 text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
            <option value="HEAD">HEAD</option>
            <option value="OPTIONS">OPTIONS</option>
          </select>

          <input
            type="text"
            value={endpoint.path}
            onChange={(e) => updateActiveEndpoint({ path: e.target.value })}
            placeholder="/api/v1/resource"
            className="flex-1 rounded border border-input bg-background px-3 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring"
          />

          {/* Quick Folder Selector in Header */}
          <div className="flex items-center gap-1.5 rounded border border-input bg-background px-2.5 py-1 text-xs shrink-0">
            <Folder className="h-3.5 w-3.5 text-blue-500" />
            <select
              value={endpoint.folderId || ''}
              onChange={(e) => updateActiveEndpoint({ folderId: e.target.value || null })}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer text-foreground"
              title="Assign endpoint to a folder"
            >
              <option value="">Ungrouped (Root)</option>
              {contract.folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/playground?endpointId=${endpoint.id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Play className="h-3.5 w-3.5 text-emerald-500" />
            <span>Test Playground</span>
          </Link>

          <button
            onClick={onSave}
            disabled={isSaving}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-primary-foreground shadow transition-colors ${
              isDirty ? 'bg-primary hover:bg-primary/90' : 'bg-primary/70 opacity-90'
            }`}
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSaving ? 'Saving...' : isDirty ? 'Save Changes' : 'Saved'}</span>
          </button>
        </div>
      </div>

      {/* Endpoint Summary & Tabs */}
      <div className="p-6 space-y-6 max-w-4xl">
        <div className="space-y-2">
          <input
            type="text"
            value={endpoint.summary}
            onChange={(e) => updateActiveEndpoint({ summary: e.target.value })}
            placeholder="Endpoint summary / title"
            className="w-full text-xl font-bold bg-transparent border-b border-transparent hover:border-input focus:border-input focus:outline-none py-1 transition-colors"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border space-x-1">
          {[
            { id: 'general', label: 'General' },
            { id: 'params', label: `Parameters (${endpoint.parameters.length})` },
            { id: 'body', label: 'Request Body' },
            { id: 'responses', label: `Responses (${endpoint.responses.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`border-b-2 px-4 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: General Info */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <textarea
                rows={3}
                value={endpoint.description || ''}
                onChange={(e) => updateActiveEndpoint({ description: e.target.value })}
                placeholder="Markdown description of the endpoint's behavior..."
                className="mt-1 w-full rounded-md border border-input bg-background p-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5 text-blue-500" />
                  <span>Folder / Collection</span>
                </label>
                <select
                  value={endpoint.folderId || ''}
                  onChange={(e) => updateActiveEndpoint({ folderId: e.target.value || null })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  <option value="">(None - Ungrouped Root)</option>
                  {contract.folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      📁 {f.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Organizes this endpoint into a folder in the sidebar & docs.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Tags</label>
                <input
                  type="text"
                  value={endpoint.tags?.join(', ') || ''}
                  onChange={(e) =>
                    updateActiveEndpoint({
                      tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Users, Billing, Webhooks"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Comma-separated keywords for filtering and grouping.
                </p>
              </div>

              <div className="flex flex-col justify-start pt-6">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    id="deprecated"
                    checked={endpoint.deprecated || false}
                    onChange={(e) => updateActiveEndpoint({ deprecated: e.target.checked })}
                    className="rounded border-input h-4 w-4 text-primary focus:ring-ring cursor-pointer"
                  />
                  <span>Mark endpoint as Deprecated</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Parameters Table */}
        {activeTab === 'params' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Request Parameters
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAddParam('query')}
                  className="inline-flex items-center gap-1 rounded border border-input bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent"
                >
                  <Plus className="h-3 w-3" /> Add Query Param
                </button>
                <button
                  type="button"
                  onClick={() => handleAddParam('header')}
                  className="inline-flex items-center gap-1 rounded border border-input bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent"
                >
                  <Plus className="h-3 w-3" /> Add Header
                </button>
              </div>
            </div>

            {endpoint.parameters.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                No parameters configured for this endpoint.
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Name</th>
                      <th className="px-3 py-2 text-left font-medium">In</th>
                      <th className="px-3 py-2 text-left font-medium">Type</th>
                      <th className="px-3 py-2 text-center font-medium">Required</th>
                      <th className="px-3 py-2 text-left font-medium">Description</th>
                      <th className="px-3 py-2 text-center font-medium w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {endpoint.parameters.map((param) => (
                      <tr key={param.id} className="hover:bg-muted/20">
                        <td className="p-2">
                          <input
                            type="text"
                            value={param.name}
                            onChange={(e) => handleUpdateParam(param.id, { name: e.target.value })}
                            className="w-full rounded border border-input bg-background px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-muted text-[10px] uppercase font-bold text-muted-foreground">
                            {param.in}
                          </span>
                        </td>
                        <td className="p-2">
                          <select
                            value={param.schema?.type || 'string'}
                            onChange={(e) =>
                              handleUpdateParam(param.id, {
                                schema: { ...param.schema, type: e.target.value },
                              })
                            }
                            className="rounded border border-input bg-background px-2 py-1 text-xs"
                          >
                            <option value="string">string</option>
                            <option value="number">number</option>
                            <option value="integer">integer</option>
                            <option value="boolean">boolean</option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={param.required}
                            onChange={(e) =>
                              handleUpdateParam(param.id, { required: e.target.checked })
                            }
                            className="rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={param.description || ''}
                            onChange={(e) =>
                              handleUpdateParam(param.id, { description: e.target.value })
                            }
                            placeholder="Description"
                            className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteParam(param.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Request Body Builder */}
        {activeTab === 'body' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Request Body (application/json)
              </span>
              <button
                type="button"
                onClick={() => {
                  const currentProps =
                    endpoint.requestBody?.content?.['application/json']?.schema?.properties || {};
                  const newPropKey = `field_${Object.keys(currentProps).length + 1}`;
                  updateActiveEndpoint({
                    requestBody: {
                      required: true,
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            properties: {
                              ...currentProps,
                              [newPropKey]: { type: 'string', description: '' },
                            },
                            required: Object.keys(currentProps).concat(newPropKey),
                          },
                        },
                      },
                    },
                  });
                }}
                className="inline-flex items-center gap-1 rounded border border-input bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent"
              >
                <Plus className="h-3 w-3" /> Add Schema Property
              </button>
            </div>

            {/* Properties List */}
            {Object.keys(
              endpoint.requestBody?.content?.['application/json']?.schema?.properties || {},
            ).length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                No request body configured. Click &quot;Add Schema Property&quot; to define payload attributes.
              </div>
            ) : (
              <div className="rounded-lg border border-border p-4 space-y-3 bg-card/40">
                {Object.entries(
                  endpoint.requestBody?.content?.['application/json']?.schema?.properties || {},
                ).map(([key, prop]: [string, any]) => (
                  <div key={key} className="flex items-center gap-3">
                    <input
                      type="text"
                      defaultValue={key}
                      onBlur={(e) => {
                        const newKey = e.target.value.trim();
                        if (newKey && newKey !== key) {
                          const props = {
                            ...endpoint.requestBody?.content?.['application/json']?.schema
                              ?.properties,
                          };
                          delete props[key];
                          props[newKey] = prop;
                          updateActiveEndpoint({
                            requestBody: {
                              ...endpoint.requestBody,
                              required: true,
                              content: {
                                'application/json': {
                                  schema: {
                                    type: 'object',
                                    properties: props,
                                  },
                                },
                              },
                            },
                          });
                        }
                      }}
                      className="w-48 rounded border border-input bg-background px-2.5 py-1 text-xs font-mono font-semibold"
                    />

                    <select
                      value={prop.type || 'string'}
                      onChange={(e) => {
                        const props = {
                          ...endpoint.requestBody?.content?.['application/json']?.schema?.properties,
                          [key]: { ...prop, type: e.target.value },
                        };
                        updateActiveEndpoint({
                          requestBody: {
                            ...endpoint.requestBody,
                            required: true,
                            content: {
                              'application/json': {
                                schema: { type: 'object', properties: props },
                              },
                            },
                          },
                        });
                      }}
                      className="rounded border border-input bg-background px-2 py-1 text-xs"
                    >
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="integer">integer</option>
                      <option value="boolean">boolean</option>
                      <option value="object">object</option>
                      <option value="array">array</option>
                    </select>

                    <input
                      type="text"
                      value={prop.description || ''}
                      onChange={(e) => {
                        const props = {
                          ...endpoint.requestBody?.content?.['application/json']?.schema?.properties,
                          [key]: { ...prop, description: e.target.value },
                        };
                        updateActiveEndpoint({
                          requestBody: {
                            ...endpoint.requestBody,
                            required: true,
                            content: {
                              'application/json': {
                                schema: { type: 'object', properties: props },
                              },
                            },
                          },
                        });
                      }}
                      placeholder="Field description"
                      className="flex-1 rounded border border-input bg-background px-2.5 py-1 text-xs"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const props = {
                          ...endpoint.requestBody?.content?.['application/json']?.schema?.properties,
                        };
                        delete props[key];
                        updateActiveEndpoint({
                          requestBody: {
                            ...endpoint.requestBody,
                            required: true,
                            content: {
                              'application/json': {
                                schema: { type: 'object', properties: props },
                              },
                            },
                          },
                        });
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Multiple Response Status Codes */}
        {activeTab === 'responses' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-2">
                Status Codes:
              </span>
              {endpoint.responses.map((resp) => (
                <button
                  key={resp.statusCode}
                  onClick={() => setActiveResponseCode(resp.statusCode)}
                  className={`rounded px-2.5 py-1 text-xs font-mono font-bold transition-colors ${
                    activeResponseCode === resp.statusCode
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {resp.statusCode}
                </button>
              ))}

              <div className="flex items-center gap-1 ml-auto">
                {['200', '201', '400', '404', '500'].map((code) => (
                  <button
                    key={code}
                    onClick={() => handleAddResponse(code)}
                    className="rounded border border-input px-2 py-0.5 text-[10px] font-mono text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    +{code}
                  </button>
                ))}
              </div>
            </div>

            {currentResponse && (
              <div className="space-y-4 rounded-lg border border-border p-4 bg-card/40">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Response Description ({currentResponse.statusCode})
                  </label>
                  <input
                    type="text"
                    value={currentResponse.description || ''}
                    onChange={(e) => {
                      const updated = endpoint.responses.map((r) =>
                        r.statusCode === currentResponse.statusCode
                          ? { ...r, description: e.target.value }
                          : r,
                      );
                      updateActiveEndpoint({ responses: updated });
                    }}
                    placeholder="e.g. Successfully created user record"
                    className="mt-1 w-full rounded border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { MethodBadge } from '../editor/MethodBadge';
import {
  Play,
  Clock,
  HardDrive,
  Copy,
  Check,
  History,
  Plus,
  Trash2,
  Lock,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { HttpMethod } from '@apiforge/shared';
import { executePlaygroundRequestAction } from '@/actions/playground.actions';

export interface PlaygroundViewProps {
  initialEndpoint?: {
    id: string;
    method: HttpMethod;
    path: string;
    summary: string;
    parameters: any[];
    requestBody?: any;
  } | null;
  initialHistory?: any[];
}

export function PlaygroundView({ initialEndpoint, initialHistory = [] }: PlaygroundViewProps) {
  const [method, setMethod] = useState<HttpMethod>(initialEndpoint?.method || 'GET');
  const [url, setUrl] = useState<string>(
    initialEndpoint
      ? `https://httpbin.org${initialEndpoint.path}`
      : 'https://httpbin.org/get',
  );
  const [activeReqTab, setActiveReqTab] = useState<'params' | 'headers' | 'auth' | 'body' | 'history'>('params');
  const [activeRespTab, setActiveRespTab] = useState<'pretty' | 'raw' | 'headers'>('pretty');

  // Request State
  const [queryParams, setQueryParams] = useState<Array<{ key: string; value: string }>>([
    { key: 'format', value: 'json' },
  ]);
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([
    { key: 'Accept', value: 'application/json' },
  ]);
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'basic'>('none');
  const [bearerToken, setBearerToken] = useState('');
  const [reqBody, setReqBody] = useState('{\n  "message": "Hello from ApiForge Playground!"\n}');

  // Execution & Response State
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>(initialHistory);
  const [copied, setCopied] = useState(false);

  const handleSend = async () => {
    setIsLoading(true);
    try {
      const headerObj: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.key.trim()) headerObj[h.key.trim()] = h.value;
      });

      if (authType === 'bearer' && bearerToken.trim()) {
        headerObj['Authorization'] = `Bearer ${bearerToken.trim()}`;
      }

      const queryObj: Record<string, string> = {};
      queryParams.forEach((q) => {
        if (q.key.trim()) queryObj[q.key.trim()] = q.value;
      });

      let parsedBody: any = undefined;
      if (['POST', 'PUT', 'PATCH'].includes(method) && reqBody.trim()) {
        try {
          parsedBody = JSON.parse(reqBody);
        } catch {
          parsedBody = reqBody;
        }
      }

      const result = await executePlaygroundRequestAction({
        method,
        url,
        headers: headerObj,
        queryParams: queryObj,
        body: parsedBody,
      });

      if (result.success && result.data) {
        setResponse(result.data);
        // Prepend to history
        setHistoryList((prev) => [
          {
            id: `hist-${Date.now()}`,
            method,
            url,
            responseStatus: result.data!.statusCode,
            durationMs: result.data!.durationMs,
            responseSizeBytes: result.data!.responseSizeBytes,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        setResponse({
          statusCode: 500,
          statusText: 'Proxy Execution Error',
          headers: {},
          body: { error: result.error || 'Execution failed' },
          durationMs: 0,
          responseSizeBytes: 0,
        });
      }
    } catch (err: unknown) {
      setResponse({
        statusCode: 500,
        statusText: 'Network Error',
        headers: {},
        body: { error: err instanceof Error ? err.message : 'Failed to reach proxy' },
        durationMs: 0,
        responseSizeBytes: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (!response) return;
    const text =
      activeRespTab === 'raw' || activeRespTab === 'pretty'
        ? typeof response.body === 'object'
          ? JSON.stringify(response.body, null, 2)
          : String(response.body)
        : JSON.stringify(response.headers, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* Top Postman URL Bar */}
      <div className="border-b border-border bg-card/60 p-4 flex items-center gap-3">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as HttpMethod)}
          className="rounded-md border border-input bg-background px-3 py-2 text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
          <option value="HEAD">HEAD</option>
          <option value="OPTIONS">OPTIONS</option>
        </select>

        <div className="flex-1 relative">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter request URL (e.g. https://httpbin.org/get or {{baseUrl}}/users)"
            className="w-full rounded-md border border-input bg-background px-4 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>{isLoading ? 'Sending...' : 'Send'}</span>
        </button>
      </div>

      {/* Split Grid: Request Panel & Response Panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border overflow-hidden">
        {/* Left Side: Request Configurator */}
        <div className="flex flex-col h-full overflow-hidden bg-background">
          {/* Tabs Navigation */}
          <div className="flex items-center border-b border-border bg-muted/30 px-4 space-x-1">
            {[
              { id: 'params', label: `Params (${queryParams.length})` },
              { id: 'headers', label: `Headers (${headers.length})` },
              { id: 'auth', label: 'Authorization' },
              { id: 'body', label: 'Body' },
              { id: 'history', label: `History (${historyList.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveReqTab(tab.id as any)}
                className={`border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                  activeReqTab === tab.id
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Request Tab Contents */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* 1. Query Params */}
            {activeReqTab === 'params' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase">
                  <span>Query Parameters</span>
                  <button
                    onClick={() => setQueryParams([...queryParams, { key: '', value: '' }])}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Plus className="h-3 w-3" /> Add Param
                  </button>
                </div>
                <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
                  {queryParams.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-card/40">
                      <input
                        type="text"
                        placeholder="Key"
                        value={q.key}
                        onChange={(e) => {
                          const updated = [...queryParams];
                          updated[idx].key = e.target.value;
                          setQueryParams(updated);
                        }}
                        className="flex-1 rounded border border-input bg-background px-2.5 py-1 text-xs font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={q.value}
                        onChange={(e) => {
                          const updated = [...queryParams];
                          updated[idx].value = e.target.value;
                          setQueryParams(updated);
                        }}
                        className="flex-1 rounded border border-input bg-background px-2.5 py-1 text-xs font-mono"
                      />
                      <button
                        onClick={() => setQueryParams(queryParams.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Headers */}
            {activeReqTab === 'headers' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase">
                  <span>Headers</span>
                  <button
                    onClick={() => setHeaders([...headers, { key: '', value: '' }])}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Plus className="h-3 w-3" /> Add Header
                  </button>
                </div>
                <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
                  {headers.map((h, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-card/40">
                      <input
                        type="text"
                        placeholder="Header Name"
                        value={h.key}
                        onChange={(e) => {
                          const updated = [...headers];
                          updated[idx].key = e.target.value;
                          setHeaders(updated);
                        }}
                        className="flex-1 rounded border border-input bg-background px-2.5 py-1 text-xs font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={h.value}
                        onChange={(e) => {
                          const updated = [...headers];
                          updated[idx].value = e.target.value;
                          setHeaders(updated);
                        }}
                        className="flex-1 rounded border border-input bg-background px-2.5 py-1 text-xs font-mono"
                      />
                      <button
                        onClick={() => setHeaders(headers.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Authorization */}
            {activeReqTab === 'auth' && (
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Auth Type</label>
                  <select
                    value={authType}
                    onChange={(e) => setAuthType(e.target.value as any)}
                    className="mt-1 w-full rounded border border-input bg-background px-3 py-1.5 text-xs font-medium"
                  >
                    <option value="none">No Auth</option>
                    <option value="bearer">Bearer Token</option>
                  </select>
                </div>

                {authType === 'bearer' && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Token</label>
                    <input
                      type="password"
                      placeholder="eyJhbGciOi..."
                      value={bearerToken}
                      onChange={(e) => setBearerToken(e.target.value)}
                      className="mt-1 w-full rounded border border-input bg-background px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 4. Request Body (Monaco) */}
            {activeReqTab === 'body' && (
              <div className="h-full flex flex-col space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Raw JSON Body
                </span>
                <div className="flex-1 rounded-lg border border-border overflow-hidden min-h-[300px]">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    theme="vs-dark"
                    value={reqBody}
                    onChange={(val) => setReqBody(val || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 12,
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>
              </div>
            )}

            {/* 5. Execution History */}
            {activeReqTab === 'history' && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase">
                  Recent Request Executions
                </div>
                {historyList.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                    No requests executed yet.
                  </div>
                ) : (
                  historyList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setMethod(item.method);
                        setUrl(item.url);
                      }}
                      className="flex items-center justify-between rounded-lg border border-border p-3 text-xs bg-card/60 hover:bg-accent/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <MethodBadge method={item.method} />
                        <span className="font-mono truncate">{item.url}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`font-mono font-bold ${
                            item.responseStatus < 300
                              ? 'text-emerald-500'
                              : item.responseStatus < 500
                              ? 'text-amber-500'
                              : 'text-rose-500'
                          }`}
                        >
                          {item.responseStatus}
                        </span>
                        <span className="text-muted-foreground font-mono">
                          {item.durationMs}ms
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Response Telemetry & Payload */}
        <div className="flex flex-col h-full overflow-hidden bg-background">
          {/* Response Telemetry Banner */}
          <div className="border-b border-border bg-muted/40 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Response:
              </span>
              {response ? (
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded px-2 py-0.5 font-mono font-bold text-xs ${
                      response.statusCode < 300
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : response.statusCode < 500
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    }`}
                  >
                    {response.statusCode} {response.statusText}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                    <Clock className="h-3 w-3" />
                    <span>{response.durationMs} ms</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                    <HardDrive className="h-3 w-3" />
                    <span>{(response.responseSizeBytes / 1024).toFixed(2)} KB</span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  Send a request to inspect response
                </span>
              )}
            </div>

            {response && (
              <button
                onClick={handleCopyResponse}
                className="inline-flex items-center gap-1 rounded border border-input bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          {/* Response Viewer Tabs */}
          {response && (
            <div className="flex items-center border-b border-border bg-muted/20 px-4 space-x-1">
              {[
                { id: 'pretty', label: 'Pretty JSON' },
                { id: 'raw', label: 'Raw Text' },
                { id: 'headers', label: `Headers (${Object.keys(response.headers).length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveRespTab(tab.id as any)}
                  className={`border-b-2 px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeRespTab === tab.id
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Response Body Display */}
          <div className="flex-1 overflow-hidden p-0">
            {!response ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 text-xs text-muted-foreground">
                <Play className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p>Click &quot;Send&quot; above to execute the request.</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">
                  Requests are securely dispatched via the SSRF-hardened NestJS proxy.
                </p>
              </div>
            ) : activeRespTab === 'pretty' ? (
              <Editor
                height="100%"
                defaultLanguage="json"
                theme="vs-dark"
                value={
                  typeof response.body === 'object'
                    ? JSON.stringify(response.body, null, 2)
                    : String(response.body)
                }
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 12,
                  scrollBeyondLastLine: false,
                }}
              />
            ) : activeRespTab === 'raw' ? (
              <div className="p-4 font-mono text-xs overflow-auto h-full whitespace-pre-wrap">
                {typeof response.body === 'object'
                  ? JSON.stringify(response.body, null, 2)
                  : String(response.body)}
              </div>
            ) : (
              <div className="p-4 overflow-auto h-full space-y-2">
                <table className="w-full text-xs font-mono">
                  <tbody>
                    {Object.entries(response.headers).map(([k, v]: [string, any]) => (
                      <tr key={k} className="border-b border-border/40">
                        <td className="py-1.5 font-bold text-muted-foreground w-1/3">{k}</td>
                        <td className="py-1.5 text-foreground">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

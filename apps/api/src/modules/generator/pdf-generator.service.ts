import { Injectable } from '@nestjs/common';
import {
  CanonicalContract,
  generateCurlSnippet,
  generateFetchSnippet,
  generatePythonSnippet,
} from '@apiforge/shared';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PdfGeneratorService {
  constructor(private readonly storageService: StorageService) {}

  /**
   * Synthesizes an executive-grade, print-ready HTML/PDF technical manual
   */
  generatePrintHtml(contract: CanonicalContract): string {
    const primaryServer =
      contract.servers?.[0]?.url || 'http://localhost:4000/api/v1';

    const folders = contract.folders || [];
    const endpoints = contract.endpoints || [];
    const reusableSchemas = contract.reusableSchemas || {};

    const uncategorizedEndpoints = endpoints.filter((ep) => !ep.folderId);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${contract.name} v${contract.version || '1.0.0'} — Technical API Reference</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

    :root {
      --primary: #2563eb;
      --primary-dark: #1d4ed8;
      --bg: #ffffff;
      --card-bg: #ffffff;
      --text: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --border-light: #f1f5f9;
      --code-bg: #090d16;
      --code-text: #f8fafc;
    }

    @page {
      size: A4;
      margin: 15mm 15mm 20mm 15mm;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #94a3b8;
      }
      @bottom-left {
        content: "${contract.name} v${contract.version || '1.0.0'} • Confidential & Proprietary";
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #94a3b8;
      }
    }

    * { box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: var(--text);
      background-color: #f8fafc;
      line-height: 1.6;
      font-size: 10pt;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }

    /* Floating Action Bar (Hidden in Print) */
    .action-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(8px);
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .action-bar .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 13pt;
      letter-spacing: -0.3px;
    }
    .action-bar .brand span.icon {
      background: #3b82f6;
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      font-size: 11pt;
    }
    .action-bar .actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 9.5pt;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
      border: none;
    }
    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }
    .btn-outline {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Main Container (Centered Paper Layout) */
    .document-container {
      max-width: 900px;
      margin: 30px auto;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      padding: 48px;
    }

    @media print {
      body { background: #ffffff !important; font-size: 9.5pt; }
      .action-bar { display: none !important; }
      .document-container {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
      }
      .page-break { page-break-before: always; }
      .no-break { page-break-inside: avoid; }
      pre { word-break: break-all; white-space: pre-wrap !important; }
    }

    /* Cover Page */
    .cover-section {
      padding-bottom: 40px;
      border-bottom: 2px solid var(--border);
      margin-bottom: 40px;
    }
    .cover-badge-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 8.5pt;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .pill-blue { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .pill-green { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }

    .doc-title {
      font-size: 30pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.15;
      letter-spacing: -0.8px;
      margin: 0 0 12px 0;
    }
    .doc-subtitle {
      font-size: 13pt;
      color: var(--text-muted);
      margin: 0 0 24px 0;
      line-height: 1.5;
    }

    /* Metadata Grid */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px 20px;
      margin-top: 24px;
    }
    .meta-card h4 {
      margin: 0 0 4px 0;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      font-weight: 700;
    }
    .meta-card p {
      margin: 0;
      font-size: 9.5pt;
      font-weight: 600;
      color: #1e293b;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Table of Contents */
    .toc-section {
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 40px;
    }
    .toc-title {
      font-size: 13pt;
      font-weight: 700;
      margin: 0 0 16px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .toc-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px 24px;
    }
    .toc-item a {
      color: #334155;
      text-decoration: none;
      font-size: 9pt;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px dotted #cbd5e1;
      padding-bottom: 2px;
    }
    .toc-item a:hover {
      color: var(--primary);
    }

    /* Section Headings */
    h2.section-header {
      font-size: 18pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
      margin: 48px 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--border);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .folder-header {
      margin-top: 36px;
      margin-bottom: 16px;
      padding: 10px 14px;
      background: #f1f5f9;
      border-left: 4px solid var(--primary);
      border-radius: 0 6px 6px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .folder-header h3 {
      margin: 0;
      font-size: 13pt;
      font-weight: 700;
      color: #1e293b;
    }
    .folder-header span.badge {
      font-size: 8pt;
      background: #e2e8f0;
      color: #475569;
      padding: 2px 8px;
      border-radius: 9999px;
      font-weight: 600;
    }

    /* Endpoint Cards */
    .endpoint-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-bottom: 24px;
      overflow: hidden;
      page-break-inside: avoid;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .endpoint-header {
      padding: 12px 16px;
      background: #f8fafc;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .endpoint-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .method-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-get { background: #2563eb; }
    .badge-post { background: #10b981; }
    .badge-put { background: #f59e0b; }
    .badge-patch { background: #8b5cf6; }
    .badge-delete { background: #ef4444; }

    .endpoint-path {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 10.5pt;
      color: #0f172a;
    }
    .endpoint-summary {
      font-weight: 600;
      font-size: 9.5pt;
      color: #64748b;
    }

    .endpoint-body {
      padding: 16px;
    }
    .endpoint-desc {
      color: #475569;
      font-size: 9.5pt;
      margin: 0 0 16px 0;
      line-height: 1.5;
    }

    /* Parameter Tables */
    .table-title {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin: 16px 0 8px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    table.param-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 8.5pt;
    }
    table.param-table th, table.param-table td {
      border: 1px solid var(--border);
      padding: 6px 10px;
      text-align: left;
    }
    table.param-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      font-size: 8pt;
      text-transform: uppercase;
    }
    table.param-table td code {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      color: #2563eb;
      background: #eff6ff;
      padding: 1px 4px;
      border-radius: 3px;
    }

    .req-badge {
      display: inline-block;
      font-size: 7pt;
      font-weight: 700;
      color: #e11d48;
      background: #ffe4e6;
      border: 1px solid #fecdd3;
      padding: 1px 5px;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .opt-badge {
      display: inline-block;
      font-size: 7pt;
      font-weight: 600;
      color: #64748b;
      background: #f1f5f9;
      padding: 1px 5px;
      border-radius: 3px;
    }

    /* Code Blocks */
    pre.code-block {
      background: var(--code-bg);
      color: var(--code-text);
      padding: 12px 14px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      line-height: 1.45;
      overflow-x: auto;
      margin: 6px 0 16px 0;
      border: 1px solid #1e293b;
    }

    /* Responses */
    .response-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
      margin-bottom: 4px;
      font-size: 8.5pt;
    }
    .status-badge {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 8pt;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .status-2xx { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .status-4xx { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
    .status-5xx { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }

    /* Footer */
    .doc-footer {
      border-top: 1px solid var(--border);
      padding-top: 24px;
      margin-top: 48px;
      text-align: center;
      color: #94a3b8;
      font-size: 8pt;
    }
  </style>
</head>
<body>

  <!-- Floating Sticky Action Bar for browser view -->
  <header class="action-bar">
    <div class="brand">
      <span class="icon">⚡</span>
      <span>ApiForge Reference Manual</span>
    </div>
    <div class="actions">
      <button class="btn btn-primary" onclick="window.print()">
        🖨️ Print / Save as PDF
      </button>
      <button class="btn btn-outline" onclick="window.close()">
        ✕ Close
      </button>
    </div>
  </header>

  <div class="document-container">

    <!-- 1. Executive Cover Header -->
    <section class="cover-section">
      <div class="cover-badge-row">
        <span class="pill pill-blue">Enterprise API Specification</span>
        <span class="pill pill-green">Release v${contract.version || '1.0.0'}</span>
      </div>

      <h1 class="doc-title">${contract.name || 'API Contract Reference'}</h1>
      <p class="doc-subtitle">${contract.description || 'Comprehensive, verified REST API manual with schema definitions, headers, payloads, and code execution samples.'}</p>

      <div class="meta-grid">
        <div class="meta-card">
          <h4>Base Server URL</h4>
          <p>${primaryServer}</p>
        </div>
        <div class="meta-card">
          <h4>Generated On</h4>
          <p>${new Date().toUTCString().replace('GMT', 'UTC')}</p>
        </div>
        <div class="meta-card">
          <h4>Specification Standard</h4>
          <p>OpenAPI 3.1.0 • JSON Schema 2020-12</p>
        </div>
        <div class="meta-card">
          <h4>Total Operations</h4>
          <p>${endpoints.length} Endpoints in ${folders.length} Collections</p>
        </div>
      </div>
    </section>

    <!-- 2. Table of Contents -->
    <section class="toc-section no-break">
      <div class="toc-title">
        <span>📑</span>
        <span>Table of Contents</span>
      </div>
      <ul class="toc-list">
        ${folders
          .map(
            (f) => `
          <li class="toc-item">
            <a href="#folder-${f.id}">
              <span>📁 ${f.name}</span>
              <span style="font-family: monospace; color: #64748b;">${endpoints.filter((ep) => ep.folderId === f.id).length} ops</span>
            </a>
          </li>
        `,
          )
          .join('')}
        ${
          uncategorizedEndpoints.length > 0
            ? `
          <li class="toc-item">
            <a href="#section-ungrouped">
              <span>⚡ Ungrouped Operations</span>
              <span style="font-family: monospace; color: #64748b;">${uncategorizedEndpoints.length} ops</span>
            </a>
          </li>
        `
            : ''
        }
        ${
          Object.keys(reusableSchemas).length > 0
            ? `
          <li class="toc-item">
            <a href="#section-schemas">
              <span>📦 Data Models & Schemas</span>
              <span style="font-family: monospace; color: #64748b;">${Object.keys(reusableSchemas).length} models</span>
            </a>
          </li>
        `
            : ''
        }
      </ul>
    </section>

    <!-- 3. Folders & Grouped Endpoints -->
    <h2 class="section-header">API Endpoints Reference</h2>

    ${folders
      .map((folder) => {
        const folderEps = endpoints.filter((ep) => ep.folderId === folder.id);
        if (folderEps.length === 0) return '';

        return `
        <div id="folder-${folder.id}" class="folder-header page-break">
          <h3>📁 ${folder.name}</h3>
          <span class="badge">${folderEps.length} Endpoints</span>
        </div>
        ${folderEps.map((ep) => this.renderEndpointCard(ep, primaryServer)).join('')}
      `;
      })
      .join('')}

    <!-- 4. Ungrouped Endpoints -->
    ${
      uncategorizedEndpoints.length > 0
        ? `
      <div id="section-ungrouped" class="folder-header page-break">
        <h3>⚡ Ungrouped Endpoints</h3>
        <span class="badge">${uncategorizedEndpoints.length} Endpoints</span>
      </div>
      ${uncategorizedEndpoints.map((ep) => this.renderEndpointCard(ep, primaryServer)).join('')}
    `
        : ''
    }

    <!-- 5. Reusable Data Schemas -->
    ${
      Object.keys(reusableSchemas).length > 0
        ? `
      <div id="section-schemas" class="page-break">
        <h2 class="section-header">📦 Data Models & Schemas</h2>
        ${Object.entries(reusableSchemas)
          .map(
            ([name, schemaDef]: [string, any]) => `
          <div class="endpoint-card no-break">
            <div class="endpoint-header">
              <span class="endpoint-path" style="color: #2563eb;">${name}</span>
              <span class="endpoint-summary">${schemaDef.description || 'JSON Schema Definition'}</span>
            </div>
            <div class="endpoint-body">
              <pre class="code-block">${JSON.stringify(schemaDef, null, 2)}</pre>
            </div>
          </div>
        `,
          )
          .join('')}
      </div>
    `
        : ''
    }

    <!-- Document Footer -->
    <footer class="doc-footer">
      Generated automatically by <strong>ApiForge</strong> • Enterprise API Contract Management, Vector Documentation & Mock Testing Engine.
    </footer>

  </div>
</body>
</html>`;
  }

  private renderEndpointCard(ep: any, baseUrl: string): string {
    const methodLower = (ep.method || 'GET').toLowerCase();
    const badgeClass = `badge-${methodLower}`;
    const parameters = ep.parameters || [];
    const pathParams = parameters.filter((p: any) => String(p.in).toLowerCase() === 'path');
    const queryParams = parameters.filter((p: any) => String(p.in).toLowerCase() === 'query');
    const headerParams = parameters.filter((p: any) => String(p.in).toLowerCase() === 'header');

    // Generated Code Snippets
    let curlSnippet = '';
    let fetchSnippet = '';
    let pythonSnippet = '';
    try {
      curlSnippet = generateCurlSnippet(ep, { baseUrl });
      fetchSnippet = generateFetchSnippet(ep, { baseUrl });
      pythonSnippet = generatePythonSnippet(ep, { baseUrl });
    } catch {
      curlSnippet = `curl -X ${ep.method} "${baseUrl}${ep.path}"`;
    }

    return `
    <div class="endpoint-card no-break">
      <div class="endpoint-header">
        <div class="endpoint-left">
          <span class="method-badge ${badgeClass}">${ep.method}</span>
          <span class="endpoint-path">${ep.path}</span>
        </div>
        <span class="endpoint-summary">${ep.summary || ''}</span>
      </div>

      <div class="endpoint-body">
        ${ep.description ? `<p class="endpoint-desc">${ep.description}</p>` : ''}

        ${
          pathParams.length > 0
            ? `
          <div class="table-title">Path Parameters</div>
          <table class="param-table">
            <thead>
              <tr><th style="width: 25%;">Parameter</th><th style="width: 15%;">Type</th><th style="width: 15%;">Required</th><th>Description</th></tr>
            </thead>
            <tbody>
              ${pathParams
                .map(
                  (p: any) => `
                <tr>
                  <td><code>${p.name}</code></td>
                  <td>${p.schema?.type || 'string'}</td>
                  <td><span class="req-badge">Required</span></td>
                  <td>${p.description || '—'}${p.example !== undefined ? ` (e.g. <em>${p.example}</em>)` : ''}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        `
            : ''
        }

        ${
          queryParams.length > 0
            ? `
          <div class="table-title">Query Parameters</div>
          <table class="param-table">
            <thead>
              <tr><th style="width: 25%;">Parameter</th><th style="width: 15%;">Type</th><th style="width: 15%;">Required</th><th>Description</th></tr>
            </thead>
            <tbody>
              ${queryParams
                .map(
                  (p: any) => `
                <tr>
                  <td><code>${p.name}</code></td>
                  <td>${p.schema?.type || 'string'}</td>
                  <td>${p.required ? '<span class="req-badge">Required</span>' : '<span class="opt-badge">Optional</span>'}</td>
                  <td>${p.description || '—'}${p.example !== undefined ? ` (e.g. <em>${p.example}</em>)` : ''}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        `
            : ''
        }

        ${
          headerParams.length > 0
            ? `
          <div class="table-title">Header Parameters</div>
          <table class="param-table">
            <thead>
              <tr><th style="width: 25%;">Header Name</th><th style="width: 15%;">Type</th><th style="width: 15%;">Required</th><th>Description</th></tr>
            </thead>
            <tbody>
              ${headerParams
                .map(
                  (p: any) => `
                <tr>
                  <td><code>${p.name}</code></td>
                  <td>${p.schema?.type || 'string'}</td>
                  <td>${p.required ? '<span class="req-badge">Required</span>' : '<span class="opt-badge">Optional</span>'}</td>
                  <td>${p.description || '—'}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        `
            : ''
        }

        ${
          ep.requestBody?.content?.['application/json']
            ? `
          <div class="table-title">Request Body (application/json)</div>
          <pre class="code-block">${JSON.stringify(
            ep.requestBody.content['application/json'].examples?.default?.value ||
              ep.requestBody.content['application/json'].schema?.example ||
              ep.requestBody.content['application/json'].schema ||
              {},
            null,
            2,
          )}</pre>
        `
            : ''
        }

        <div class="table-title">Responses</div>
        ${(ep.responses || [])
          .map((r: any) => {
            const code = String(r.statusCode || '200');
            const codeClass = code.startsWith('2')
              ? 'status-2xx'
              : code.startsWith('4')
                ? 'status-4xx'
                : 'status-5xx';

            return `
            <div class="response-item">
              <span class="status-badge ${codeClass}">HTTP ${code}</span>
              <strong style="color: #334155;">${r.description || 'Response'}</strong>
            </div>
            ${
              r.content?.['application/json']?.schema
                ? `<pre class="code-block">${JSON.stringify(r.content['application/json'].schema, null, 2)}</pre>`
                : ''
            }
          `;
          })
          .join('')}

        <div class="table-title">Code Examples (cURL & Fetch)</div>
        <pre class="code-block">${curlSnippet}</pre>
        ${
          fetchSnippet
            ? `<div style="font-size: 7.5pt; color: #94a3b8; font-family: monospace; margin-top: -10px; margin-bottom: 6px;">JavaScript (ES6 Fetch):</div>
               <pre class="code-block">${fetchSnippet}</pre>`
            : ''
        }
        ${
          pythonSnippet
            ? `<div style="font-size: 7.5pt; color: #94a3b8; font-family: monospace; margin-top: -10px; margin-bottom: 6px;">Python (Requests):</div>
               <pre class="code-block">${pythonSnippet}</pre>`
            : ''
        }
      </div>
    </div>
    `;
  }

  /**
   * Generates vector PDF document or printable standalone HTML artifact
   */
  async generatePdfArtifact(
    contract: CanonicalContract,
  ): Promise<{ token: string; downloadUrl: string; sizeBytes: number }> {
    const printHtml = this.generatePrintHtml(contract);
    const safeName = (contract.name || 'api-contract')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const filename = `${safeName}-manual-v${contract.version || '1.0.0'}.html`;

    return this.storageService.saveExportArtifact(
      filename,
      Buffer.from(printHtml, 'utf-8'),
      'text/html',
      24,
    );
  }
}

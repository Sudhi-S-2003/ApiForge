# ApiForge: Product Requirements Document (PRD)

**Document Version:** 1.0.0  
**Status:** Approved for Architectural Review (Phase Zero)  
**Author:** Principal Software Architect & Technical Research Lead  
**Classification:** Technical Specification  

---

## 1. Executive Summary & Vision

**ApiForge** is a unified, enterprise-grade API Lifecycle Management Platform engineered to address the fragmentation among API design, documentation, testing, and governance tools. Modern development teams typically juggle Postman for ad-hoc manual testing, Swagger Editor for raw OpenAPI editing, ReadMe or Mintlify for developer portals, and fragmented spreadsheets for schema tracking.

ApiForge unifies these workflows into a single, cohesive developer workspace:
- **Visual & Code-Driven API Contract Studio**: Bidirectional visual schema builder and Monaco-driven raw contract editing backed by an immutable Canonical Contract Abstract Syntax Tree (AST).
- **Stripe/Mintlify-Caliber API Documentation Portal**: Server-Side Rendered (SSR) interactive documentation with deep URL hash navigation (`#authentication`, `#post-api-v1-users`), instant multi-language code synthesis, and searchable schema graphs.
- **Secure Postman-Style API Playground**: In-browser request runner backed by an isolated, SSRF-hardened execution proxy with DNS rebinding defenses and microsecond telemetry.
- **Spec Interoperability & Zero-Cost Offline Distribution**: Lossless conversion to/from OpenAPI 3.1.0 and Postman Collection v2.1.0, paired with an asynchronous headless Chromium engine generating print-ready vector PDF documentation and ZIP archives stored securely on local filesystem volumes without cloud vendor costs.

---

## 2. User Personas & Core Journeys

| Persona | Role | Key Pain Points | ApiForge Solution |
| :--- | :--- | :--- | :--- |
| **API Architect / Lead** | Designs enterprise schemas, governs standards, reviews breaking changes. | Inconsistent OpenAPI dialects, untyped ad-hoc modifications, lack of reusable schema registries. | Strict JSON Schema 2020-12 enforcement, reusable `$ref` component registry, semantic version diffing, and breaking change warnings. |
| **Backend Engineer** | Implements endpoints, verifies payload validation, integrates third-party services. | Manual Postman collection maintenance out of sync with code, CORS issues in local testing. | Visual 3-panel studio with instant Monaco sync, bi-directional OpenAPI/Postman import-export, SSRF-safe proxy runner. |
| **Frontend Engineer / Consumer** | Integrates APIs, inspects payload structures, generates mock requests. | Outdated docs, missing response samples for error states, inability to test without setting up local tools. | Click-to-navigate documentation with stable URL anchors, live multi-language snippets (cURL, Fetch, Python, Go), and response previews. |
| **Technical Writer / DevRel** | Publishes developer guides, curates getting-started tutorials, maintains changelogs. | Markdown decoupled from API spec updates, complex build pipelines for docs. | Integrated Markdown documentation pages directly bound to canonical contract versions with one-click PDF and ZIP generation. |

---

## 3. Functional Requirements

### 3.1 Identity, Tenancy & Permissions (FR-IAM)
- **FR-IAM-01: Multi-Tenancy**: The system must provide isolated Workspaces. All projects, contracts, environments, and team memberships must be strictly tenant-scoped.
- **FR-IAM-02: Role-Based Access Control (RBAC)**: Workspaces support hierarchical roles:
  - `OWNER`: Full administrative access, billing, workspace deletion, member management.
  - `ADMIN`: Project management, member invitation, environment secret management.
  - `EDITOR`: Contract authoring, playground execution, version creation, export generation.
  - `VIEWER`: Read-only access to contracts, documentation preview, and playground inspection.
- **FR-IAM-03: Secure Authentication**: Email/password authentication using Argon2id hashing, short-lived JWT access tokens (15 minutes), rotating refresh tokens stored in HTTP-only, SameSite=Strict cookies, and rate-limited login endpoints.

### 3.2 Canonical Contract Engine & Visual Studio (FR-CCE)
- **FR-CCE-01: Canonical Source of Truth**: The contract must exist as a normalized, framework-independent Abstract Syntax Tree (AST) representing servers, tags, folders, endpoints, parameters (path, query, header, cookie), request bodies, responses, security schemes, and reusable `$ref` components.
- **FR-CCE-02: Advanced Schema Dialect**: Full support for JSON Schema 2020-12 / OpenAPI 3.1:
  - Primitive types: `string`, `number`, `integer`, `boolean`, `null`.
  - Complex structures: `object`, `array`, `enum`.
  - Composition: `oneOf`, `anyOf`, `allOf`, and `not`.
  - Constraints: regex `pattern`, `minLength`/`maxLength`, `minimum`/`maximum`, `multipleOf`, `uniqueItems`, `format`.
- **FR-CCE-03: Three-Panel Visual Studio**:
  - *Left Panel*: Folder hierarchy, endpoint list with colored HTTP badges (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`), drag-and-drop reordering, endpoint duplication, and instantaneous fuzzy search.
  - *Center Panel*: Visual form-based editor for method, path, headers, query/path parameters with type selectors, visual schema tree builder, and response code management.
  - *Right Panel*: Monaco JSON/YAML editor featuring bi-directional real-time synchronization, Ajv-based syntax and constraint validation, and inline error highlighting.

### 3.3 Professional Documentation Platform (FR-DOC)
- **FR-DOC-01: Dedicated Project Landing Page**: Displays API metadata, version badge, base URLs, authentication overview, markdown getting-started guide, and endpoint statistics.
- **FR-DOC-02: Full-Page 3-Column Viewer**:
  - *Sticky Top Nav*: Version switcher, instant `Cmd+K` documentation search, light/dark theme switch, copy deep-link, and export dropdown.
  - *Sticky Left Nav*: Interactive table of contents synchronized with browser viewport using `IntersectionObserver`.
  - *Center Content*: Detailed endpoint specifications, parameter tables (Name, Type, Required, Description, Default, Example), request body schema viewer, and response code tabs.
  - *Right Sidebar*: Real-time multi-language code synthesis (cURL, JavaScript Fetch, TypeScript Fetch, Python Requests, Go net/http) and formatted response payload viewer.
- **FR-DOC-03: Deep Hash Navigation**: Stable URL hash routing (`#authentication`, `#post-api-v1-users`, `#schemas-user`) supporting browser history, bookmarking, and zero-layout-shift scrolling on initial load.
- **FR-DOC-04: Public and Private Portals**: Public vanity URL sharing (`/docs/[slug]`) with optional passphrase protection and SSR caching.

### 3.4 API Playground & Outbound Proxy (FR-PLG)
- **FR-PLG-01: Postman-Caliber Interface**: Method selector, dynamic URL bar, parameter/header tables, authorization configuration (Bearer, Basic, API Key), and Monaco raw/JSON body editor.
- **FR-PLG-02: Dynamic Environment Interpolation**: Automatic substitution of `{{baseUrl}}`, `{{token}}`, and custom variables scoped to active environments (`Development`, `Staging`, `Production`).
- **FR-PLG-03: SSRF-Hardened Proxy Service**: All requests are routed through a dedicated NestJS backend gateway. Outbound network traffic enforces strict pre-connect DNS validation, blocking loopback (`127.0.0.0/8`), private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), cloud metadata (`169.254.169.254`), and IPv6 equivalents, while defending against DNS rebinding attacks.
- **FR-PLG-04: Telemetry & Execution History**: High-resolution response timing (DNS, TCP, TTFB, Total ms), byte size calculation, formatted header display, and persistent request history with instant replay.

### 3.5 Import, Export & Asynchronous Worker Engine (FR-IO)
- **FR-IO-01: Bidirectional OpenAPI 3.1**: Lossless parser for JSON/YAML specifications, mapping paths and schemas into the Canonical AST with detailed conversion and information-loss diagnostics.
- **FR-IO-02: Postman Collection v2.1**: Import and export support for Postman collections, translating folders, requests, scripts, variables, and authentication settings.
- **FR-IO-03: Playwright PDF Generation**: Asynchronous BullMQ worker rendering a headless Chromium print template with cover page, interactive table of contents, typographic hierarchy, and syntax-highlighted code samples.
- **FR-IO-04: Streaming ZIP Package**: Bundles `openapi.json`, `openapi.yaml`, `postman_collection.json`, `documentation.pdf`, and standalone offline HTML into a compressed archive.
- **FR-IO-05: Secure Local Filesystem Storage**: Zero-cloud-cost storage volume (`./storage/exports` and `./storage/uploads`) protected by path-traversal sanitization, UUID internal storage keys, MIME validation, and opaque time-limited download tokens.

---

## 4. Non-Functional Requirements (NFR)

- **NFR-PERF-01 (Latency)**: Next.js SSR documentation pages must achieve First Contentful Paint (FCP) in < 300ms on broadband.
- **NFR-PERF-02 (Scalability)**: Canonical Contract Engine must validate and render contracts with 500+ endpoints and deeply nested schemas without blocking the browser UI thread (using Web Workers for client-side Monaco/Ajv where needed).
- **NFR-SEC-01 (Zero Trust)**: All endpoints in NestJS must independently authenticate and authorize tenant boundaries. Server Actions must never be treated as trusted callers.
- **NFR-SEC-02 (Storage Safety)**: Absolute path traversal resistance (`E_PATH_TRAVERSAL`), rejection of null bytes, and restriction of file execution permissions on storage mounts.
- **NFR-REL-01 (Job Resilience)**: Background workers (BullMQ + Redis) must support idempotent job retries, automatic dead-letter queueing, and stale file cleanup routines.

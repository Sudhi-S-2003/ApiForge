# ApiForge: Technology Stack & Dependency Evaluation

**Document Version:** 1.0.0  
**Status:** Approved for Architectural Review (Phase Zero)  
**Author:** Principal Software Architect & Technical Research Lead  
**Classification:** Technical Evaluation  

---

## 1. Runtime & Language Platform

| Component | Selected Version | Alternatives Evaluated | Justification & Research Findings |
| :--- | :--- | :--- | :--- |
| **Node.js** | Node.js v20.x / v22.x LTS (compatible with host v24) | Bun, Deno | Node.js Active LTS provides maximum ecosystem compatibility with native binary dependencies (Prisma, Argon2, Playwright). Node 24 is host-compatible. |
| **Package Manager** | npm Workspaces (v10 / v11) | pnpm, Turborepo | npm Workspaces natively support multi-project monorepos (`web`, `server`, `shared`) without requiring external global toolchains, simplifying local builds and container deployment. |
| **Language** | TypeScript 5.5+ (Strict Mode) | JavaScript, Babel | Strict TypeScript mode (`"strict": true`, `"noImplicitAny": true`, `"exactOptionalPropertyTypes": true`) ensures end-to-end type safety from the Canonical AST across NestJS and Next.js. |

---

## 2. Frontend Technology Stack (`web`)

| Layer | Selected Technology | Evaluated Alternatives | Evaluation & Architectural Decision |
| :--- | :--- | :--- | :--- |
| **Framework** | **Next.js 14.2+ (App Router)** | Next.js 15 (RC/Early), Remix / React Router v7 | Next.js 14.2 LTS is stable, battle-tested with React 18, and avoids the breaking async request API changes and React 19 ecosystem incompatibilities (e.g., Monaco Editor, DnD libraries) found in early Next.js 15. Server Actions and Server Components are fully mature. |
| **UI Components** | **shadcn/ui + Tailwind CSS 3.4** | Material-UI, Chakra UI, Ant Design | shadcn/ui provides unstyled, accessible Radix UI primitives with copy-paste component ownership. It delivers zero runtime CSS overhead, full Tailwind CSS customization, and flawless dark/light mode support. |
| **Code Editor** | **Monaco Editor (`@monaco-editor/react`)** | CodeMirror 6, Ace Editor | Monaco Editor is the actual VS Code editor engine. It offers first-class JSON Schema validation, inline error markers, code folding, minimization map, and diff viewing, essential for developer credibility in an API contract studio. |
| **Drag & Drop** | **`@dnd-kit/core` & `@dnd-kit/sortable`** | `react-beautiful-dnd` (Deprecated by Atlassian), `react-dnd` | `react-beautiful-dnd` is abandoned and officially unmaintained. `@dnd-kit` is modern, modular, supports keyboard accessibility, touch screens, and has zero dependency on legacy React lifecycles. |
| **Form Handling** | **React Hook Form + Zod** | Formik, native forms | React Hook Form minimizes re-renders using uncontrolled inputs with refs, which is critical when editing large API endpoints with dozens of parameters and headers. |
| **Client State** | **Zustand + TanStack Query v5** | Redux Toolkit, Jotai | Zustand offers a lightweight, boilerplate-free store for transient editor UI state (active tabs, panel sizing, selection). TanStack Query manages server cache, background revalidation, and optimistic updates. |

---

## 3. Backend Technology Stack (`server`)

| Layer | Selected Technology | Evaluated Alternatives | Evaluation & Architectural Decision |
| :--- | :--- | :--- | :--- |
| **Framework** | **NestJS 10.4+** | Express (bare), Fastify (bare), Koa | NestJS provides an enterprise-grade modular architecture with built-in dependency injection, guards, interceptors, pipes, and OpenAPI Swagger generation. It enforces strict separation between controllers, services, and repositories. |
| **Database ORM** | **Prisma ORM 5.x / 6.x + PostgreSQL 16** | TypeORM, Drizzle ORM, Kysely | Prisma provides declarative schema modeling, auto-generated migrations, and end-to-end type safety. Complex JSON query operators enable performant queries on JSONB canonical contracts. |
| **Queue & Worker** | **BullMQ 5.x + Redis 7** | RabbitMQ, Kafka, Agenda, pg-boss | BullMQ is the gold standard for Redis-based background processing in Node.js. It features robust retry logic, parent-child job workflows, rate limiting, and dead-letter queues, perfect for asynchronous PDF rendering and ZIP exports. |
| **JSON Schema Validation** | **Ajv v8.17+ with `ajv-formats`** | Zod (runtime only), Joi | Ajv is the fastest and most compliant JSON Schema validator in the JavaScript ecosystem. Supporting JSON Schema Draft 7, Draft 2019-09, and Draft 2020-12, it handles circular reference detection and full constraint verification. |
| **PDF Generation** | **Playwright Chromium Headless** | Puppeteer, wkhtmltopdf, PDFKit | Playwright generates pixel-perfect vector PDFs using modern CSS (Flexbox, Grid, Print media queries) and isolated browser contexts. wkhtmltopdf is abandoned and insecure; PDFKit lacks modern CSS layout capabilities. |
| **Password Hashing** | **Argon2id (`argon2`)** | bcrypt, scrypt, PBKDF2 | Argon2id is the winner of the Password Hashing Competition (PHC) and recommended by OWASP. It provides superior resistance against GPU and ASIC side-channel attacks compared to legacy bcrypt. |
| **Archive Packaging** | **`archiver` 7.x** | JSZip, adm-zip | `archiver` supports pure Node.js streaming to disk or HTTP response streams, ensuring that multi-megabyte ZIP generation does not consume excessive heap memory. |

---

## 4. Shared Domain Package (`shared`)

| Layer | Selection | Justification |
| :--- | :--- | :--- |
| **Structure** | Pure TypeScript library with zero native or Node-only bindings. | Allows execution seamlessly in both the browser (Next.js Client Components for instant preview) and the backend (NestJS services and BullMQ workers). |
| **OpenAPI Serializer** | Custom Canonical-to-OpenAPI 3.1 & OpenAPI-to-Canonical transformer + `yaml` 2.x for YAML encoding. | Avoids heavy multi-megabyte swagger tools; guarantees lossless round-trip transformations. |
| **Snippet Generator** | Dedicated AST-to-Code generator (cURL, Fetch, Python Requests, Go `net/http`). | Generates idiomatic, executable code snippets dynamically based on the active endpoint's method, headers, query parameters, and request body. |

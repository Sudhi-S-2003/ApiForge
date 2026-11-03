# ADR-005: Asynchronous Vector PDF Generation via BullMQ and Playwright

**Status:** Accepted  
**Date:** 2026-11-02  
**Context:**  
Generating a multi-page API manual with table of contents, typographic hierarchy, and syntax-highlighted code samples is CPU and memory intensive. Executing this synchronously in the NestJS HTTP request cycle would block the event loop and crash under concurrent load. Traditional libraries like `wkhtmltopdf` are abandoned and security-vulnerable, while `PDFKit` lacks modern CSS support.

**Decision:**  
We implement an asynchronous worker architecture using Redis and BullMQ:
1. NestJS enqueues an `ExportJob` and immediately responds to the client with `202 Accepted { jobId }`.
2. An isolated BullMQ worker process consumes the job, fetches the Canonical AST, synthesizes an HTML print document styled with Tailwind CSS, and renders it using headless Chromium in Playwright (`page.pdf({ format: 'A4', printBackground: true })`).
3. The resulting PDF is saved directly to `./storage/exports/{uuid}.pdf`.
4. The client polls the status and receives an opaque download token upon completion.

**Consequences:**  
- *Positive*: Unblocked NestJS HTTP event loop; pixel-perfect PDF rendering with modern CSS flexbox/grid; vector text and clickable table of contents; robust queue retries.  
- *Negative*: Requires Chromium binaries in the worker container (managed cleanly via Docker multi-stage builds).

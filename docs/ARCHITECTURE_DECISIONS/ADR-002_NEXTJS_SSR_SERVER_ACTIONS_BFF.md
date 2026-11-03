# ADR-002: Next.js SSR and Server Actions as Backend-For-Frontend (BFF)

**Status:** Accepted  
**Date:** 2026-11-02  
**Context:**  
The user requires Next.js for the web interface and NestJS for the server, specifically instructing: "best way use server side render and server action, all backend logic must in nest js server". A naive approach might query PostgreSQL directly from Next.js Server Components, which breaks tier boundaries, creates split business logic, and risks security leaks.

**Decision:**  
Next.js acts strictly as the Presentation Tier and Backend-For-Frontend (BFF):
1. **Server Components (SSR)**: Fetch read-only data (like public/private documentation and dashboard overviews) by calling NestJS internal HTTP endpoints, ensuring sub-300ms First Contentful Paint without client layout shifts.
2. **Server Actions**: Handle form mutations by proxying requests to NestJS with secure HTTP-only cookies, revalidating cache paths (`revalidatePath`).
3. **No Direct DB Access**: Next.js never connects directly to PostgreSQL or Prisma. NestJS enforces 100% of business rules and authorization.

**Consequences:**  
- *Positive*: Clean architectural boundary; no duplicated business logic; server-rendered documentation is blazing fast; internal service secrets remain shielded from client bundles.  
- *Negative*: Slight overhead of internal network HTTP calls between Next.js and NestJS, mitigated by fast local container networking.

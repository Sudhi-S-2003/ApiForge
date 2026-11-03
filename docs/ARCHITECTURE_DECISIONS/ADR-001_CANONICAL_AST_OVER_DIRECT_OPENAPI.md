# ADR-001: Adoption of Canonical Contract AST as Single Source of Truth

**Status:** Accepted  
**Date:** 2026-11-02  
**Context:**  
An API contract lifecycle platform must support multiple representations: visual form editing, raw JSON/YAML editing (Monaco), human documentation generation, Postman collections, and OpenAPI 3.1. Storing raw OpenAPI or Postman JSON directly in the database binds the entire platform to third-party dialect quirks and makes visual form editing and fast schema traversal brittle.

**Decision:**  
We define a normalized, framework-independent **Canonical Contract Abstract Syntax Tree (AST)** as the authoritative single source of truth in `packages/shared`. All other representations (OpenAPI 3.1, Postman v2.1, Documentation UI, Code Snippets) are derived via pure bidirectional adapters.

**Consequences:**  
- *Positive*: Zero vendor lock-in; reliable UI state binding; strict structural validation using Ajv; simplified semantic diffing.  
- *Negative*: Requires maintaining adapters for OpenAPI and Postman with explicit diagnostic reporting for unmapped dialect features.

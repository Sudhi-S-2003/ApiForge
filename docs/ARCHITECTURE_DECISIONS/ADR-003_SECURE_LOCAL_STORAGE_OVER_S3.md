# ADR-003: Secure Local Filesystem Storage Over Cloud Object Storage

**Status:** Accepted  
**Date:** 2026-11-02  
**Context:**  
The user explicitly instructed: "not need s3 storage normal folder storage etc less cost best and secure system". AWS S3 introduces cloud bills, credential management, egress costs, and cloud network latency. However, local storage introduces potential path traversal (`../../etc/passwd`) and disk exhaustion risks if designed carelessly.

**Decision:**  
We replace AWS S3 with an enterprise-grade `LocalStorageService` utilizing mounted disk volumes (`./storage/exports` and `./storage/uploads`). Security is enforced via:
1. Hardened path normalization preventing path traversal escapes.
2. UUID-only disk filenames (user filenames stored in DB metadata only).
3. Opaque, cryptographically random, short-lived download tokens (`/api/v1/storage/download/:token`).
4. Automated retention and cleanup jobs purging temporary exports after 24 hours.
5. Abstract `StorageProvider` interface allowing seamless future pluggability if cloud storage is ever required.

**Consequences:**  
- *Positive*: Zero cloud storage and egress fees; completely self-contained deployment; fast local NVMe streaming.  
- *Negative*: Requires disk space monitoring and backup volume mounting in Docker deployments.

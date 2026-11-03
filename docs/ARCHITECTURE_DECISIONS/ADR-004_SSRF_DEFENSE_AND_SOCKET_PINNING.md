# ADR-004: Server-Side Request Forgery (SSRF) Defense via DNS Pre-Resolution & Socket Pinning

**Status:** Accepted  
**Date:** 2026-11-02  
**Context:**  
The API Playground requires executing arbitrary HTTP requests on behalf of users. Naive implementations allow attackers to probe `localhost`, cloud instance metadata (`169.254.169.254`), or execute DNS rebinding attacks where an attacker's domain resolves to an external IP initially, but subsequently resolves to an internal IP when the HTTP client establishes a socket connection.

**Decision:**  
We implement a multi-layered SSRF mitigation engine in NestJS:
1. Parse URL strictly for `http:` or `https:`.
2. Asynchronously resolve all IPv4 and IPv6 addresses using `dns.promises.lookup({ all: true })`.
3. Validate resolved IPs against an exhaustive CIDR blocklist (Loopback, RFC 1918, Carrier-Grade NAT, Cloud Metadata, IPv4-mapped IPv6).
4. Pin the verified IP address directly into a custom `http.Agent` / `https.Agent` connection callback, completely neutralizing DNS rebinding attacks.
5. Impose strict timeouts (10 seconds) and response payload size caps (10 MB).

**Consequences:**  
- *Positive*: Complete defense against internal infrastructure probing and DNS rebinding exploits.  
- *Negative*: Disallows playground requests to internal corporate intranets without an explicit administrative allowlist.

# ApiForge: REST API Specification & Contract Endpoints

**Document Version:** 1.0.0  
**Status:** Approved for Architectural Review (Phase Zero)  
**Author:** Principal Software Architect & Technical Research Lead  
**Classification:** API Specification  

---

## 1. Global API Conventions

- **Base URL**: `/api/v1`
- **Protocol**: HTTPS (enforced via HSTS)
- **Content-Type**: `application/json` (except multipart file imports and stream downloads)
- **Standard Success Envelope**:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { "page": 1, "limit": 20, "total": 142 } // For paginated collections
  }
  ```
- **Standard Error Envelope**:
  ```json
  {
    "success": false,
    "error": {
      "code": "E_VALIDATION_FAILED",
      "message": "The payload failed schema validation",
      "details": [
        { "field": "path", "message": "Path must start with a forward slash '/'" }
      ],
      "timestamp": "2026-11-02T13:40:00.000Z"
    }
  }
  ```

---

## 2. API Endpoint Catalog

### 2.1 Authentication & Profile (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register new user account with email & password | None |
| `POST` | `/auth/login` | Authenticate, issue access token & refresh cookie | None (Rate Limited) |
| `POST` | `/auth/refresh` | Rotate refresh token and issue new access token | Refresh Cookie |
| `POST` | `/auth/logout` | Revoke active refresh token and clear cookie | Bearer Token |
| `GET` | `/auth/me` | Retrieve authenticated user profile & memberships | Bearer Token |

### 2.2 Workspaces & Members (`/api/v1/workspaces`)
| Method | Endpoint | Description | Required Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/workspaces` | List all workspaces user is a member of | None (User) |
| `POST` | `/workspaces` | Create new workspace (creator becomes OWNER) | None (User) |
| `GET` | `/workspaces/:id` | Get workspace details, members, and projects | VIEWER |
| `PATCH` | `/workspaces/:id` | Update workspace name or description | ADMIN |
| `DELETE` | `/workspaces/:id` | Delete workspace and all cascading projects | OWNER |
| `POST` | `/workspaces/:id/members/invite` | Send invitation link to email with role | ADMIN |
| `DELETE` | `/workspaces/:id/members/:userId` | Remove member from workspace | ADMIN |

### 2.3 Projects & Environments (`/api/v1/projects`)
| Method | Endpoint | Description | Required Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/workspaces/:workspaceId/projects` | Create a new API project | EDITOR |
| `GET` | `/projects/:id` | Get project metadata, versions, and environments | VIEWER |
| `GET` | `/projects/:id/environments` | List environments (Dev, Staging, Prod) | VIEWER |
| `POST` | `/projects/:id/environments` | Add environment with base URL and variables | EDITOR |
| `PUT` | `/projects/:id/environments/:envId` | Update environment variables and secrets | EDITOR |

### 2.4 API Versions, Folders & Contracts (`/api/v1/versions`)
| Method | Endpoint | Description | Required Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects/:projectId/versions` | List semantic versions of an API project | VIEWER |
| `POST` | `/projects/:projectId/versions` | Create new version (draft clone or blank) | EDITOR |
| `GET` | `/versions/:id/contract` | Get full Canonical Contract snapshot | VIEWER |
| `POST` | `/versions/:id/folders` | Create organizational folder | EDITOR |
| `PATCH` | `/versions/:id/folders/reorder` | Drag-and-drop folder reordering | EDITOR |
| `POST` | `/versions/:id/endpoints` | Create new endpoint in version/folder | EDITOR |
| `GET` | `/endpoints/:id` | Get individual endpoint canonical details | VIEWER |
| `PUT` | `/endpoints/:id` | Update endpoint (path, method, schema, responses)| EDITOR |
| `DELETE` | `/endpoints/:id` | Delete endpoint | EDITOR |
| `POST` | `/endpoints/:id/duplicate` | Duplicate endpoint | EDITOR |

### 2.5 Reusable Schemas (`/api/v1/versions/:versionId/schemas`)
| Method | Endpoint | Description | Required Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/versions/:versionId/schemas` | List all reusable schemas ($ref components) | VIEWER |
| `POST` | `/versions/:versionId/schemas` | Create reusable schema definition | EDITOR |
| `PUT` | `/versions/:versionId/schemas/:id` | Update reusable schema definition | EDITOR |
| `DELETE` | `/versions/:versionId/schemas/:id` | Delete reusable schema (with usage check) | EDITOR |

### 2.6 Public & Private Documentation (`/api/v1/docs`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/docs/:slug` | Fetch complete public documentation AST | None / Passphrase |
| `POST` | `/projects/:projectId/publish` | Publish version to public/private portal | ADMIN |
| `PATCH` | `/docs/:slug/settings` | Update branding, custom domain, and theme | ADMIN |

### 2.7 SSRF-Hardened Playground Proxy (`/api/v1/playground`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/playground/execute` | Execute safe outbound HTTP test request | EDITOR / VIEWER |
| `GET` | `/playground/history` | List user request execution history | Bearer Token |

### 2.8 Spec Import & Export (`/api/v1/export` & `/api/v1/import`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/export/:versionId/openapi/json` | Synchronous OpenAPI 3.1 JSON export | VIEWER |
| `GET` | `/export/:versionId/openapi/yaml` | Synchronous OpenAPI 3.1 YAML export | VIEWER |
| `GET` | `/export/:versionId/postman` | Synchronous Postman Collection v2.1 export | VIEWER |
| `POST` | `/export/:versionId/pdf` | Enqueue background Playwright PDF generation | VIEWER |
| `POST` | `/export/:versionId/zip` | Enqueue background full bundle ZIP generation | VIEWER |
| `GET` | `/export/jobs/:jobId` | Poll background export status & download token | VIEWER |
| `POST` | `/import/:versionId/openapi` | Import OpenAPI 3.x spec with diagnostic report | EDITOR |
| `POST` | `/import/:versionId/postman` | Import Postman Collection v2.1 with report | EDITOR |

### 2.9 Secure Local Storage Download (`/api/v1/storage`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/storage/download/:token` | Stream authorized file with Content-Disposition | Valid Token |

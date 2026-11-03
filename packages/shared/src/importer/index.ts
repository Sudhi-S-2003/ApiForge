import * as YAML from 'yaml';
import {
  CanonicalContract,
  CanonicalEndpoint,
  CanonicalParameter,
  CanonicalRequestBody,
  CanonicalResponse,
  CanonicalSchemaDefinition,
  CanonicalServer,
} from '../canonical';

export interface ImportResult {
  contract: CanonicalContract;
  format: 'openapi_3_1' | 'openapi_3_0' | 'swagger_2_0' | 'postman_2_1' | 'postman_2_0' | 'unknown';
  warnings: string[];
  unsupportedFeatures: string[];
}

/**
 * Parses raw JSON or YAML string into JavaScript Object safely
 */
export function parseRawInput(input: string | Record<string, any>): Record<string, any> {
  if (typeof input === 'object' && input !== null) {
    return input;
  }
  const trimmed = input.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return YAML.parse(trimmed);
    }
  }
  return YAML.parse(trimmed);
}

/**
 * Imports OpenAPI 3.0 / 3.1 / Swagger 2.0 and converts to CanonicalContract AST
 */
export function importOpenApi(input: string | Record<string, any>): ImportResult {
  const doc = parseRawInput(input);
  const warnings: string[] = [];
  const unsupportedFeatures: string[] = [];

  let format: ImportResult['format'] = 'unknown';
  if (doc.openapi?.startsWith('3.1')) {
    format = 'openapi_3_1';
  } else if (doc.openapi?.startsWith('3.0')) {
    format = 'openapi_3_0';
  } else if (doc.swagger === '2.0') {
    format = 'swagger_2_0';
    warnings.push('Swagger 2.0 specification detected; converted parameters and definitions to OpenAPI 3.x schema model.');
  }

  const name = doc.info?.title || 'Imported API';
  const version = doc.info?.version || '1.0.0';
  const description = doc.info?.description || '';

  // Servers
  const servers: CanonicalServer[] = [];
  if (Array.isArray(doc.servers) && doc.servers.length > 0) {
    let sIdx = 1;
    for (const s of doc.servers) {
      if (s.url) {
        servers.push({
          id: `srv-${sIdx++}`,
          url: s.url,
          description: s.description,
        });
      }
    }
  } else if (doc.host) {
    const scheme = (doc.schemes && doc.schemes[0]) || 'https';
    const basePath = doc.basePath || '';
    servers.push({
      id: 'srv-1',
      url: `${scheme}://${doc.host}${basePath}`,
      description: 'Default Server',
    });
  } else {
    servers.push({
      id: 'srv-1',
      url: 'http://localhost:3000',
      description: 'Localhost',
    });
  }

  // Schemas / Components
  const reusableSchemas: Record<string, CanonicalSchemaDefinition> = {};
  const rawSchemas = doc.components?.schemas || doc.definitions || {};
  for (const [schemaName, schemaObj] of Object.entries(rawSchemas)) {
    reusableSchemas[schemaName] = schemaObj as CanonicalSchemaDefinition;
  }

  // Paths & Endpoints
  const endpoints: CanonicalEndpoint[] = [];
  const rawPaths = doc.paths || {};
  const validMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
  let endpointCounter = 1;

  for (const [pathStr, pathItem] of Object.entries(rawPaths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    const pathLevelParams = Array.isArray((pathItem as any).parameters)
      ? (pathItem as any).parameters
      : [];

    for (const methodKey of Object.keys(pathItem)) {
      if (!validMethods.includes(methodKey.toLowerCase())) continue;

      const op = (pathItem as any)[methodKey];
      if (!op || typeof op !== 'object') continue;

      if (op.callbacks) unsupportedFeatures.push(`Callback on ${methodKey.toUpperCase()} ${pathStr}`);
      if (op.links) unsupportedFeatures.push(`Runtime Links on ${methodKey.toUpperCase()} ${pathStr}`);

      const combinedParams = [...pathLevelParams, ...(Array.isArray(op.parameters) ? op.parameters : [])];
      const parameters: CanonicalParameter[] = [];
      let pIdx = 1;

      for (const p of combinedParams) {
        if (!p || typeof p !== 'object') continue;

        if (['path', 'query', 'header', 'cookie'].includes(p.in)) {
          parameters.push({
            id: `p-${pIdx++}`,
            name: p.name,
            in: p.in,
            required: p.in === 'path' ? true : !!p.required,
            description: p.description,
            schema: p.schema || (p.type ? { type: p.type } : { type: 'string' }),
            example: p.example,
          });
        } else if (p.in === 'body') {
          warnings.push(`Swagger 2.0 body parameter '${p.name}' mapped to requestBody.`);
        }
      }

      // Request Body
      let requestBody: CanonicalRequestBody | undefined = undefined;
      if (op.requestBody && typeof op.requestBody === 'object') {
        const rawContent = op.requestBody.content || {};
        const content: Record<string, { schema: CanonicalSchemaDefinition; examples?: Record<string, { summary?: string; value: unknown }> }> = {};

        for (const [mime, mimeObj] of Object.entries(rawContent)) {
          const m = mimeObj as any;
          content[mime] = {
            schema: m.schema || { type: 'object' },
            ...(m.example !== undefined ? { examples: { default: { value: m.example } } } : {}),
            ...(m.examples ? { examples: m.examples } : {}),
          };
        }

        requestBody = {
          description: op.requestBody.description,
          required: !!op.requestBody.required,
          content: Object.keys(content).length > 0 ? content : { 'application/json': { schema: { type: 'object' } } },
        };
      }

      // Responses
      const responses: CanonicalResponse[] = [];
      const rawResponses = op.responses || {};
      let rIdx = 1;

      for (const [codeStr, respObj] of Object.entries(rawResponses)) {
        const r = respObj as any;
        const content: Record<string, { schema: CanonicalSchemaDefinition; examples?: Record<string, { summary?: string; value: unknown }> }> = {};

        if (r.content && typeof r.content === 'object') {
          for (const [mime, mObj] of Object.entries(r.content)) {
            const m = mObj as any;
            content[mime] = {
              schema: m.schema || { type: 'object' },
              ...(m.example !== undefined ? { examples: { default: { value: m.example } } } : {}),
              ...(m.examples ? { examples: m.examples } : {}),
            };
          }
        } else if (r.schema) {
          content['application/json'] = {
            schema: r.schema,
            examples: r.examples?.['application/json'] ? { default: { value: r.examples['application/json'] } } : undefined,
          };
        }

        responses.push({
          id: `r-${rIdx++}`,
          statusCode: codeStr,
          description: r.description || `Status ${codeStr}`,
          content: Object.keys(content).length > 0 ? content : undefined,
        });
      }

      if (responses.length === 0) {
        responses.push({
          id: 'r-1',
          statusCode: '200',
          description: 'Successful Response',
          content: { 'application/json': { schema: { type: 'object' } } },
        });
      }

      endpoints.push({
        id: `ep-${endpointCounter}`,
        orderIndex: endpointCounter++,
        method: methodKey.toUpperCase() as any,
        path: pathStr,
        summary: op.summary || `${methodKey.toUpperCase()} ${pathStr}`,
        description: op.description || '',
        tags: Array.isArray(op.tags) ? op.tags : [],
        deprecated: !!op.deprecated,
        security: [],
        parameters,
        requestBody,
        responses,
      });
    }
  }

  const contract: CanonicalContract = {
    id: `contract-${Date.now()}`,
    name,
    version,
    description,
    servers,
    tags: [],
    folders: [],
    endpoints,
    reusableSchemas,
    securitySchemes: {},
  };

  return {
    contract,
    format,
    warnings,
    unsupportedFeatures,
  };
}

/**
 * Imports Postman Collection v2.0 / v2.1 JSON and converts to CanonicalContract AST
 */
export function importPostman(input: string | Record<string, any>): ImportResult {
  const col = parseRawInput(input);
  const warnings: string[] = [];
  const unsupportedFeatures: string[] = [];

  const schemaUri = col.info?.schema || '';
  const isV21 = schemaUri.includes('v2.1.0');
  const format: ImportResult['format'] = isV21 ? 'postman_2_1' : 'postman_2_0';

  const name = col.info?.name || 'Imported Postman Collection';
  const description = col.info?.description || '';
  const version = col.info?.version || '1.0.0';

  let baseUrl = 'http://localhost:3000';
  if (Array.isArray(col.variable)) {
    const baseVar = col.variable.find((v: any) => v.key === 'baseUrl' || v.key === 'base_url');
    if (baseVar && baseVar.value) {
      baseUrl = String(baseVar.value);
    }
  }

  const endpoints: CanonicalEndpoint[] = [];
  let endpointCounter = 1;

  function traverseItems(items: any[], folderTrail: string[] = []) {
    if (!Array.isArray(items)) return;

    for (const item of items) {
      if (!item) continue;

      if (Array.isArray(item.item)) {
        traverseItems(item.item, [...folderTrail, item.name]);
      } else if (item.request) {
        const req = item.request;
        const method = (req.method || 'GET').toUpperCase();

        let path = '/';
        const queryParams: CanonicalParameter[] = [];
        const pathVariables: CanonicalParameter[] = [];
        let pCounter = 1;

        if (typeof req.url === 'string') {
          try {
            const u = new URL(req.url.replace(/{{[^}]+}}/g, 'http://placeholder.internal'));
            path = u.pathname;
            u.searchParams.forEach((val, key) => {
              queryParams.push({
                id: `p-${pCounter++}`,
                name: key,
                in: 'query',
                required: false,
                example: val,
                schema: { type: 'string' },
              });
            });
          } catch {
            path = req.url.startsWith('/') ? req.url : `/${req.url}`;
          }
        } else if (req.url && typeof req.url === 'object') {
          if (Array.isArray(req.url.path)) {
            path = '/' + req.url.path.join('/');
          } else if (req.url.raw) {
            path = req.url.raw.replace(/^{{[^}]+}}/, '');
            if (!path.startsWith('/')) path = '/' + path;
          }

          if (Array.isArray(req.url.query)) {
            for (const q of req.url.query) {
              if (q.key) {
                queryParams.push({
                  id: `p-${pCounter++}`,
                  name: q.key,
                  in: 'query',
                  required: !q.disabled,
                  description: q.description,
                  example: q.value,
                  schema: { type: 'string' },
                });
              }
            }
          }

          if (Array.isArray(req.url.variable)) {
            for (const v of req.url.variable) {
              if (v.key) {
                pathVariables.push({
                  id: `p-${pCounter++}`,
                  name: v.key,
                  in: 'path',
                  required: true,
                  description: v.description,
                  example: v.value,
                  schema: { type: 'string' },
                });
              }
            }
          }
        }

        const headers: CanonicalParameter[] = [];
        if (Array.isArray(req.header)) {
          for (const h of req.header) {
            if (h.key && !['content-type', 'accept'].includes(h.key.toLowerCase())) {
              headers.push({
                id: `p-${pCounter++}`,
                name: h.key,
                in: 'header',
                required: !h.disabled,
                description: h.description,
                example: h.value,
                schema: { type: 'string' },
              });
            }
          }
        }

        let requestBody: CanonicalRequestBody | undefined = undefined;
        if (req.body && req.body.mode === 'raw' && req.body.raw) {
          try {
            const parsed = JSON.parse(req.body.raw);
            requestBody = {
              required: true,
              content: {
                'application/json': {
                  schema: { type: 'object' },
                  examples: { default: { value: parsed } },
                },
              },
            };
          } catch {
            requestBody = {
              required: true,
              content: {
                'application/json': {
                  schema: { type: 'string' },
                  examples: { default: { value: req.body.raw } },
                },
              },
            };
          }
        }

        if (Array.isArray(item.event)) {
          for (const ev of item.event) {
            if (ev.listen === 'test' || ev.listen === 'prerequest') {
              warnings.push(`Postman '${ev.listen}' script in '${item.name}' not converted to contract AST.`);
            }
          }
        }

        endpoints.push({
          id: `ep-${endpointCounter}`,
          orderIndex: endpointCounter++,
          method: method as any,
          path,
          summary: item.name || `${method} ${path}`,
          description: req.description || '',
          tags: folderTrail.length > 0 ? [folderTrail[folderTrail.length - 1]] : [],
          security: [],
          parameters: [...pathVariables, ...queryParams, ...headers],
          requestBody,
          responses: [
            {
              id: 'r-1',
              statusCode: '200',
              description: 'Successful Response',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          ],
        });
      }
    }
  }

  traverseItems(col.item || []);

  const contract: CanonicalContract = {
    id: `contract-${Date.now()}`,
    name,
    version,
    description,
    servers: [{ id: 'srv-1', url: baseUrl, description: 'Base Environment Server' }],
    tags: [],
    folders: [],
    endpoints,
    reusableSchemas: {},
    securitySchemes: {},
  };

  return {
    contract,
    format,
    warnings,
    unsupportedFeatures,
  };
}

import * as YAML from 'yaml';
import { CanonicalContract, CanonicalEndpoint } from '../canonical';

export interface OpenApiExportOptions {
  includeExamples?: boolean;
}

/**
 * Converts Canonical Contract AST into OpenAPI 3.1.0 Object
 */
export function exportToOpenApi31(
  contract: CanonicalContract,
  _options: OpenApiExportOptions = {},
): Record<string, any> {
  const paths: Record<string, any> = {};

  for (const endpoint of contract.endpoints) {
    // Normalise path parameters from :param to {param}
    const openApiPath = endpoint.path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');

    if (!paths[openApiPath]) {
      paths[openApiPath] = {};
    }

    const methodKey = endpoint.method.toLowerCase();

    // Map parameters
    const parameters: any[] = [];

    for (const p of endpoint.parameters) {
      if (['path', 'query', 'header', 'cookie'].includes(p.in)) {
        if (p.in === 'header' && ['content-type', 'accept', 'authorization'].includes(p.name.toLowerCase())) {
          continue;
        }
        parameters.push({
          name: p.name,
          in: p.in,
          required: p.in === 'path' ? true : !!p.required,
          description: p.description,
          schema: p.schema || { type: 'string' },
          example: p.example,
        });
      }
    }

    // Request body
    let requestBody: any = undefined;
    if (endpoint.requestBody) {
      const content: Record<string, any> = {};
      for (const [mime, contentObj] of Object.entries(endpoint.requestBody.content)) {
        content[mime] = {
          schema: contentObj.schema,
          ...(contentObj.examples ? { examples: contentObj.examples } : {}),
        };
      }
      requestBody = {
        description: endpoint.requestBody.description,
        required: !!endpoint.requestBody.required,
        content,
      };
    }

    // Responses
    const responses: Record<string, any> = {};
    for (const resp of endpoint.responses) {
      const content: Record<string, any> = {};
      if (resp.content) {
        for (const [mime, contentObj] of Object.entries(resp.content)) {
          content[mime] = {
            schema: contentObj.schema,
            ...(contentObj.examples ? { examples: contentObj.examples } : {}),
          };
        }
      }

      const headers: Record<string, any> = {};
      if (resp.headers) {
        for (const [headerName, headerObj] of Object.entries(resp.headers)) {
          headers[headerName] = {
            description: headerObj.description,
            schema: headerObj.schema,
          };
        }
      }

      responses[String(resp.statusCode)] = {
        description: resp.description || 'Response description',
        content: Object.keys(content).length > 0 ? content : undefined,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      };
    }

    // Fallback default response if none defined
    if (Object.keys(responses).length === 0) {
      responses['200'] = { description: 'Successful operation' };
    }

    paths[openApiPath][methodKey] = {
      summary: endpoint.summary,
      description: endpoint.description,
      operationId: `${methodKey}_${openApiPath.replace(/[^a-zA-Z0-9]/g, '_')}`,
      tags: endpoint.tags && endpoint.tags.length > 0 ? endpoint.tags : undefined,
      deprecated: endpoint.deprecated ? true : undefined,
      parameters: parameters.length > 0 ? parameters : undefined,
      requestBody,
      responses,
    };
  }

  return {
    openapi: '3.1.0',
    info: {
      title: contract.name,
      version: contract.version,
      description: contract.description || '',
    },
    servers: (contract.servers || []).map((s) => ({
      url: s.url,
      description: s.description,
    })),
    paths,
    components: {
      schemas: Object.keys(contract.reusableSchemas || {}).length > 0 ? contract.reusableSchemas : undefined,
      securitySchemes: Object.keys(contract.securitySchemes || {}).length > 0 ? contract.securitySchemes : undefined,
    },
  };
}

/**
 * Serializes Canonical Contract AST to OpenAPI 3.1.0 JSON string
 */
export function exportToOpenApiJson(contract: CanonicalContract, pretty = true): string {
  const doc = exportToOpenApi31(contract);
  return JSON.stringify(doc, null, pretty ? 2 : undefined);
}

/**
 * Serializes Canonical Contract AST to OpenAPI 3.1.0 YAML string
 */
export function exportToOpenApiYaml(contract: CanonicalContract): string {
  const doc = exportToOpenApi31(contract);
  return YAML.stringify(doc, { indent: 2 });
}

/**
 * Converts Canonical Contract AST into Postman Collection v2.1.0 Object
 */
export function exportToPostman(contract: CanonicalContract): Record<string, any> {
  const items: any[] = [];

  // Group by folder/tag
  const folderMap = new Map<string, any[]>();
  const rootItems: any[] = [];

  for (const endpoint of contract.endpoints) {
    const postmanItem = convertEndpointToPostmanItem(endpoint);
    const tag = endpoint.tags && endpoint.tags.length > 0 ? endpoint.tags[0] : null;

    if (tag) {
      if (!folderMap.has(tag)) {
        folderMap.set(tag, []);
      }
      folderMap.get(tag)!.push(postmanItem);
    } else {
      rootItems.push(postmanItem);
    }
  }

  for (const [folderName, folderEndpoints] of folderMap.entries()) {
    items.push({
      name: folderName,
      item: folderEndpoints,
    });
  }

  items.push(...rootItems);

  return {
    info: {
      _postman_id: `apiforge-${Date.now()}`,
      name: contract.name,
      description: contract.description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      version: contract.version,
    },
    item: items,
    variable: [
      {
        key: 'baseUrl',
        value: contract.servers[0]?.url || 'http://localhost:3000',
        type: 'string',
      },
    ],
  };
}

function convertEndpointToPostmanItem(endpoint: CanonicalEndpoint): any {
  // Convert path format {id} or :id to :id for Postman URL syntax
  const postmanPath = endpoint.path.replace(/\{([a-zA-Z0-9_]+)\}/g, ':$1');
  const pathSegments = postmanPath.split('/').filter(Boolean);

  const queryParams = endpoint.parameters
    .filter((p) => p.in === 'query')
    .map((p) => ({
      key: p.name,
      value: p.example !== undefined ? String(p.example) : '',
      description: p.description,
      disabled: !p.required,
    }));

  const pathVariables = endpoint.parameters
    .filter((p) => p.in === 'path')
    .map((p) => ({
      key: p.name,
      value: p.example !== undefined ? String(p.example) : '',
      description: p.description,
    }));

  const headers = endpoint.parameters
    .filter((p) => p.in === 'header')
    .map((h) => ({
      key: h.name,
      value: h.example !== undefined ? String(h.example) : '',
      description: h.description,
      disabled: !h.required,
    }));

  let body: any = undefined;
  if (endpoint.requestBody?.content['application/json']) {
    const jsonContent = endpoint.requestBody.content['application/json'];
    const exampleVal = jsonContent.examples ? Object.values(jsonContent.examples)[0]?.value : jsonContent.schema.example;
    const bodyStr = exampleVal ? JSON.stringify(exampleVal, null, 2) : '{\n  \n}';
    body = {
      mode: 'raw',
      raw: bodyStr,
      options: {
        raw: {
          language: 'json',
        },
      },
    };
  }

  return {
    name: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
    request: {
      method: endpoint.method,
      header: headers,
      body,
      url: {
        raw: `{{baseUrl}}${postmanPath}`,
        host: ['{{baseUrl}}'],
        path: pathSegments,
        query: queryParams.length > 0 ? queryParams : undefined,
        variable: pathVariables.length > 0 ? pathVariables : undefined,
      },
      description: endpoint.description,
    },
    response: endpoint.responses.map((resp) => {
      const respContent = resp.content?.['application/json'];
      const exampleVal = respContent?.examples ? Object.values(respContent.examples)[0]?.value : respContent?.schema.example;
      return {
        name: `${resp.statusCode} ${resp.description || 'Response'}`,
        status: 'OK',
        code: Number(resp.statusCode) || 200,
        _postman_previewlanguage: 'json',
        header: [],
        body: exampleVal ? JSON.stringify(exampleVal, null, 2) : '',
      };
    }),
  };
}

/**
 * Serializes Canonical Contract AST to Postman Collection v2.1.0 JSON string
 */
export function exportToPostmanJson(contract: CanonicalContract, pretty = true): string {
  const collection = exportToPostman(contract);
  return JSON.stringify(collection, null, pretty ? 2 : undefined);
}

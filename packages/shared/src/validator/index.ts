import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { CanonicalContract, CanonicalSchemaDefinition, CanonicalEndpoint } from '../canonical';

const ajv = new Ajv({
  allErrors: true,
  strict: false,
  validateFormats: true,
});
addFormats(ajv);

export interface ValidationIssue {
  path: string;
  message: string;
  keyword?: string;
  params?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

/**
 * Validates a standalone CanonicalSchemaDefinition against JSON Schema standards.
 */
export function validateCanonicalSchema(schema: CanonicalSchemaDefinition): ValidationResult {
  const issues: ValidationIssue[] = [];

  try {
    const isValid = ajv.validateSchema(schema);
    if (!isValid && ajv.errors) {
      issues.push(
        ...ajv.errors.map((err: ErrorObject) => ({
          path: err.instancePath || '#',
          message: err.message || 'Invalid schema definition',
          keyword: err.keyword,
          params: err.params as Record<string, unknown>,
        })),
      );
    }
  } catch (err: unknown) {
    issues.push({
      path: '#',
      message: err instanceof Error ? err.message : 'Schema compilation error',
    });
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Validates a complete CanonicalContract AST for semantic consistency.
 */
export function validateCanonicalContract(contract: CanonicalContract): ValidationResult {
  const issues: ValidationIssue[] = [];

  // 1. Contract Metadata Validation
  if (!contract.name || contract.name.trim().length === 0) {
    issues.push({ path: 'name', message: 'Contract name cannot be empty' });
  }

  if (!contract.version || !/^\d+\.\d+\.\d+/.test(contract.version)) {
    issues.push({
      path: 'version',
      message: 'Contract version must adhere to semantic versioning (e.g. 1.0.0)',
    });
  }

  // 2. Validate Reusable Schemas
  if (contract.reusableSchemas) {
    for (const [schemaName, schemaDef] of Object.entries(contract.reusableSchemas)) {
      const res = validateCanonicalSchema(schemaDef);
      if (!res.valid) {
        issues.push(
          ...res.issues.map((iss) => ({
            path: `reusableSchemas.${schemaName}${iss.path.replace(/^#/, '')}`,
            message: iss.message,
          })),
        );
      }
    }
  }

  // 3. Validate Endpoints
  const seenEndpoints = new Set<string>();

  for (let i = 0; i < contract.endpoints.length; i++) {
    const endpoint: CanonicalEndpoint = contract.endpoints[i];
    const endpointKey = `${endpoint.method} ${endpoint.path}`;

    // Unique Method + Path check
    if (seenEndpoints.has(endpointKey)) {
      issues.push({
        path: `endpoints[${i}]`,
        message: `Duplicate endpoint definition: ${endpointKey}`,
      });
    }
    seenEndpoints.add(endpointKey);

    // Path must start with forward slash
    if (!endpoint.path.startsWith('/')) {
      issues.push({
        path: `endpoints[${i}].path`,
        message: `Endpoint path '${endpoint.path}' must start with a forward slash '/'`,
      });
    }

    // Path parameters in curly braces e.g. /users/{id} must match defined parameters
    const pathParamsInUrl = (endpoint.path.match(/\{([^}]+)\}/g) || []).map((p) =>
      p.slice(1, -1),
    );
    const declaredPathParams = new Set(
      endpoint.parameters.filter((p) => p.in === 'path').map((p) => p.name),
    );

    for (const paramName of pathParamsInUrl) {
      if (!declaredPathParams.has(paramName)) {
        issues.push({
          path: `endpoints[${i}].parameters`,
          message: `Path parameter '{${paramName}}' in URL is missing from declared parameters`,
        });
      }
    }

    // Validate parameter schemas
    for (const param of endpoint.parameters) {
      if (param.in === 'path' && !param.required) {
        issues.push({
          path: `endpoints[${i}].parameters.${param.name}`,
          message: `Path parameter '${param.name}' must have required=true`,
        });
      }
      if (param.schema) {
        const pRes = validateCanonicalSchema(param.schema);
        if (!pRes.valid) {
          issues.push(
            ...pRes.issues.map((iss) => ({
              path: `endpoints[${i}].parameters.${param.name}${iss.path.replace(/^#/, '')}`,
              message: iss.message,
            })),
          );
        }
      }
    }

    // Validate Request Body schemas
    if (endpoint.requestBody?.content) {
      for (const [mime, content] of Object.entries(endpoint.requestBody.content)) {
        if (content.schema) {
          const bRes = validateCanonicalSchema(content.schema);
          if (!bRes.valid) {
            issues.push(
              ...bRes.issues.map((iss) => ({
                path: `endpoints[${i}].requestBody.content['${mime}']${iss.path.replace(/^#/, '')}`,
                message: iss.message,
              })),
            );
          }
        }
      }
    }

    // Validate Responses
    if (!endpoint.responses || endpoint.responses.length === 0) {
      issues.push({
        path: `endpoints[${i}].responses`,
        message: `Endpoint '${endpointKey}' must declare at least one response status code`,
      });
    } else {
      for (const resp of endpoint.responses) {
        if (!/^\d{3}$/.test(resp.statusCode) && resp.statusCode !== 'default') {
          issues.push({
            path: `endpoints[${i}].responses.${resp.statusCode}`,
            message: `Response status code '${resp.statusCode}' must be a 3-digit HTTP code (e.g. 200, 404) or 'default'`,
          });
        }
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

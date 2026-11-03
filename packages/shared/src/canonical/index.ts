/**
 * Canonical Contract Abstract Syntax Tree (AST) Interfaces
 * Framework-independent Single Source of Truth for ApiForge
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type ParameterIn = 'path' | 'query' | 'header' | 'cookie';

export type CanonicalDataType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';

export interface CanonicalSchemaDefinition {
  type?: CanonicalDataType | CanonicalDataType[];
  title?: string;
  description?: string;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  default?: unknown;
  example?: unknown;

  // Enums
  enum?: (string | number | boolean)[];

  // String Constraints
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?:
    | 'date-time'
    | 'date'
    | 'time'
    | 'email'
    | 'uri'
    | 'uuid'
    | 'ipv4'
    | 'ipv6'
    | string;

  // Numeric Constraints
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;

  // Object Properties
  properties?: Record<string, CanonicalSchemaDefinition>;
  required?: string[];
  additionalProperties?: boolean | CanonicalSchemaDefinition;

  // Array Items
  items?: CanonicalSchemaDefinition;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;

  // Composition (JSON Schema 2020-12 / OpenAPI 3.1)
  oneOf?: CanonicalSchemaDefinition[];
  anyOf?: CanonicalSchemaDefinition[];
  allOf?: CanonicalSchemaDefinition[];
  not?: CanonicalSchemaDefinition;

  // Reusable Reference
  $ref?: string;

  // Circular Reference Flag
  isCircular?: boolean;
}

export interface CanonicalParameter {
  id: string;
  name: string;
  in: ParameterIn;
  required: boolean;
  description?: string;
  deprecated?: boolean;
  schema: CanonicalSchemaDefinition;
  example?: unknown;
}

export interface CanonicalRequestBody {
  description?: string;
  required: boolean;
  content: Record<
    string,
    {
      schema: CanonicalSchemaDefinition;
      examples?: Record<string, { summary?: string; value: unknown }>;
    }
  >;
}

export interface CanonicalResponse {
  id: string;
  statusCode: string;
  description: string;
  headers?: Record<
    string,
    {
      description?: string;
      required?: boolean;
      schema: CanonicalSchemaDefinition;
    }
  >;
  content?: Record<
    string,
    {
      schema: CanonicalSchemaDefinition;
      examples?: Record<string, { summary?: string; value: unknown }>;
    }
  >;
}

export interface CanonicalSecurityRequirement {
  schemeName: string;
  scopes: string[];
}

export interface CanonicalEndpoint {
  id: string;
  folderId?: string | null;
  method: HttpMethod;
  path: string;
  summary: string;
  description?: string;
  tags: string[];
  deprecated?: boolean;
  security: CanonicalSecurityRequirement[];
  parameters: CanonicalParameter[];
  requestBody?: CanonicalRequestBody;
  responses: CanonicalResponse[];
  orderIndex: number;
}

export interface CanonicalServer {
  id: string;
  url: string;
  description?: string;
  variables?: Record<
    string,
    {
      default: string;
      description?: string;
      enum?: string[];
    }
  >;
}

export interface CanonicalTag {
  id: string;
  name: string;
  description?: string;
}

export interface CanonicalFolder {
  id: string;
  name: string;
  description?: string;
  orderIndex: number;
}

export interface CanonicalSecurityScheme {
  id: string;
  name: string;
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  scheme?: 'bearer' | 'basic';
  bearerFormat?: string;
  in?: 'header' | 'query' | 'cookie';
  paramName?: string;
  flows?: Record<string, unknown>;
}

export interface CanonicalContract {
  id: string;
  name: string;
  version: string;
  description?: string;
  servers: CanonicalServer[];
  tags: CanonicalTag[];
  folders: CanonicalFolder[];
  endpoints: CanonicalEndpoint[];
  reusableSchemas: Record<string, CanonicalSchemaDefinition>;
  securitySchemes: Record<string, CanonicalSecurityScheme>;
  externalDocs?: {
    description?: string;
    url: string;
  };
}

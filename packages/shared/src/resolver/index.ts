import { CanonicalSchemaDefinition } from '../canonical';

export interface ResolvedSchema extends CanonicalSchemaDefinition {
  isCircular?: boolean;
}

/**
 * Extracts schema name from reference strings like:
 * - "#/components/schemas/User"
 * - "#/reusableSchemas/User"
 * - "User"
 */
export function extractSchemaRefName(ref: string): string {
  const parts = ref.split('/');
  return parts[parts.length - 1];
}

/**
 * Resolves $ref pointers against a registry of reusable schemas.
 * Includes a Cycle Sentinel that detects circular references and halts recursion safely.
 */
export function resolveSchemaWithCycles(
  schema: CanonicalSchemaDefinition,
  reusableSchemas: Record<string, CanonicalSchemaDefinition>,
  visited: Set<string> = new Set<string>(),
  depth = 0,
  maxDepth = 20,
): ResolvedSchema {
  if (!schema) return schema;

  // Max recursion guard
  if (depth > maxDepth) {
    return { ...schema, isCircular: true };
  }

  // Handle $ref resolution
  if (schema.$ref) {
    const schemaName = extractSchemaRefName(schema.$ref);
    const targetSchema = reusableSchemas[schemaName];

    if (!targetSchema) {
      // Unresolved reference: return as-is
      return schema;
    }

    // Cycle Detection: Check if schemaName is already in current branch of the graph
    if (visited.has(schemaName)) {
      return {
        ...targetSchema,
        $ref: schema.$ref,
        isCircular: true,
      };
    }

    // Mark visited for this branch
    const nextVisited = new Set(visited);
    nextVisited.add(schemaName);

    // Recursively resolve target
    const resolvedTarget = resolveSchemaWithCycles(
      targetSchema,
      reusableSchemas,
      nextVisited,
      depth + 1,
      maxDepth,
    );

    return {
      ...resolvedTarget,
      title: schema.title || resolvedTarget.title || schemaName,
      description: schema.description || resolvedTarget.description,
    };
  }

  // Handle Object Properties
  if (schema.type === 'object' && schema.properties) {
    const resolvedProps: Record<string, ResolvedSchema> = {};
    for (const [propName, propDef] of Object.entries(schema.properties)) {
      resolvedProps[propName] = resolveSchemaWithCycles(
        propDef,
        reusableSchemas,
        new Set(visited),
        depth + 1,
        maxDepth,
      );
    }
    return {
      ...schema,
      properties: resolvedProps,
    };
  }

  // Handle Array Items
  if (schema.type === 'array' && schema.items) {
    return {
      ...schema,
      items: resolveSchemaWithCycles(
        schema.items,
        reusableSchemas,
        new Set(visited),
        depth + 1,
        maxDepth,
      ),
    };
  }

  // Handle Union Types: oneOf, anyOf, allOf
  if (schema.oneOf) {
    return {
      ...schema,
      oneOf: schema.oneOf.map((s) =>
        resolveSchemaWithCycles(s, reusableSchemas, new Set(visited), depth + 1, maxDepth),
      ),
    };
  }
  if (schema.anyOf) {
    return {
      ...schema,
      anyOf: schema.anyOf.map((s) =>
        resolveSchemaWithCycles(s, reusableSchemas, new Set(visited), depth + 1, maxDepth),
      ),
    };
  }
  if (schema.allOf) {
    return {
      ...schema,
      allOf: schema.allOf.map((s) =>
        resolveSchemaWithCycles(s, reusableSchemas, new Set(visited), depth + 1, maxDepth),
      ),
    };
  }

  return schema;
}

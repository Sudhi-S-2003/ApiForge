import { resolveSchemaWithCycles } from '../src';

describe('Schema Reference Resolver & Cycle Sentinel', () => {
  it('should resolve standard $ref pointers', () => {
    const reusable = {
      Address: {
        type: 'object' as const,
        properties: {
          street: { type: 'string' as const },
          city: { type: 'string' as const },
        },
      },
    };

    const userSchema = {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const },
        address: { $ref: '#/components/schemas/Address' },
      },
    };

    const resolved = resolveSchemaWithCycles(userSchema, reusable);
    expect(resolved.properties?.address.type).toBe('object');
    expect(resolved.properties?.address.properties?.street.type).toBe('string');
  });

  it('should detect mutually recursive circular references without stack overflow', () => {
    // User -> Team -> User circular dependency
    const reusable = {
      User: {
        type: 'object' as const,
        properties: {
          name: { type: 'string' as const },
          team: { $ref: '#/components/schemas/Team' },
        },
      },
      Team: {
        type: 'object' as const,
        properties: {
          title: { type: 'string' as const },
          leader: { $ref: '#/components/schemas/User' },
        },
      },
    };

    const startSchema = { $ref: '#/components/schemas/User' };
    const resolved = resolveSchemaWithCycles(startSchema, reusable);

    expect(resolved).toBeDefined();
    expect(resolved.properties?.name.type).toBe('string');
    expect(resolved.properties?.team.properties?.title.type).toBe('string');

    // leader must be marked isCircular: true and not expanded infinitely
    const circularLeader = resolved.properties?.team.properties?.leader;
    expect(circularLeader?.isCircular).toBe(true);
    expect(circularLeader?.$ref).toBe('#/components/schemas/User');
  });
});

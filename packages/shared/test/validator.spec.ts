import {
  validateCanonicalContract,
  validateCanonicalSchema,
  CanonicalContract,
} from '../src';

describe('Canonical Contract Validator', () => {
  const baseContract: CanonicalContract = {
    id: 'contract-1',
    name: 'Petstore API',
    version: '1.0.0',
    description: 'Sample petstore',
    servers: [{ id: 'srv-1', url: 'https://api.petstore.com/v1' }],
    tags: [{ id: 't-1', name: 'Pets' }],
    folders: [{ id: 'f-1', name: 'Pets', orderIndex: 0 }],
    endpoints: [
      {
        id: 'ep-1',
        method: 'GET',
        path: '/pets/{petId}',
        summary: 'Get pet by ID',
        tags: ['Pets'],
        security: [{ schemeName: 'BearerAuth', scopes: [] }],
        orderIndex: 0,
        parameters: [
          {
            id: 'p-1',
            name: 'petId',
            in: 'path',
            required: true,
            schema: { type: 'string', minLength: 1 },
          },
        ],
        responses: [
          {
            id: 'r-1',
            statusCode: '200',
            description: 'Pet details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                  },
                  required: ['id', 'name'],
                },
              },
            },
          },
        ],
      },
    ],
    reusableSchemas: {},
    securitySchemes: {},
  };

  it('should validate a valid canonical contract with 0 issues', () => {
    const result = validateCanonicalContract(baseContract);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('should catch missing forward slash on endpoint path', () => {
    const invalidContract: CanonicalContract = {
      ...baseContract,
      endpoints: [
        {
          ...baseContract.endpoints[0],
          path: 'pets/{petId}', // Missing leading slash
        },
      ],
    };

    const result = validateCanonicalContract(invalidContract);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes("must start with a forward slash"))).toBe(
      true,
    );
  });

  it('should catch undeclared path parameter in URL', () => {
    const invalidContract: CanonicalContract = {
      ...baseContract,
      endpoints: [
        {
          ...baseContract.endpoints[0],
          path: '/pets/{petId}/{missingParam}',
        },
      ],
    };

    const result = validateCanonicalContract(invalidContract);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes("missingParam"))).toBe(true);
  });

  it('should catch duplicate endpoint definitions', () => {
    const invalidContract: CanonicalContract = {
      ...baseContract,
      endpoints: [
        baseContract.endpoints[0],
        { ...baseContract.endpoints[0], id: 'ep-2' }, // Exact same method + path
      ],
    };

    const result = validateCanonicalContract(invalidContract);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes('Duplicate endpoint'))).toBe(true);
  });

  it('should validate JSON Schema constraints', () => {
    const schemaResult = validateCanonicalSchema({
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        age: { type: 'integer', minimum: 0, maximum: 120 },
      },
      required: ['email'],
    });

    expect(schemaResult.valid).toBe(true);
  });
});

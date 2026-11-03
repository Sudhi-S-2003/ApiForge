import { diffCanonicalContracts, CanonicalContract } from '../src';

describe('Canonical Contract Semantic Diffing', () => {
  const contractV1: CanonicalContract = {
    id: 'c-1',
    name: 'Core API',
    version: '1.0.0',
    servers: [],
    tags: [],
    folders: [],
    endpoints: [
      {
        id: 'ep-1',
        method: 'GET',
        path: '/users',
        summary: 'List users',
        tags: [],
        security: [],
        orderIndex: 0,
        parameters: [],
        responses: [{ id: 'r-1', statusCode: '200', description: 'Success' }],
      },
      {
        id: 'ep-2',
        method: 'DELETE',
        path: '/users/{id}',
        summary: 'Delete user',
        tags: [],
        security: [],
        orderIndex: 1,
        parameters: [{ id: 'p-1', name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: [{ id: 'r-2', statusCode: '204', description: 'Deleted' }],
      },
    ],
    reusableSchemas: {},
    securitySchemes: {},
  };

  it('should detect endpoint removal as a BREAKING change', () => {
    // contractV2 removes DELETE /users/{id}
    const contractV2: CanonicalContract = {
      ...contractV1,
      version: '2.0.0',
      endpoints: [contractV1.endpoints[0]],
    };

    const diff = diffCanonicalContracts(contractV1, contractV2);
    expect(diff.hasBreakingChanges).toBe(true);
    expect(diff.changes.some((c) => c.type === 'BREAKING' && c.category === 'ENDPOINT')).toBe(true);
  });

  it('should detect adding optional parameter as NON_BREAKING change', () => {
    const contractV2: CanonicalContract = {
      ...contractV1,
      version: '1.1.0',
      endpoints: [
        {
          ...contractV1.endpoints[0],
          parameters: [
            {
              id: 'p-limit',
              name: 'limit',
              in: 'query',
              required: false,
              schema: { type: 'integer' },
            },
          ],
        },
        contractV1.endpoints[1],
      ],
    };

    const diff = diffCanonicalContracts(contractV1, contractV2);
    expect(diff.hasBreakingChanges).toBe(false);
    expect(diff.changes.some((c) => c.type === 'NON_BREAKING' && c.description.includes('optional parameter'))).toBe(true);
  });

  it('should detect adding required parameter as BREAKING change', () => {
    const contractV2: CanonicalContract = {
      ...contractV1,
      version: '2.0.0',
      endpoints: [
        {
          ...contractV1.endpoints[0],
          parameters: [
            {
              id: 'p-org',
              name: 'orgId',
              in: 'query',
              required: true,
              schema: { type: 'string' },
            },
          ],
        },
        contractV1.endpoints[1],
      ],
    };

    const diff = diffCanonicalContracts(contractV1, contractV2);
    expect(diff.hasBreakingChanges).toBe(true);
    expect(diff.changes.some((c) => c.type === 'BREAKING' && c.description.includes('required parameter'))).toBe(true);
  });
});

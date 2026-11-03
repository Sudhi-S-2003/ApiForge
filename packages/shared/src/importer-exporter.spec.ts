import {
  CanonicalContract,
  exportToOpenApi31,
  exportToOpenApiJson,
  exportToOpenApiYaml,
  exportToPostman,
  exportToPostmanJson,
  importOpenApi,
  importPostman,
} from './index';

describe('Import & Export Engine Round-Trip Tests', () => {
  const sampleContract: CanonicalContract = {
    id: 'contract-test-1',
    name: 'Customer Payment Gateway',
    version: '2.4.0',
    description: 'API for processing online customer payments and refunds',
    servers: [
      { id: 's1', url: 'https://api.payments.corp/v2', description: 'Production' },
      { id: 's2', url: 'https://sandbox.payments.corp/v2', description: 'Sandbox' },
    ],
    tags: [{ id: 't1', name: 'Payments' }],
    folders: [{ id: 'f1', name: 'Payments', orderIndex: 1 }],
    reusableSchemas: {
      PaymentIntent: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          amount: { type: 'number', minimum: 1 },
          currency: { type: 'string', enum: ['USD', 'EUR', 'GBP'] },
        },
        required: ['id', 'amount', 'currency'],
      },
    },
    securitySchemes: {},
    endpoints: [
      {
        id: 'ep-1',
        orderIndex: 1,
        method: 'POST',
        path: '/payments/intents',
        summary: 'Create Payment Intent',
        description: 'Initiates a new credit card authorization',
        tags: ['Payments'],
        security: [],
        parameters: [
          {
            id: 'p1',
            name: 'Idempotency-Key',
            in: 'header',
            required: true,
            description: 'Unique UUID to prevent duplicate charges',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          description: 'Payment parameters',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PaymentIntent' },
              examples: {
                default: {
                  summary: 'Sample Payment',
                  value: { id: 'pi_123', amount: 99.99, currency: 'USD' },
                },
              },
            },
          },
        },
        responses: [
          {
            id: 'r1',
            statusCode: '201',
            description: 'Payment intent created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaymentIntent' },
                examples: {
                  default: {
                    summary: 'Created Payment',
                    value: { id: 'pi_123', amount: 99.99, currency: 'USD' },
                  },
                },
              },
            },
          },
        ],
      },
    ],
  };

  it('should export canonical contract to valid OpenAPI 3.1.0 document', () => {
    const doc = exportToOpenApi31(sampleContract);
    expect(doc.openapi).toBe('3.1.0');
    expect(doc.info.title).toBe('Customer Payment Gateway');
    expect(doc.paths['/payments/intents'].post).toBeDefined();
    expect(doc.paths['/payments/intents'].post.summary).toBe('Create Payment Intent');
    expect(doc.components.schemas.PaymentIntent).toBeDefined();

    const yamlStr = exportToOpenApiYaml(sampleContract);
    expect(yamlStr).toContain('openapi: 3.1.0');
    expect(yamlStr).toContain('Customer Payment Gateway');

    const jsonStr = exportToOpenApiJson(sampleContract);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.openapi).toBe('3.1.0');
  });

  it('should import OpenAPI 3.1 YAML back to CanonicalContract with high fidelity', () => {
    const yamlStr = exportToOpenApiYaml(sampleContract);
    const result = importOpenApi(yamlStr);

    expect(result.format).toBe('openapi_3_1');
    expect(result.contract.name).toBe('Customer Payment Gateway');
    expect(result.contract.version).toBe('2.4.0');
    expect(result.contract.endpoints).toHaveLength(1);
    expect(result.contract.endpoints[0].method).toBe('POST');
    expect(result.contract.endpoints[0].path).toBe('/payments/intents');
    expect(result.contract.reusableSchemas.PaymentIntent).toBeDefined();
  });

  it('should export and import Postman Collection v2.1.0', () => {
    const postmanDoc = exportToPostman(sampleContract);
    expect(postmanDoc.info.name).toBe('Customer Payment Gateway');
    expect(postmanDoc.info.schema).toContain('v2.1.0');
    expect(postmanDoc.item[0].name).toBe('Payments');
    expect(postmanDoc.item[0].item[0].request.method).toBe('POST');

    const postmanJson = exportToPostmanJson(sampleContract);
    const result = importPostman(postmanJson);

    expect(result.format).toBe('postman_2_1');
    expect(result.contract.name).toBe('Customer Payment Gateway');
    expect(result.contract.endpoints).toHaveLength(1);
    expect(result.contract.endpoints[0].method).toBe('POST');
    expect(result.contract.endpoints[0].tags).toContain('Payments');
  });
});

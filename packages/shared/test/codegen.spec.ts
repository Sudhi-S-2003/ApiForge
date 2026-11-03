import {
  generateCurlSnippet,
  generateFetchSnippet,
  generatePythonSnippet,
  generateGoSnippet,
  CanonicalEndpoint,
} from '../src';

describe('Code Snippet Generators', () => {
  const endpoint: CanonicalEndpoint = {
    id: 'ep-test',
    method: 'POST',
    path: '/api/v1/users',
    summary: 'Create User',
    tags: ['Users'],
    security: [{ schemeName: 'Bearer', scopes: [] }],
    orderIndex: 0,
    parameters: [
      {
        id: 'p-1',
        name: 'X-Trace-Id',
        in: 'header',
        required: true,
        schema: { type: 'string' },
        example: 'trace-999',
      },
      {
        id: 'p-2',
        name: 'notify',
        in: 'query',
        required: false,
        schema: { type: 'boolean' },
        example: 'true',
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string' },
            },
            example: { name: 'Alice Smith', email: 'alice@example.com' },
          },
        },
      },
    },
    responses: [{ id: 'r-1', statusCode: '201', description: 'Created' }],
  };

  it('should generate valid cURL snippet with headers, query, and JSON body', () => {
    const curl = generateCurlSnippet(endpoint);
    expect(curl).toContain('curl -X POST "https://api.example.com/api/v1/users?notify=true"');
    expect(curl).toContain('-H "Content-Type: application/json"');
    expect(curl).toContain('-H "X-Trace-Id: trace-999"');
    expect(curl).toContain('-H "Authorization: Bearer <YOUR_TOKEN>"');
    expect(curl).toContain('"name": "Alice Smith"');
  });

  it('should generate valid JavaScript fetch snippet', () => {
    const js = generateFetchSnippet(endpoint);
    expect(js).toContain('await fetch("https://api.example.com/api/v1/users?notify=true"');
    expect(js).toContain('method: "POST"');
    expect(js).toContain('"X-Trace-Id": "trace-999"');
    expect(js).toContain('body: JSON.stringify(');
  });

  it('should generate valid Python requests snippet', () => {
    const py = generatePythonSnippet(endpoint);
    expect(py).toContain('import requests');
    expect(py).toContain('url = "https://api.example.com/api/v1/users"');
    expect(py).toContain('response = requests.post(url, json=payload, headers=headers)');
  });

  it('should generate valid Go snippet', () => {
    const go = generateGoSnippet(endpoint);
    expect(go).toContain('package main');
    expect(go).toContain('http.NewRequest("POST", url, body)');
    expect(go).toContain('req.Header.Add("Accept", "application/json")');
  });
});

import { CanonicalEndpoint } from '../canonical';

export interface CodeGenOptions {
  baseUrl?: string;
  authHeader?: string;
}

/**
 * Generates an executable cURL command from an endpoint AST.
 */
export function generateCurlSnippet(
  endpoint: CanonicalEndpoint,
  options: CodeGenOptions = {},
): string {
  const baseUrl = (options.baseUrl || 'https://api.example.com').replace(/\/$/, '');
  let url = `${baseUrl}${endpoint?.path || ''}`;

  const parameters = endpoint?.parameters || [];

  // Replace path parameters with sample values
  for (const param of parameters.filter((p) => String(p?.in || '').toLowerCase() === 'path')) {
    url = url.replace(`{${param.name}}`, String(param.example || '123'));
  }

  // Append sample query parameters
  const queryParams = parameters.filter((p) => String(p?.in || '').toLowerCase() === 'query');
  if (queryParams.length > 0) {
    const qs = queryParams
      .map((p) => `${p.name}=${encodeURIComponent(String(p.example || 'sample'))}`)
      .join('&');
    url += `?${qs}`;
  }

  const method = (endpoint?.method || 'GET').toUpperCase();
  const lines: string[] = [`curl -X ${method} "${url}"`];

  // Headers
  lines.push('  -H "Accept: application/json"');
  if (endpoint?.requestBody) {
    lines.push('  -H "Content-Type: application/json"');
  }

  for (const param of parameters.filter((p) => String(p?.in || '').toLowerCase() === 'header')) {
    lines.push(`  -H "${param.name}: ${param.example || 'value'}"`);
  }

  if (options.authHeader) {
    lines.push(`  -H "Authorization: ${options.authHeader}"`);
  } else if (endpoint?.security && endpoint.security.length > 0) {
    lines.push('  -H "Authorization: Bearer <YOUR_TOKEN>"');
  }

  // Request body
  if (endpoint?.requestBody?.content?.['application/json']) {
    const example =
      endpoint.requestBody.content['application/json'].examples?.['default']?.value ||
      endpoint.requestBody.content['application/json'].schema?.example ||
      {};
    const bodyStr = JSON.stringify(example, null, 2);
    lines.push(`  -d '${bodyStr}'`);
  }

  return lines.join(' \\\n');
}

/**
 * Generates an executable JavaScript / TypeScript Fetch snippet.
 */
export function generateFetchSnippet(
  endpoint: CanonicalEndpoint,
  options: CodeGenOptions = {},
): string {
  const baseUrl = (options.baseUrl || 'https://api.example.com').replace(/\/$/, '');
  let url = `${baseUrl}${endpoint?.path || ''}`;

  const parameters = endpoint?.parameters || [];

  for (const param of parameters.filter((p) => String(p?.in || '').toLowerCase() === 'path')) {
    url = url.replace(`{${param.name}}`, String(param.example || '123'));
  }

  const queryParams = parameters.filter((p) => String(p?.in || '').toLowerCase() === 'query');
  if (queryParams.length > 0) {
    const qs = queryParams
      .map((p) => `${p.name}=${encodeURIComponent(String(p.example || 'sample'))}`)
      .join('&');
    url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (endpoint?.requestBody) {
    headers['Content-Type'] = 'application/json';
  }

  for (const param of parameters.filter((p) => String(p?.in || '').toLowerCase() === 'header')) {
    headers[param.name] = String(param.example || 'value');
  }

  if (options.authHeader) {
    headers['Authorization'] = options.authHeader;
  } else if (endpoint?.security && endpoint.security.length > 0) {
    headers['Authorization'] = 'Bearer <YOUR_TOKEN>';
  }

  let bodyCode = '';
  if (endpoint?.requestBody?.content?.['application/json']) {
    const example =
      endpoint.requestBody.content['application/json'].examples?.['default']?.value ||
      endpoint.requestBody.content['application/json'].schema?.example ||
      {};
    bodyCode = `\n  body: JSON.stringify(${JSON.stringify(example, null, 2)}),`;
  }

  const method = (endpoint?.method || 'GET').toUpperCase();

  return `const response = await fetch("${url}", {
  method: "${method}",
  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, '\n  ')},${bodyCode}
});

const data = await response.json();
console.log(data);`;
}

/**
 * Generates an executable Python Requests snippet.
 */
export function generatePythonSnippet(
  endpoint: CanonicalEndpoint,
  options: CodeGenOptions = {},
): string {
  const baseUrl = (options.baseUrl || 'https://api.example.com').replace(/\/$/, '');
  let url = `${baseUrl}${endpoint?.path || ''}`;

  const parameters = endpoint?.parameters || [];

  for (const param of parameters.filter((p) => String(p?.in || '').toLowerCase() === 'path')) {
    url = url.replace(`{${param.name}}`, String(param.example || '123'));
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (endpoint?.requestBody) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.authHeader) {
    headers['Authorization'] = options.authHeader;
  } else if (endpoint?.security && endpoint.security.length > 0) {
    headers['Authorization'] = 'Bearer <YOUR_TOKEN>';
  }

  let payloadCode = '';
  if (endpoint?.requestBody?.content?.['application/json']) {
    const example =
      endpoint.requestBody.content['application/json'].examples?.['default']?.value ||
      endpoint.requestBody.content['application/json'].schema?.example ||
      {};
    payloadCode = `payload = ${JSON.stringify(example, null, 4)}\n`;
  }

  const method = (endpoint?.method || 'GET').toLowerCase();
  const requestCall = payloadCode
    ? `response = requests.${method}(url, json=payload, headers=headers)`
    : `response = requests.${method}(url, headers=headers)`;

  return `import requests

url = "${url}"
headers = ${JSON.stringify(headers, null, 4)}
${payloadCode}${requestCall}

print(response.status_code)
print(response.json())`;
}

/**
 * Generates an executable Go net/http snippet.
 */
export function generateGoSnippet(
  endpoint: CanonicalEndpoint,
  options: CodeGenOptions = {},
): string {
  const baseUrl = (options.baseUrl || 'https://api.example.com').replace(/\/$/, '');
  let url = `${baseUrl}${endpoint?.path || ''}`;

  const parameters = endpoint?.parameters || [];

  for (const param of parameters.filter((p) => String(p?.in || '').toLowerCase() === 'path')) {
    url = url.replace(`{${param.name}}`, String(param.example || '123'));
  }

  let bodyInit = 'nil';
  let bodyReader = '';
  if (endpoint?.requestBody?.content?.['application/json']) {
    const example =
      endpoint.requestBody.content['application/json'].examples?.['default']?.value ||
      endpoint.requestBody.content['application/json'].schema?.example ||
      {};
    bodyReader = `\tbody := strings.NewReader(\`${JSON.stringify(example)}\`)\n`;
    bodyInit = 'body';
  }

  const method = (endpoint?.method || 'GET').toUpperCase();

  return `package main

import (
\t"fmt"
\t"io"
\t"net/http"
\t"strings"
)

func main() {
\turl := "${url}"
${bodyReader}\treq, err := http.NewRequest("${method}", url, ${bodyInit})
\tif err != nil {
\t\tpanic(err)
\t}

\treq.Header.Add("Accept", "application/json")
\treq.Header.Add("Authorization", "Bearer <YOUR_TOKEN>")

\tres, err := http.DefaultClient.Do(req)
\tif err != nil {
\t\tpanic(err)
\t}
\tdefer res.Body.Close()

\tbodyBytes, _ := io.ReadAll(res.Body)
\tfmt.Println(res.Status)
\tfmt.Println(string(bodyBytes))
}`;
}

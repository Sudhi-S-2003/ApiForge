import { CanonicalContract, CanonicalEndpoint } from '../canonical';

export type ChangeType = 'BREAKING' | 'NON_BREAKING';
export type ChangeCategory = 'ENDPOINT' | 'PARAMETER' | 'REQUEST_BODY' | 'RESPONSE' | 'SECURITY';

export interface ContractChange {
  type: ChangeType;
  category: ChangeCategory;
  path: string;
  description: string;
}

export interface ContractDiffResult {
  hasBreakingChanges: boolean;
  totalChanges: number;
  changes: ContractChange[];
}

/**
 * Compares two Canonical Contracts and detects breaking vs non-breaking changes.
 */
export function diffCanonicalContracts(
  oldContract: CanonicalContract,
  newContract: CanonicalContract,
): ContractDiffResult {
  const changes: ContractChange[] = [];

  const oldEndpointsMap = new Map<string, CanonicalEndpoint>();
  oldContract.endpoints.forEach((ep) => {
    oldEndpointsMap.set(`${ep.method} ${ep.path}`, ep);
  });

  const newEndpointsMap = new Map<string, CanonicalEndpoint>();
  newContract.endpoints.forEach((ep) => {
    newEndpointsMap.set(`${ep.method} ${ep.path}`, ep);
  });

  // 1. Check for Deleted Endpoints (BREAKING)
  for (const [key, oldEp] of oldEndpointsMap.entries()) {
    if (!newEndpointsMap.has(key)) {
      changes.push({
        type: 'BREAKING',
        category: 'ENDPOINT',
        path: `${oldEp.method} ${oldEp.path}`,
        description: `Endpoint ${key} was removed.`,
      });
    }
  }

  // 2. Check for Added Endpoints (NON-BREAKING)
  for (const [key, newEp] of newEndpointsMap.entries()) {
    if (!oldEndpointsMap.has(key)) {
      changes.push({
        type: 'NON_BREAKING',
        category: 'ENDPOINT',
        path: `${newEp.method} ${newEp.path}`,
        description: `Endpoint ${key} was added.`,
      });
    }
  }

  // 3. Compare Existing Endpoints
  for (const [key, oldEp] of oldEndpointsMap.entries()) {
    const newEp = newEndpointsMap.get(key);
    if (!newEp) continue;

    // Check Deprecation
    if (!oldEp.deprecated && newEp.deprecated) {
      changes.push({
        type: 'NON_BREAKING',
        category: 'ENDPOINT',
        path: key,
        description: `Endpoint ${key} has been marked as deprecated.`,
      });
    }

    // Compare Parameters
    const oldParamMap = new Map(oldEp.parameters.map((p) => [`${p.in}:${p.name}`, p]));
    const newParamMap = new Map(newEp.parameters.map((p) => [`${p.in}:${p.name}`, p]));

    // Removed parameters
    for (const [paramKey, oldP] of oldParamMap.entries()) {
      if (!newParamMap.has(paramKey)) {
        changes.push({
          type: 'NON_BREAKING',
          category: 'PARAMETER',
          path: `${key} -> ${oldP.in}:${oldP.name}`,
          description: `Parameter '${oldP.name}' (${oldP.in}) was removed.`,
        });
      }
    }

    // Added parameters
    for (const [paramKey, newP] of newParamMap.entries()) {
      if (!oldParamMap.has(paramKey)) {
        if (newP.required) {
          changes.push({
            type: 'BREAKING',
            category: 'PARAMETER',
            path: `${key} -> ${newP.in}:${newP.name}`,
            description: `New required parameter '${newP.name}' (${newP.in}) was added.`,
          });
        } else {
          changes.push({
            type: 'NON_BREAKING',
            category: 'PARAMETER',
            path: `${key} -> ${newP.in}:${newP.name}`,
            description: `New optional parameter '${newP.name}' (${newP.in}) was added.`,
          });
        }
      }
    }

    // Compare Responses
    const oldStatusSet = new Set(oldEp.responses.map((r) => r.statusCode));
    const newStatusSet = new Set(newEp.responses.map((r) => r.statusCode));

    for (const code of oldStatusSet) {
      if (!newStatusSet.has(code)) {
        changes.push({
          type: 'BREAKING',
          category: 'RESPONSE',
          path: `${key} -> ${code}`,
          description: `Response status code ${code} was removed from ${key}.`,
        });
      }
    }

    for (const code of newStatusSet) {
      if (!oldStatusSet.has(code)) {
        changes.push({
          type: 'NON_BREAKING',
          category: 'RESPONSE',
          path: `${key} -> ${code}`,
          description: `New response status code ${code} was added to ${key}.`,
        });
      }
    }
  }

  const hasBreakingChanges = changes.some((c) => c.type === 'BREAKING');

  return {
    hasBreakingChanges,
    totalChanges: changes.length,
    changes,
  };
}

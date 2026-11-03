import { create } from 'zustand';
import {
  CanonicalContract,
  CanonicalEndpoint,
  CanonicalFolder,
  CanonicalSchemaDefinition,
  validateCanonicalContract,
  validateCanonicalSchema,
  ValidationIssue,
} from '@apiforge/shared';

interface EditorState {
  contract: CanonicalContract | null;
  activeEndpointId: string | null;
  activeTab: 'general' | 'params' | 'headers' | 'body' | 'responses' | 'code';
  activeResponseCode: string;
  isDirty: boolean;
  isSaving: boolean;
  monacoContent: string;
  validationIssues: ValidationIssue[];

  // Actions
  setContract: (contract: CanonicalContract) => void;
  selectEndpoint: (endpointId: string | null) => void;
  setActiveTab: (tab: EditorState['activeTab']) => void;
  setActiveResponseCode: (code: string) => void;
  updateActiveEndpoint: (updates: Partial<CanonicalEndpoint>) => void;
  updateMonacoContent: (jsonStr: string) => void;
  addEndpoint: (endpoint: CanonicalEndpoint) => void;
  deleteEndpoint: (endpointId: string) => void;
  addFolder: (folder: CanonicalFolder) => void;
  updateFolder: (folderId: string, name: string) => void;
  deleteFolder: (folderId: string) => void;
  moveEndpointToFolder: (endpointId: string, folderId: string | null) => void;
  setIsSaving: (saving: boolean) => void;
  markSaved: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  contract: null,
  activeEndpointId: null,
  activeTab: 'general',
  activeResponseCode: '200',
  isDirty: false,
  isSaving: false,
  monacoContent: '{}',
  validationIssues: [],

  setContract: (contract) => {
    const issues = validateCanonicalContract(contract).issues;
    const firstEndpoint = contract.endpoints[0] || null;
    const initialEndpointId = firstEndpoint ? firstEndpoint.id : null;
    const initialJson = firstEndpoint ? JSON.stringify(firstEndpoint, null, 2) : '{}';

    set({
      contract,
      activeEndpointId: initialEndpointId,
      monacoContent: initialJson,
      validationIssues: issues,
      isDirty: false,
    });
  },

  selectEndpoint: (endpointId) => {
    const { contract } = get();
    if (!contract) return;

    const endpoint = contract.endpoints.find((ep) => ep.id === endpointId) || null;
    set({
      activeEndpointId: endpointId,
      monacoContent: endpoint ? JSON.stringify(endpoint, null, 2) : '{}',
      activeResponseCode: endpoint?.responses[0]?.statusCode || '200',
    });
  },

  setActiveTab: (activeTab) => set({ activeTab }),

  setActiveResponseCode: (activeResponseCode) => set({ activeResponseCode }),

  updateActiveEndpoint: (updates) => {
    const { contract, activeEndpointId } = get();
    if (!contract || !activeEndpointId) return;

    const updatedEndpoints = contract.endpoints.map((ep) => {
      if (ep.id === activeEndpointId) {
        return { ...ep, ...updates };
      }
      return ep;
    });

    const updatedContract = {
      ...contract,
      endpoints: updatedEndpoints,
    };

    const activeEp = updatedEndpoints.find((ep) => ep.id === activeEndpointId);
    const issues = validateCanonicalContract(updatedContract).issues;

    set({
      contract: updatedContract,
      monacoContent: activeEp ? JSON.stringify(activeEp, null, 2) : '{}',
      isDirty: true,
      validationIssues: issues,
    });
  },

  updateMonacoContent: (jsonStr) => {
    set({ monacoContent: jsonStr });
    const { contract, activeEndpointId } = get();
    if (!contract || !activeEndpointId) return;

    try {
      const parsedEndpoint = JSON.parse(jsonStr) as CanonicalEndpoint;
      if (parsedEndpoint && parsedEndpoint.method && parsedEndpoint.path) {
        const updatedEndpoints = contract.endpoints.map((ep) =>
          ep.id === activeEndpointId ? { ...parsedEndpoint, id: activeEndpointId } : ep,
        );
        const updatedContract = { ...contract, endpoints: updatedEndpoints };
        const issues = validateCanonicalContract(updatedContract).issues;

        set({
          contract: updatedContract,
          isDirty: true,
          validationIssues: issues,
        });
      }
    } catch {
      // JSON is being typed and temporarily malformed - wait for valid syntax
    }
  },

  addEndpoint: (endpoint) => {
    const { contract } = get();
    if (!contract) return;

    const updatedEndpoints = [...contract.endpoints, endpoint];
    const updatedContract = { ...contract, endpoints: updatedEndpoints };
    const issues = validateCanonicalContract(updatedContract).issues;

    set({
      contract: updatedContract,
      activeEndpointId: endpoint.id,
      monacoContent: JSON.stringify(endpoint, null, 2),
      isDirty: true,
      validationIssues: issues,
    });
  },

  deleteEndpoint: (endpointId) => {
    const { contract, activeEndpointId } = get();
    if (!contract) return;

    const updatedEndpoints = contract.endpoints.filter((ep) => ep.id !== endpointId);
    const updatedContract = { ...contract, endpoints: updatedEndpoints };
    const nextActiveId =
      activeEndpointId === endpointId
        ? updatedEndpoints[0]?.id || null
        : activeEndpointId;
    const nextEp = updatedEndpoints.find((ep) => ep.id === nextActiveId);

    set({
      contract: updatedContract,
      activeEndpointId: nextActiveId,
      monacoContent: nextEp ? JSON.stringify(nextEp, null, 2) : '{}',
      isDirty: true,
    });
  },

  addFolder: (folder) => {
    const { contract } = get();
    if (!contract) return;
    set({
      contract: { ...contract, folders: [...contract.folders, folder] },
      isDirty: true,
    });
  },

  updateFolder: (folderId, name) => {
    const { contract } = get();
    if (!contract) return;
    set({
      contract: {
        ...contract,
        folders: contract.folders.map((f) => (f.id === folderId ? { ...f, name } : f)),
      },
      isDirty: true,
    });
  },

  deleteFolder: (folderId) => {
    const { contract } = get();
    if (!contract) return;
    set({
      contract: {
        ...contract,
        folders: contract.folders.filter((f) => f.id !== folderId),
        endpoints: contract.endpoints.map((ep) =>
          ep.folderId === folderId ? { ...ep, folderId: null } : ep,
        ),
      },
      isDirty: true,
    });
  },

  moveEndpointToFolder: (endpointId, folderId) => {
    const { contract, activeEndpointId } = get();
    if (!contract) return;

    const updatedEndpoints = contract.endpoints.map((ep) =>
      ep.id === endpointId ? { ...ep, folderId: folderId || null } : ep,
    );

    const updatedContract = { ...contract, endpoints: updatedEndpoints };
    const activeEp = updatedEndpoints.find((ep) => ep.id === activeEndpointId);

    set({
      contract: updatedContract,
      monacoContent: activeEp ? JSON.stringify(activeEp, null, 2) : '{}',
      isDirty: true,
    });
  },

  setIsSaving: (isSaving) => set({ isSaving }),

  markSaved: () => set({ isDirty: false }),
}));

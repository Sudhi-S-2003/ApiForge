import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/api-client';
import { DocsViewer } from '@/components/docs/DocsViewer';
import { CanonicalContract } from '@apiforge/shared';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return {
    title: `API Documentation (${params.id}) — ApiForge`,
    description: 'Interactive API contract reference and developer documentation',
  };
}

export default async function DynamicDocPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  // 1. Try directly as Version ID
  const versionRes = await serverFetch<CanonicalContract>(`/api/v1/versions/${id}/contract`);
  if (versionRes.success && versionRes.data) {
    return <DocsViewer contract={versionRes.data} versionId={id} />;
  }

  // 2. Try as Public Doc Slug
  const docRes = await serverFetch<{
    doc: { id: string; title: string; slug: string };
    contract: CanonicalContract;
  }>(`/api/v1/docs/${id}`);
  if (docRes.success && docRes.data?.contract) {
    return (
      <DocsViewer
        contract={docRes.data.contract}
        versionId={docRes.data.contract.id || id}
      />
    );
  }

  // 3. Try as Project ID to get its latest version
  const projectRes = await serverFetch<any>(`/api/v1/projects/${id}`);
  if (projectRes.success && projectRes.data) {
    const versions = projectRes.data.versions || [];
    const latestVersion = versions[0];
    if (latestVersion?.id) {
      const pContractRes = await serverFetch<CanonicalContract>(
        `/api/v1/versions/${latestVersion.id}/contract`,
      );
      if (pContractRes.success && pContractRes.data) {
        return <DocsViewer contract={pContractRes.data} versionId={latestVersion.id} />;
      }
    }
  }

  // Fallback 404
  notFound();
}

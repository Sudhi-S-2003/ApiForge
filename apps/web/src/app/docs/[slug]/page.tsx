import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/api-client';
import { DocsViewer } from '@/components/docs/DocsViewer';
import { CanonicalContract } from '@apiforge/shared';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  return {
    title: `API Documentation (${params.slug}) — ApiForge`,
    description: 'Interactive API documentation powered by ApiForge',
  };
}

export default async function PublicDocsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { password?: string };
}) {
  const { slug } = params;
  const queryParam = searchParams.password ? `?password=${encodeURIComponent(searchParams.password)}` : '';

  // 1. Try fetching published doc by slug
  const docRes = await serverFetch<{
    doc: {
      id: string;
      slug: string;
      title: string;
      introMarkdown?: string;
      gettingStartedMarkdown?: string;
    };
    contract: CanonicalContract;
  }>(`/api/v1/docs/${slug}${queryParam}`);

  if (docRes.success && docRes.data?.contract) {
    const { contract } = docRes.data;
    return <DocsViewer contract={contract} versionId={contract.id} />;
  }

  // 2. Try as a Version ID directly
  const versionRes = await serverFetch<CanonicalContract>(`/api/v1/versions/${slug}/contract`);
  if (versionRes.success && versionRes.data) {
    return <DocsViewer contract={versionRes.data} versionId={slug} />;
  }

  // 3. Try as a Project ID
  const projectRes = await serverFetch<any>(`/api/v1/projects/${slug}`);
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

  notFound();
}

import { redirect } from 'next/navigation';
import { getCurrentUserAction } from '@/actions/auth.actions';
import { serverFetch } from '@/lib/api-client';
import { PlaygroundView } from '@/components/playground/PlaygroundView';

export default async function PlaygroundPage({
  searchParams,
}: {
  searchParams: { endpointId?: string };
}) {
  const user = await getCurrentUserAction();
  if (!user) redirect('/login');

  let initialEndpoint = null;
  if (searchParams.endpointId) {
    const epRes = await serverFetch<any>(`/api/v1/endpoints/${searchParams.endpointId}`);
    if (epRes.success && epRes.data) {
      initialEndpoint = epRes.data;
    }
  }

  const historyRes = await serverFetch<any[]>('/api/v1/playground/history');
  const initialHistory = historyRes.data || [];

  return (
    <PlaygroundView
      initialEndpoint={initialEndpoint}
      initialHistory={initialHistory}
    />
  );
}

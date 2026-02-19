import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import JobsMarketClient from './JobsMarketClient';

export const dynamic = 'force-dynamic';

export default async function JobsMarketPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const role = (session.user as any)?.role as string | undefined;

  if (!role || !['admin', 'superadmin', 'driver'].includes(role)) {
    return (
      <div style={{ padding: '40px' }}>
        <h1>Unauthorized</h1>
        <p>You do not have access to this page.</p>
      </div>
    );
  }

  return <JobsMarketClient role={role} />;
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CustomerPortalLayout from '@/components/customer/CustomerPortalLayout';
import CustomerDashboard from '@/components/customer/CustomerDashboard';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (session.user.role !== 'customer') {
    redirect('/');
  }

  return (
    <CustomerPortalLayout>
      <CustomerDashboard userId={session.user.id} />
    </CustomerPortalLayout>
  );
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import OrdersClient from './table';

export default async function AdminOrders() {
  const s = await getServerSession(authOptions);
  if (!s?.user || (s.user as any).role !== 'admin') redirect('/auth/login');
  return <OrdersClient />;
}

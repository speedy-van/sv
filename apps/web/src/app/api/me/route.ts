import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force dynamic rendering (uses headers/cookies/getServerSession)
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  return Response.json({ user: session?.user ?? null });
}

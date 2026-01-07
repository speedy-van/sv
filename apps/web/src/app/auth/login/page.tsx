import LoginPageClient from './LoginPageClient';

interface LoginPageProps {
  searchParams: Promise<{
    role?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return <LoginPageClient role={params?.role} />;
}

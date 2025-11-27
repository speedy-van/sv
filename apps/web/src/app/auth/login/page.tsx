import LoginPageClient from './LoginPageClient';

interface LoginPageProps {
  searchParams: {
    role?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return <LoginPageClient role={searchParams?.role} />;
}

// Declaration merging for next-auth

declare module 'next-auth' {
  interface DefaultSession {
    user?: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role: string;
    };
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
    expires: string;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
  }
  interface Account { [key: string]: any }
  interface Profile { [key: string]: any }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    id?: string;
    email?: string;
    name?: string;
    accessToken?: string;
    provider?: string;
  }
}
// Shims for next-auth exports across environments

declare module 'next-auth' {
  // Provide type-only signatures to satisfy TS where named exports are used
  // Runtime implementation comes from next-auth package
  export function getServerSession(...args: any[]): Promise<import('next-auth').Session | null>;
  export interface NextAuthOptions extends Record<string, any> {}
}

declare module 'next-auth/jwt' {
  export function getToken(...args: any[]): Promise<any>;
}



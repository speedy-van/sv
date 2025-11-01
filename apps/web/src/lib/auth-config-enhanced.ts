import type { NextAuthOptions, Session, User } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import type { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

// Enhanced JWT handling with error recovery
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials: { email?: string; password?: string } | undefined): Promise<{ id: string; email: string | null; name: string | null; role: string } | null> {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, account }: { token: JWT; user?: User | null; account?: any | null }) {
      // Include user data in token
      if (user) {
        token.id = user.id
        token.role = user.role || 'customer'
        token.email = user.email
        token.name = user.name
      }

      // Handle account linking
      if (account) {
        token.accessToken = account.access_token
        token.provider = account.provider
      }

      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      // Send properties to the client
      if (token) {
        if (!session.user) session.user = { id: '', email: '', name: '', role: '' } as any
        ;(session.user as any).id = (token as any).id as string
        ;(session.user as any).role = (token as any).role as string
        ;(session.user as any).email = (token as any).email as string
        ;(session.user as any).name = (token as any).name as string
      }

      return session
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Handle post-login redirects
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user'
  },
  events: {
    async signIn({ user, account }: { user: User; account?: any | null; profile?: any | null }) {
      console.log('User signed in:', { 
        userId: user.id, 
        provider: account?.provider 
      })
    },
    async signOut({ session, token }: { session: Session | null; token: JWT | null }) {
      console.log('User signed out:', { 
        userId: token?.id || session?.user?.id 
      })
    },
    async createUser({ user }: { user: User }) {
      console.log('New user created:', { 
        userId: user.id, 
        email: user.email 
      })
    },
    async updateUser({ user }: { user: User }) {
      console.log('User updated:', { 
        userId: user.id 
      })
    },
    async linkAccount({ user, account }: { user: User; account: any }) {
      console.log('Account linked:', { 
        userId: user.id, 
        provider: account.provider 
      })
    }
  },
  // Enhanced error handling
  logger: {
    error(code: string, metadata?: Record<string, unknown>) {
      // Log errors but don't expose sensitive information
      console.error('NextAuth Error:', code)
      
      // Handle specific JWT errors
      if (code.includes('JWT') || code.includes('JWE')) {
        console.error('JWT/JWE Error - Token may be corrupted or using wrong secret')
      }
    },
    warn(code: string) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code: string, metadata?: Record<string, unknown>) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('NextAuth Debug:', code)
      }
    }
  },
  debug: process.env.NODE_ENV === 'development',
  // Security settings
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 // 24 hours
      }
    }
  }
}

export default authOptions
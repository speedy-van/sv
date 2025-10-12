import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { JWT } from 'next-auth/jwt'
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
      async authorize(credentials: any, req: any): Promise<any> {
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
    async jwt({ token, user, account }) {
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
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }

      return session
    },
    async redirect({ url, baseUrl }) {
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
    async signIn({ user, account, profile }) {
      console.log('User signed in:', { 
        userId: user.id, 
        provider: account?.provider 
      })
    },
    async signOut({ session, token }) {
      console.log('User signed out:', { 
        userId: token?.id || session?.user?.id 
      })
    },
    async createUser({ user }) {
      console.log('New user created:', { 
        userId: user.id, 
        email: user.email 
      })
    },
    async updateUser({ user }) {
      console.log('User updated:', { 
        userId: user.id 
      })
    },
    async linkAccount({ user, account }) {
      console.log('Account linked:', { 
        userId: user.id, 
        provider: account.provider 
      })
    }
  },
  // Enhanced error handling
  logger: {
    error(code, metadata) {
      // Log errors but don't expose sensitive information
      console.error('NextAuth Error:', code)
      
      // Handle specific JWT errors
      if (code.includes('JWT') || code.includes('JWE')) {
        console.error('JWT/JWE Error - Token may be corrupted or using wrong secret')
      }
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
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
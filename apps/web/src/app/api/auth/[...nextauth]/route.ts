import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// NextAuth handler - proper initialization without type casting
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

// Ensure runtime is set to nodejs
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

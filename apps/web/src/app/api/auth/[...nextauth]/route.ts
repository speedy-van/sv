import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth-config-enhanced'

// NextAuth handler
const handler = (NextAuth as any)(authOptions)

export { handler as GET, handler as POST }

/**
 * Environment configuration for Speedy Van
 */

import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  
  // Pusher
  PUSHER_APP_ID: z.string(),
  PUSHER_KEY: z.string(),
  PUSHER_SECRET: z.string(),
  PUSHER_CLUSTER: z.string(),
  NEXT_PUBLIC_PUSHER_KEY: z.string(),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string(),
  
  // Email
  SENDGRID_API_KEY: z.string().optional(),
  ZEPTO_API_KEY: z.string().optional(),
  
  // SMS - Voodoo SMS (replaced UK SMS WORK)
  VOODOO_SMS_API_KEY: z.string().optional(),
  
  // Maps
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),
  
  // Weather
  NEXT_PUBLIC_WEATHER_API_KEY: z.string().optional(),
  
  // OpenAI - Removed (AI functionality deleted)
  
  // JWT
  JWT_SECRET: z.string(),
  
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  
  // Custom
  CUSTOM_KEY: z.string().optional(),
  LOG_LEVEL: z.string().default('info'),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_COMPANY_NAME: z.string().optional(),
  NEXT_PUBLIC_COMPANY_LEGAL_NAME: z.string().optional(),
  NEXT_PUBLIC_COMPANY_NUMBER: z.string().optional(),
  NEXT_PUBLIC_COMPANY_REGISTERED_IN: z.string().optional(),
  NEXT_PUBLIC_COMPANY_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_COMPANY_PHONE: z.string().optional(),
  NEXT_PUBLIC_COMPANY_EMAIL: z.string().optional(),
});

// Only parse on server-side
let parsedEnv: z.infer<typeof envSchema>;

if (typeof window === 'undefined') {
  // Server-side: parse and validate
  parsedEnv = envSchema.parse(process.env);
} else {
  // Client-side: throw error (this file shouldn't be imported on client)
  throw new Error('env.ts should only be imported in server-side code. Use env.client.ts for client-side.');
}

export const env = parsedEnv;

export default env;
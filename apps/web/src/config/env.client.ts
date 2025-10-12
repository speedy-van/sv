/**
 * Client-side environment configuration
 * Only variables prefixed with NEXT_PUBLIC_ are available on the client
 */

import { z } from 'zod';

const clientEnvSchema = z.object({
  // Public environment variables available on the client
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_PUSHER_KEY: z.string().optional(),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string().optional(),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),
  NEXT_PUBLIC_WEATHER_API_KEY: z.string().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_COMPANY_NAME: z.string().optional(),
  NEXT_PUBLIC_COMPANY_LEGAL_NAME: z.string().optional(),
  NEXT_PUBLIC_COMPANY_NUMBER: z.string().optional(),
  NEXT_PUBLIC_COMPANY_REGISTERED_IN: z.string().optional(),
  NEXT_PUBLIC_COMPANY_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_COMPANY_PHONE: z.string().optional(),
  NEXT_PUBLIC_COMPANY_EMAIL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Use safeParse to avoid throwing errors on the client
const result = clientEnvSchema.safeParse(process.env);

export const clientEnv = result.success 
  ? result.data 
  : {
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    };

export default clientEnv;

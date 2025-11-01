import { healthCheck } from '@/lib/telemetry/middleware';

export const GET = healthCheck;
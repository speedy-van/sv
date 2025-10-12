// Import types conditionally to avoid build issues
let PrismaClient: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const prismaModule = require('@prisma/client');
  PrismaClient = prismaModule.PrismaClient;
} catch (error) {
  // Prisma client not available during build
  PrismaClient = null;
}

// Global database client instance
declare global {
  // eslint-disable-next-line no-var
  var __prisma: any | undefined;
}

// Create a singleton Prisma client with connection pooling and retry logic
export const prisma: any = globalThis.__prisma || (PrismaClient ? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings for Neon PostgreSQL
  // These prevent "connection closed" errors
}) : null);

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalThis.__prisma = prisma;
}

// Database connection utilities with retry logic
export async function connectDatabase(retries = 3): Promise<void> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Database connected successfully (attempt ${attempt}/${retries})`);
      }
      return;
    } catch (error) {
      lastError = error;
      console.error(`❌ Database connection failed (attempt ${attempt}/${retries}):`, error);
      
      if (attempt < retries) {
        // Wait before retry with exponential backoff
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`⏳ Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Database disconnected successfully');
    }
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
    throw error;
  }
}

// Health check utility with auto-reconnect
export async function checkDatabaseHealth(autoReconnect = true): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    
    // Try to reconnect if connection was lost
    if (autoReconnect) {
      try {
        console.log('🔄 Attempting to reconnect to database...');
        await prisma.$disconnect();
        await connectDatabase();
        return true;
      } catch (reconnectError) {
        console.error('Failed to reconnect:', reconnectError);
        return false;
      }
    }
    
    return false;
  }
}

// Ensure connection is alive before critical operations
export async function ensureConnection(): Promise<void> {
  const isHealthy = await checkDatabaseHealth(true);
  if (!isHealthy) {
    throw new Error('Database connection unavailable');
  }
}

// Transaction utilities
export async function withTransaction<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return prisma?.$transaction(callback) || Promise.reject(new Error('Prisma client not available'));
}

// Soft delete utilities
export async function softDelete(
  model: string,
  id: string,
  userId?: string
): Promise<void> {
  const updateData: any = {
    deletedAt: new Date(),
  };

  if (userId) {
    updateData.deletedBy = userId;
  }

  await (prisma as any)[model].update({
    where: { id },
    data: updateData,
  });
}

// Audit logging utility
export async function createAuditLog(data: {
  actorId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string;
  before?: any;
  after?: any;
  ip?: string;
  userAgent?: string;
  details?: any;
}): Promise<void> {
  await prisma.auditLog.create({
    data,
  });
}

// Pagination utilities
export interface PaginationOptions {
  page: number;
  limit: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function paginate<T>(
  model: any,
  options: PaginationOptions,
  where?: any
): Promise<PaginatedResult<T>> {
  const { page, limit, orderBy } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    }),
    model.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// Search utilities
export function buildSearchQuery(
  searchTerm: string,
  fields: string[]
): any {
  if (!searchTerm) return {};

  return {
    OR: fields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive',
      },
    })),
  };
}

// Date range utilities
export function buildDateRangeQuery(
  field: string,
  startDate?: Date,
  endDate?: Date
): any {
  const query: any = {};

  if (startDate || endDate) {
    query[field] = {};
    if (startDate) query[field].gte = startDate;
    if (endDate) query[field].lte = endDate;
  }

  return query;
}

// Re-export Prisma types with namespace to avoid conflicts (conditionally)
export type PrismaClient = any;
export type PrismaUser = any;
export type PrismaDriver = any;
export type PrismaBooking = any;
export type PrismaAddress = any;
export type PrismaContact = any;
export type PrismaAssignment = any;

// Export the client as default
export default prisma;


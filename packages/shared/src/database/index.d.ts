declare global {
    var __prisma: any | undefined;
}
export declare const prisma: any;
export declare function connectDatabase(retries?: number): Promise<void>;
export declare function disconnectDatabase(): Promise<void>;
export declare function checkDatabaseHealth(autoReconnect?: boolean): Promise<boolean>;
export declare function ensureConnection(): Promise<void>;
export declare function withTransaction<T>(callback: (tx: any) => Promise<T>): Promise<T>;
export declare function softDelete(model: string, id: string, userId?: string): Promise<void>;
export declare function createAuditLog(data: {
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
}): Promise<void>;
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
export declare function paginate<T>(model: any, options: PaginationOptions, where?: any): Promise<PaginatedResult<T>>;
export declare function buildSearchQuery(searchTerm: string, fields: string[]): any;
export declare function buildDateRangeQuery(field: string, startDate?: Date, endDate?: Date): any;
export type PrismaClient = any;
export type PrismaUser = any;
export type PrismaDriver = any;
export type PrismaBooking = any;
export type PrismaAddress = any;
export type PrismaContact = any;
export type PrismaAssignment = any;
export default prisma;
//# sourceMappingURL=index.d.ts.map
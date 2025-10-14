import { logAudit } from './audit';
import { prisma } from '@/lib/prisma';

export interface ExportOptions {
  type: 'audit' | 'system' | 'error' | 'all';
  format: 'json' | 'csv' | 'xml';
  dateFrom?: Date;
  dateTo?: Date;
  filters?: {
    action?: string;
    entity?: string;
    actorRole?: string;
    level?: string;
    service?: string;
  };
  includeDetails?: boolean;
  maxRecords?: number;
}

export interface ExportResult {
  filename: string;
  contentType: string;
  data: string | Buffer;
  recordCount: number;
  exportTime: Date;
}

class LogExporter {
  private static instance: LogExporter;

  private constructor() {}

  static getInstance(): LogExporter {
    if (!LogExporter.instance) {
      LogExporter.instance = new LogExporter();
    }
    return LogExporter.instance;
  }

  async exportLogs(
    options: ExportOptions,
    actorId: string
  ): Promise<ExportResult> {
    const startTime = Date.now();

    try {
      let logs: any[] = [];
      let recordCount = 0;

      if (options.type === 'audit' || options.type === 'all') {
        const auditLogs = await this.getAuditLogs(options);
        logs.push(...auditLogs);
        recordCount += auditLogs.length;
      }

      if (options.type === 'system' || options.type === 'all') {
        const systemLogs = await this.getSystemLogs(options);
        logs.push(...systemLogs);
        recordCount += systemLogs.length;
      }

      if (options.type === 'error' || options.type === 'all') {
        const errorLogs = await this.getErrorLogs(options);
        logs.push(...errorLogs);
        recordCount += errorLogs.length;
      }

      // Sort by timestamp
      logs.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Limit records if specified
      if (options.maxRecords && logs.length > options.maxRecords) {
        logs = logs.slice(0, options.maxRecords);
        recordCount = options.maxRecords;
      }

      // Generate export data
      const exportData = await this.generateExportData(logs, options);

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `logs_${options.type}_${timestamp}.${options.format}`;

      // Log the export action
      await logAudit(
        'system',
        'logs_exported',
        options.type,
        {
          recordCount,
          format: options.format,
          filters: options.filters,
          exportTime: new Date().toISOString(),
        }
      );

      return {
        filename,
        contentType: this.getContentType(options.format),
        data: exportData,
        recordCount,
        exportTime: new Date(),
      };
    } catch (error) {
      console.error('Log export error:', error);
      throw new Error(
        `Failed to export logs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async getAuditLogs(options: ExportOptions): Promise<any[]> {
    const where: any = {};

    if (options.dateFrom || options.dateTo) {
      where.createdAt = {};
      if (options.dateFrom) where.createdAt.gte = options.dateFrom;
      if (options.dateTo) where.createdAt.lte = options.dateTo;
    }

    if (options.filters?.action) {
      where.action = { contains: options.filters.action, mode: 'insensitive' };
    }

    if (options.filters?.entity) {
      where.targetType = {
        contains: options.filters.entity,
        mode: 'insensitive',
      };
    }

    if (options.filters?.actorRole) {
      where.actorRole = {
        contains: options.filters.actorRole,
        mode: 'insensitive',
      };
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return auditLogs.map((log: any) => ({
      id: log.id,
      timestamp: log.createdAt,
      actor: log.user?.email || log.actorId,
      actorRole: log.actorRole,
      action: log.action,
      entity: log.targetType,
      entityId: log.targetId,
      ip: log.ip,
      userAgent: log.userAgent,
      before: options.includeDetails ? log.before : undefined,
      after: options.includeDetails ? log.after : undefined,
      details: options.includeDetails ? log.details : undefined,
      type: 'audit',
    }));
  }

  private async getSystemLogs(options: ExportOptions): Promise<any[]> {
    // Mock system logs - in production, these would come from a logging service
    const systemLogs = [
      {
        id: 'sys_1',
        timestamp: new Date(),
        level: 'info',
        service: 'api',
        message: 'API server started successfully',
        details: 'Server listening on port 3000',
        type: 'system',
      },
      {
        id: 'sys_2',
        timestamp: new Date(Date.now() - 60000),
        level: 'warning',
        service: 'database',
        message: 'High connection pool usage',
        details: 'Connection pool at 85% capacity',
        type: 'system',
      },
    ];

    // Apply filters
    let filteredLogs = systemLogs;

    if (options.filters?.level) {
      filteredLogs = filteredLogs.filter(
        log => log.level === options.filters?.level
      );
    }

    if (options.filters?.service) {
      filteredLogs = filteredLogs.filter(
        log => log.service === options.filters?.service
      );
    }

    if (options.dateFrom) {
      filteredLogs = filteredLogs.filter(
        log => new Date(log.timestamp) >= options.dateFrom!
      );
    }

    if (options.dateTo) {
      filteredLogs = filteredLogs.filter(
        log => new Date(log.timestamp) <= options.dateTo!
      );
    }

    return filteredLogs;
  }

  private async getErrorLogs(options: ExportOptions): Promise<any[]> {
    // Mock error logs - in production, these would come from error tracking service
    const errorLogs = [
      {
        id: 'err_1',
        timestamp: new Date(),
        service: 'api',
        error: "TypeError: Cannot read property 'status' of undefined",
        stack: 'at processOrder (/app/orders.js:45:12)',
        occurrences: 3,
        type: 'error',
      },
    ];

    // Apply filters
    let filteredLogs = errorLogs;

    if (options.filters?.service) {
      filteredLogs = filteredLogs.filter(
        log => log.service === options.filters?.service
      );
    }

    if (options.dateFrom) {
      filteredLogs = filteredLogs.filter(
        log => new Date(log.timestamp) >= options.dateFrom!
      );
    }

    if (options.dateTo) {
      filteredLogs = filteredLogs.filter(
        log => new Date(log.timestamp) <= options.dateTo!
      );
    }

    return filteredLogs;
  }

  private async generateExportData(
    logs: any[],
    options: ExportOptions
  ): Promise<string | Buffer> {
    switch (options.format) {
      case 'json':
        return JSON.stringify(logs, null, 2);

      case 'csv':
        return this.generateCSV(logs);

      case 'xml':
        return this.generateXML(logs);

      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  private generateCSV(logs: any[]): string {
    if (logs.length === 0) return '';

    // Get all unique keys from all logs
    const allKeys = new Set<string>();
    logs.forEach(log => {
      Object.keys(log).forEach(key => allKeys.add(key));
    });

    const keys = Array.from(allKeys);
    const csvRows = [keys.join(',')]; // Header

    logs.forEach(log => {
      const row = keys.map(key => {
        const value = log[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object')
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  private generateXML(logs: any[]): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const rootStart = '<logs>';
    const rootEnd = '</logs>';

    const logElements = logs
      .map(log => {
        const logStart = '<log>';
        const logEnd = '</log>';

        const fields = Object.entries(log)
          .map(([key, value]) => {
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') {
              return `<${key}><![CDATA[${JSON.stringify(value)}]]></${key}>`;
            }
            return `<${key}><![CDATA[${String(value)}]]></${key}>`;
          })
          .join('');

        return logStart + fields + logEnd;
      })
      .join('');

    return xmlHeader + rootStart + logElements + rootEnd;
  }

  private getContentType(format: string): string {
    switch (format) {
      case 'json':
        return 'application/json';
      case 'csv':
        return 'text/csv';
      case 'xml':
        return 'application/xml';
      default:
        return 'application/octet-stream';
    }
  }

  async getExportHistory(actorId: string, limit: number = 50): Promise<any[]> {
    const exports = await prisma.auditLog.findMany({
      where: {
        action: 'logs_exported',
        actorId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return exports.map((exp: any) => ({
      id: exp.id,
      timestamp: exp.createdAt,
      type: (exp.after as any)?.type || 'unknown',
      format: (exp.after as any)?.format || 'unknown',
      recordCount: (exp.after as any)?.recordCount || 0,
      filters: (exp.after as any)?.filters || {},
    }));
  }
}

export const logExporter = LogExporter.getInstance();
export default logExporter;

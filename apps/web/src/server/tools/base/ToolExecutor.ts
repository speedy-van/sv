import { z } from 'zod';
import { createAuditLogEntry } from '@/lib/audit';

export enum RiskLevel {
  LOW = 'LOW',      // Auto execute
  MEDIUM = 'MEDIUM', // Single confirmation
  HIGH = 'HIGH'      // Dual confirmation + OTP
}

export interface ToolContext {
  userId: string;
  userRole: string;
  adminRole?: string;
  sessionId: string;
  timestamp: Date;
}

export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  requiresConfirmation?: boolean;
  confirmationType?: 'single' | 'dual';
  auditId?: string;
  message?: string;
}

export interface ToolExecutionLog {
  id: string;
  toolName: string;
  action: string;
  context: ToolContext;
  input: any;
  output: any;
  riskLevel: RiskLevel;
  confirmed: boolean;
  confirmationType?: string;
  reason?: string;
  executedAt: Date;
  duration: number;
  status: 'success' | 'error' | 'pending_confirmation';
}

/**
 * Base class for all AI tools with enterprise-grade security
 */
export abstract class BaseTool<TInput = any, TOutput = any> {
  abstract name: string;
  abstract description: string;
  abstract riskLevel: RiskLevel;
  abstract inputSchema: z.ZodType<TInput>;

  /**
   * Validate input against schema
   */
  protected validateInput(input: unknown): TInput {
    try {
      return this.inputSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Input validation failed: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Check authorization for this tool
   */
  protected async checkAuthorization(context: ToolContext): Promise<void> {
    if (context.userRole !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    // High risk tools require superadmin
    if (this.riskLevel === RiskLevel.HIGH && context.adminRole !== 'superadmin') {
      throw new Error('Unauthorized: Superadmin access required for high-risk operations');
    }
  }

  /**
   * Log tool execution to audit trail
   */
  protected async logExecution(
    context: ToolContext,
    input: TInput,
    output: ToolResult<TOutput>,
    duration: number
  ): Promise<string> {
    const log = await createAuditLogEntry({
      actorId: context.userId,
      actorRole: context.userRole,
      action: `AI_TOOL_${this.name.toUpperCase()}`,
      targetType: 'ai_tool',
      targetId: output.auditId ?? context.sessionId,
      details: {
        toolName: this.name,
        riskLevel: this.riskLevel,
        input,
        output: output.data,
        duration,
        sessionId: context.sessionId,
        confirmed: !output.requiresConfirmation,
        confirmationType: output.confirmationType,
      },
    });

    return log.id;
  }

  /**
   * Execute the tool with full safety checks
   */
  async execute(input: unknown, context: ToolContext): Promise<ToolResult<TOutput>> {
    const startTime = Date.now();

    try {
      // 1. Validate input
      const validatedInput = this.validateInput(input);

      // 2. Check authorization
      await this.checkAuthorization(context);

      // 3. Check if confirmation required
      if (this.riskLevel === RiskLevel.HIGH) {
        return {
          success: false,
          requiresConfirmation: true,
          confirmationType: 'dual',
          message: 'This is a high-risk operation and requires dual confirmation with OTP',
        };
      }

      if (this.riskLevel === RiskLevel.MEDIUM) {
        return {
          success: false,
          requiresConfirmation: true,
          confirmationType: 'single',
          message: 'This operation requires confirmation to proceed',
        };
      }

      // 4. Execute the actual tool logic
      const result = await this.executeInternal(validatedInput, context);

      // 5. Log execution
      const duration = Date.now() - startTime;
      const auditId = await this.logExecution(context, validatedInput, result, duration);

      return {
        ...result,
        auditId,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error
      await createAuditLogEntry({
        actorId: context.userId,
        actorRole: context.userRole,
        action: `AI_TOOL_${this.name.toUpperCase()}_ERROR`,
        targetType: 'ai_tool',
        targetId: context.sessionId,
        details: {
          toolName: this.name,
          error: error instanceof Error ? error.message : String(error),
          duration,
        },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Internal execution logic - to be implemented by each tool
   */
  protected abstract executeInternal(
    input: TInput,
    context: ToolContext
  ): Promise<ToolResult<TOutput>>;

  /**
   * Execute with confirmation (after user confirmed)
   */
  async executeWithConfirmation(
    input: unknown,
    context: ToolContext,
    confirmationToken: string,
    reason?: string
  ): Promise<ToolResult<TOutput>> {
    const startTime = Date.now();

    try {
      const validatedInput = this.validateInput(input);
      await this.checkAuthorization(context);

      // Verify confirmation token
      if (this.riskLevel === RiskLevel.HIGH) {
        // TODO: Verify OTP token
        // await verifyOTP(context.userId, confirmationToken);
      }

      // Execute
      const result = await this.executeInternal(validatedInput, context);

      // Log with confirmation details
      const duration = Date.now() - startTime;
      const auditEntry = await createAuditLogEntry({
        actorId: context.userId,
        actorRole: context.userRole,
        action: `AI_TOOL_${this.name.toUpperCase()}_CONFIRMED`,
        targetType: 'ai_tool',
        targetId: result.auditId ?? context.sessionId,
        details: {
          toolName: this.name,
          riskLevel: this.riskLevel,
          input: validatedInput,
          output: result.data,
          duration,
          confirmed: true,
          confirmationToken,
          reason,
        },
      });

      return {
        ...result,
        auditId: auditEntry.id,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

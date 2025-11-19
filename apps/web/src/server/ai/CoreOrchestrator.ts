import { prisma } from '@/lib/prisma';
import { createAuditLogEntry } from '@/lib/audit';
import { multiAgentSystem, MultiAgentSystem } from '../agents/MultiAgentSystem';
import { ToolContext, ToolResult } from '../tools/base/ToolExecutor';
import { orderTools } from '../tools/orderTools';
import { driverTools } from '../tools/driverTools';
import { financeTools } from '../tools/financeTools';
import { analyticsTools } from '../tools/analyticsTools';

/**
 * Intent types
 */
type IntentType = 
  | 'query'           // استعلام بيانات
  | 'action'          // تنفيذ عملية
  | 'analysis'        // تحليل
  | 'automation'      // أتمتة
  | 'collaboration'   // تعاون بين agents
  | 'unknown';        // غير محدد

/**
 * Intent classification
 */
interface Intent {
  type: IntentType;
  confidence: number;
  goal: string;
  entities: Record<string, any>;
  suggestedAgent?: string;
  suggestedTool?: string;
  requiresConfirmation: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Execution context
 */
interface ExecutionContext {
  userId: string;
  userRole: string;
  sessionId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Orchestration result
 */
interface OrchestrationResult {
  success: boolean;
  intent: Intent;
  agent?: string;
  tool?: string;
  result?: any;
  error?: string;
  auditLogId?: string;
  executionTime: number;
  dashboardUpdate?: {
    type: string;
    data: any;
  };
}

/**
 * Safety check result
 */
interface SafetyCheckResult {
  safe: boolean;
  reasons?: string[];
  riskLevel: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
}

/**
 * Core Orchestrator
 * المنسق الأساسي - يربط جميع مكونات النظام
 */
export class CoreOrchestrator {
  private multiAgent: MultiAgentSystem;
  private allTools: Map<string, any>;

  constructor() {
    this.multiAgent = multiAgentSystem;
    
    // Collect all available tools
    this.allTools = new Map();
    this.registerTools();
  }

  /**
   * Register all tools in the system
   */
  private registerTools() {
    [...orderTools, ...driverTools, ...financeTools, ...analyticsTools]
      .forEach(tool => {
        this.allTools.set(tool.name, tool);
      });
  }

  /**
   * Main orchestration method
   * نقطة الدخول الرئيسية لجميع العمليات
   */
  async orchestrate(
    userInput: string,
    context: ExecutionContext
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();

    try {
      // Step 1: Analyze intent
      const intent = this.analyzeIntent(userInput);

      // Step 2: Safety check
      const safetyCheck = await this.performSafetyCheck(intent, context);
      
      if (!safetyCheck.safe) {
        return {
          success: false,
          intent,
          error: `عملية غير آمنة: ${safetyCheck.reasons?.join(', ')}`,
          executionTime: Date.now() - startTime,
        };
      }

      // Step 3: Requires confirmation?
      if (safetyCheck.requiresApproval && !context.metadata?.confirmed) {
        return {
          success: false,
          intent,
          error: 'requires_confirmation',
          executionTime: Date.now() - startTime,
        };
      }

      // Step 4: Execute based on intent type
      let result: any;
      let agent: string | undefined;
      let tool: string | undefined;

      switch (intent.type) {
        case 'automation':
          result = {
            success: false,
            error: 'Automation engine not yet implemented',
          };
          break;

        case 'collaboration':
          result = await this.executeCollaboration(intent, context);
          agent = 'multi-agent';
          break;

        case 'action':
        case 'query':
        case 'analysis':
          const execution = await this.executeWithAgent(intent, context);
          result = execution.result;
          agent = execution.agent;
          tool = execution.tool;
          break;

        default:
          result = {
            success: false,
            error: 'لم أتمكن من فهم الطلب',
          };
      }

      // Step 5: Create audit log
      const auditLogId = await this.createAuditLog(
        intent,
        context,
        result,
        agent,
        tool
      );

      // Step 6: Generate dashboard update
      const dashboardUpdate = this.generateDashboardUpdate(intent, result);

      // Step 7: Return result
      return {
        success: result.success !== false,
        intent,
        agent,
        tool,
        result: result.data || result,
        error: result.error,
        auditLogId,
        executionTime: Date.now() - startTime,
        dashboardUpdate,
      };

    } catch (error) {
      return {
        success: false,
        intent: { type: 'unknown', confidence: 0, goal: userInput, entities: {}, requiresConfirmation: false, riskLevel: 'low' },
        error: error instanceof Error ? error.message : 'خطأ غير متوقع',
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Analyze user intent
   * تحليل نية المستخدم من النص
   */
  private analyzeIntent(input: string): Intent {
    const inputLower = input.toLowerCase();
    const inputArabic = input;

    // Initialize intent
    const intent: Intent = {
      type: 'unknown',
      confidence: 0,
      goal: input,
      entities: {},
      requiresConfirmation: false,
      riskLevel: 'low',
    };

    // Keywords mapping
    const keywords = {
      query: ['show', 'get', 'list', 'display', 'عرض', 'اعرض', 'أظهر', 'اطلع', 'كم'],
      action: ['assign', 'cancel', 'create', 'update', 'delete', 'عين', 'ألغ', 'أنشئ', 'حدث', 'احذف'],
      analysis: ['analyze', 'report', 'summary', 'trends', 'حلل', 'تقرير', 'ملخص', 'اتجاهات'],
      automation: ['automate', 'schedule', 'recurring', 'آلي', 'جدول', 'متكرر'],
      collaboration: ['optimize', 'best', 'recommend', 'حسن', 'أفضل', 'انصح'],
    };

    // Detect intent type
    for (const [type, words] of Object.entries(keywords)) {
      if (words.some(word => inputLower.includes(word) || inputArabic.includes(word))) {
        intent.type = type as IntentType;
        intent.confidence = 0.8;
        break;
      }
    }

    // Extract entities
    this.extractEntities(input, intent);

    // Determine risk level
    intent.riskLevel = this.determineRiskLevel(intent);

    // Requires confirmation?
    intent.requiresConfirmation = this.requiresConfirmation(intent);

    // Suggest agent
    intent.suggestedAgent = this.suggestAgent(intent);

    // Suggest tool
    intent.suggestedTool = this.suggestTool(intent);

    return intent;
  }

  /**
   * Extract entities from input
   */
  private extractEntities(input: string, intent: Intent) {
    const inputLower = input.toLowerCase();

    // Order ID
    const orderMatch = input.match(/order[:\s#]+(\d+)|طلب[:\s#]+(\d+)/i);
    if (orderMatch) {
      intent.entities.orderId = orderMatch[1] || orderMatch[2];
    }

    // Driver ID
    const driverMatch = input.match(/driver[:\s#]+(\d+)|سائق[:\s#]+(\d+)/i);
    if (driverMatch) {
      intent.entities.driverId = driverMatch[1] || driverMatch[2];
    }

    // Time period
    if (inputLower.includes('today') || input.includes('اليوم')) {
      intent.entities.period = 'today';
    } else if (inputLower.includes('week') || input.includes('أسبوع')) {
      intent.entities.period = 'week';
    } else if (inputLower.includes('month') || input.includes('شهر')) {
      intent.entities.period = 'month';
    }

    // Count/limit
    const countMatch = input.match(/(\d+)\s*(orders?|طلب)/i);
    if (countMatch) {
      intent.entities.limit = parseInt(countMatch[1]);
    }
  }

  /**
   * Determine risk level
   */
  private determineRiskLevel(intent: Intent): 'low' | 'medium' | 'high' {
    const dangerousActions = ['delete', 'cancel', 'refund', 'احذف', 'ألغ', 'استرداد'];
    const inputLower = intent.goal.toLowerCase();

    if (dangerousActions.some(action => inputLower.includes(action))) {
      return 'high';
    }

    if (intent.type === 'action') {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Check if action requires confirmation
   */
  private requiresConfirmation(intent: Intent): boolean {
    return intent.riskLevel === 'high' || 
           (intent.type === 'action' && intent.riskLevel === 'medium');
  }

  /**
   * Suggest appropriate agent
   */
  private suggestAgent(intent: Intent): string | undefined {
    const goal = intent.goal.toLowerCase();

    if (goal.includes('assign') || goal.includes('driver') || goal.includes('سائق')) {
      return 'dispatch';
    }

    if (goal.includes('revenue') || goal.includes('payment') || goal.includes('مالي')) {
      return 'finance';
    }

    if (goal.includes('trend') || goal.includes('kpi') || goal.includes('تحليل')) {
      return 'analytics';
    }

    if (goal.includes('order') || goal.includes('طلب')) {
      return 'ops';
    }

    return undefined;
  }

  /**
   * Suggest appropriate tool
   */
  private suggestTool(intent: Intent): string | undefined {
    const goal = intent.goal.toLowerCase();

    // Order tools
    if (goal.includes('unassigned')) return 'get_unassigned_orders';
    if (goal.includes('assign') && intent.entities.orderId) return 'assign_driver_to_order';
    if (goal.includes('cancel') && intent.entities.orderId) return 'cancel_order';

    // Driver tools
    if (goal.includes('available') && goal.includes('driver')) return 'get_available_drivers';
    if (goal.includes('best driver')) return 'find_best_driver';

    // Finance tools
    if (goal.includes('revenue')) return 'generate_revenue_report';
    if (goal.includes('outstanding')) return 'get_outstanding_payments';

    // Analytics tools
    if (goal.includes('kpi')) return 'get_kpis';
    if (goal.includes('trend')) return 'get_order_trends';

    return undefined;
  }

  /**
   * Perform safety checks
   */
  private async performSafetyCheck(
    intent: Intent,
    context: ExecutionContext
  ): Promise<SafetyCheckResult> {
    const reasons: string[] = [];

    // Check user permissions
    if (intent.type === 'action' && context.userRole !== 'admin' && context.userRole !== 'superadmin') {
      reasons.push('صلاحيات غير كافية');
      return {
        safe: false,
        reasons,
        riskLevel: 'high',
        requiresApproval: true,
      };
    }

    // Check for dangerous operations
    if (intent.riskLevel === 'high') {
      return {
        safe: true,
        riskLevel: 'high',
        requiresApproval: true,
      };
    }

    // Rate limiting check (simple version)
    // TODO: Implement proper rate limiting with Redis

    return {
      safe: true,
      riskLevel: intent.riskLevel,
      requiresApproval: intent.requiresConfirmation,
    };
  }



  /**
   * Execute collaboration between agents
   */
  private async executeCollaboration(
    intent: Intent,
    context: ExecutionContext
  ): Promise<ToolResult<any>> {
    const agents = ['ops', 'dispatch', 'analytics'] as any[];
    
    return await this.multiAgent.collaborate(
      intent.goal,
      {
        userId: context.userId,
        userRole: context.userRole,
        sessionId: context.sessionId,
        timestamp: context.timestamp,
      },
      agents
    );
  }

  /**
   * Execute with specific agent
   */
  private async executeWithAgent(
    intent: Intent,
    context: ExecutionContext
  ): Promise<{ result: any; agent?: string; tool?: string }> {
    const toolContext: ToolContext = {
      userId: context.userId,
      userRole: context.userRole,
      sessionId: context.sessionId,
      timestamp: context.timestamp,
    };

    // Try direct tool execution first
    if (intent.suggestedTool) {
      const tool = this.allTools.get(intent.suggestedTool);
      if (tool) {
        try {
          const result = await tool.execute(intent.entities, toolContext);
          return {
            result,
            tool: intent.suggestedTool,
          };
        } catch (error) {
          // Fall through to agent execution
        }
      }
    }

    // Use agent
    if (intent.suggestedAgent) {
      const result = await this.multiAgent.executeWithAgent(
        intent.goal,
        toolContext,
        intent.suggestedAgent as any
      );
      return {
        result,
        agent: intent.suggestedAgent,
      };
    }

    // Let multi-agent system decide
    const result = await this.multiAgent.executeWithAgent(
      intent.goal,
      toolContext
    );
    
    return {
      result,
      agent: 'auto-routed',
    };
  }

  /**
   * Create audit log
   */
  private async createAuditLog(
    intent: Intent,
    context: ExecutionContext,
    result: any,
    agent?: string,
    tool?: string
  ): Promise<string> {
    try {
      const log = await createAuditLogEntry({
        actorId: context.userId,
        actorRole: context.userRole ?? 'system',
        action: `AI_${intent.type.toUpperCase()}_${tool || agent || 'ORCHESTRATOR'}`,
        targetType: 'ai_orchestrator',
        targetId: context.sessionId,
        ipAddress: context.metadata?.ipAddress ?? null,
        userAgent: context.metadata?.userAgent ?? null,
        details: {
          intent: intent.goal,
          intentType: intent.type,
          confidence: intent.confidence,
          agent,
          tool,
          entities: intent.entities,
          success: result.success !== false,
          riskLevel: intent.riskLevel,
        },
      });

      return log.id;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      return 'failed';
    }
  }

  /**
   * Generate dashboard update
   */
  private generateDashboardUpdate(intent: Intent, result: any): any {
    if (!result.success) return undefined;

    // Order-related updates
    if (intent.entities.orderId) {
      return {
        type: 'order_updated',
        data: {
          orderId: intent.entities.orderId,
          action: intent.type,
        },
      };
    }

    // Driver-related updates
    if (intent.entities.driverId) {
      return {
        type: 'driver_updated',
        data: {
          driverId: intent.entities.driverId,
          action: intent.type,
        },
      };
    }

    // Analytics updates
    if (intent.type === 'analysis') {
      return {
        type: 'analytics_refresh',
        data: {
          metrics: result.data,
        },
      };
    }

    return undefined;
  }

  /**
   * Get orchestrator status
   */
  getStatus() {
    return {
      tools: this.allTools.size,
      agents: this.multiAgent.getAgentsInfo().length,
      timestamp: new Date(),
    };
  }
}

// Singleton instance
export const coreOrchestrator = new CoreOrchestrator();

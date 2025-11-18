import { ToolContext, ToolResult } from '../tools/base/ToolExecutor';
import { orderTools } from '../tools/orderTools';
import { driverTools } from '../tools/driverTools';
import { financeTools } from '../tools/financeTools';
import { analyticsTools } from '../tools/analyticsTools';

/**
 * Agent specialization
 */
type AgentType = 'ops' | 'finance' | 'dispatch' | 'analytics';

/**
 * Agent capability
 */
interface AgentCapability {
  name: string;
  description: string;
  tools: string[];
}

/**
 * Agent task
 */
interface AgentTask {
  id: string;
  type: AgentType;
  goal: string;
  context: any;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

/**
 * Base Agent class
 */
abstract class BaseAgent {
  abstract type: AgentType;
  abstract name: string;
  abstract description: string;
  abstract capabilities: AgentCapability[];

  /**
   * Check if agent can handle a task
   */
  canHandle(task: string): boolean {
    const taskLower = task.toLowerCase();
    return this.capabilities.some(cap =>
      cap.tools.some(tool => taskLower.includes(tool.toLowerCase()))
    );
  }

  /**
   * Execute task
   */
  abstract execute(task: AgentTask, context: ToolContext): Promise<ToolResult<any>>;

  /**
   * Get agent info
   */
  getInfo() {
    return {
      type: this.type,
      name: this.name,
      description: this.description,
      capabilities: this.capabilities,
    };
  }
}

/**
 * Operations Agent
 * Handles daily operations, order management, and driver coordination
 */
class OpsAgent extends BaseAgent {
  type: AgentType = 'ops';
  name = 'وكيل العمليات';
  description = 'متخصص في إدارة العمليات اليومية والطلبات والسائقين';
  
  capabilities: AgentCapability[] = [
    {
      name: 'إدارة الطلبات',
      description: 'تعيين، إلغاء، ومتابعة الطلبات',
      tools: ['get_unassigned_orders', 'assign_driver_to_order', 'cancel_order', 'get_order_details'],
    },
    {
      name: 'تنسيق السائقين',
      description: 'إدارة السائقين وتوفرهم',
      tools: ['get_available_drivers', 'find_best_driver', 'update_driver_availability'],
    },
  ];

  async execute(task: AgentTask, context: ToolContext): Promise<ToolResult<any>> {
    const taskGoal = task.goal.toLowerCase();

    try {
      // Order assignment
      if (taskGoal.includes('assign') || taskGoal.includes('تعيين')) {
        const unassignedTool = orderTools.find(t => t.name === 'get_unassigned_orders');
        const unassignedResult = await unassignedTool?.execute({ limit: 10 }, context);

        if (unassignedResult?.success && unassignedResult.data?.orders?.length > 0) {
          return {
            success: true,
            data: {
              agent: this.name,
              action: 'identified_unassigned_orders',
              orders: unassignedResult.data.orders,
              recommendation: 'يوجد طلبات غير معينة تحتاج إلى تعيين سائقين',
            },
          };
        }
      }

      // Driver availability
      if (taskGoal.includes('driver') || taskGoal.includes('سائق')) {
        const driversTool = driverTools.find(t => t.name === 'get_available_drivers');
        const driversResult = await driversTool?.execute({}, context);

        if (driversResult?.success) {
          return {
            success: true,
            data: {
              agent: this.name,
              action: 'checked_driver_availability',
              drivers: driversResult.data,
            },
          };
        }
      }

      return {
        success: false,
        error: 'لم أتمكن من فهم المهمة المطلوبة',
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Finance Agent
 * Handles financial operations, payments, and revenue analysis
 */
class FinanceAgent extends BaseAgent {
  type: AgentType = 'finance';
  name = 'وكيل المالية';
  description = 'متخصص في العمليات المالية والمدفوعات والتحليلات المالية';
  
  capabilities: AgentCapability[] = [
    {
      name: 'التحليلات المالية',
      description: 'تقارير الإيرادات والملخصات المالية',
      tools: ['generate_revenue_report', 'get_financial_summary'],
    },
    {
      name: 'إدارة المدفوعات',
      description: 'معالجة المدفوعات والاستردادات',
      tools: ['process_refund', 'get_outstanding_payments', 'generate_invoice'],
    },
  ];

  async execute(task: AgentTask, context: ToolContext): Promise<ToolResult<any>> {
    const taskGoal = task.goal.toLowerCase();

    try {
      // Revenue analysis
      if (taskGoal.includes('revenue') || taskGoal.includes('إيراد')) {
        const financeTool = financeTools.find(t => t.name === 'get_financial_summary');
        const result = await financeTool?.execute({ period: 'month' }, context);

        if (result?.success) {
          return {
            success: true,
            data: {
              agent: this.name,
              action: 'financial_summary',
              summary: result.data,
              insights: this.generateFinancialInsights(result.data),
            },
          };
        }
      }

      // Outstanding payments
      if (taskGoal.includes('outstanding') || taskGoal.includes('معلق')) {
        const paymentsTool = financeTools.find(t => t.name === 'get_outstanding_payments');
        const result = await paymentsTool?.execute({ limit: 50 }, context);

        if (result?.success) {
          return {
            success: true,
            data: {
              agent: this.name,
              action: 'outstanding_payments_review',
              payments: result.data,
            },
          };
        }
      }

      return {
        success: false,
        error: 'لم أتمكن من معالجة المهمة المالية',
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private generateFinancialInsights(data: any) {
    const insights: string[] = [];
    
    if (data.metrics?.profitMargin > 30) {
      insights.push('هامش الربح ممتاز (أكثر من 30%)');
    } else if (data.metrics?.profitMargin < 15) {
      insights.push('⚠️ هامش ربح منخفض - يحتاج مراجعة');
    }

    if (data.metrics?.netRevenue > data.metrics?.grossRevenue * 0.5) {
      insights.push('صافي الإيرادات صحي');
    }

    return insights;
  }
}

/**
 * Dispatch Agent
 * Optimizes routing, driver assignments, and delivery efficiency
 */
class DispatchAgent extends BaseAgent {
  type: AgentType = 'dispatch';
  name = 'وكيل التوزيع';
  description = 'متخصص في تحسين المسارات وتعيين السائقين وكفاءة التوصيل';
  
  capabilities: AgentCapability[] = [
    {
      name: 'التعيين الذكي',
      description: 'اختيار أفضل سائق لكل طلب',
      tools: ['find_best_driver', 'assign_driver_to_order'],
    },
    {
      name: 'تحسين العمليات',
      description: 'تحليل الكفاءة وتحسين الأداء',
      tools: ['get_operational_efficiency', 'get_driver_performance_analytics'],
    },
  ];

  async execute(task: AgentTask, context: ToolContext): Promise<ToolResult<any>> {
    const taskGoal = task.goal.toLowerCase();

    try {
      // Find best driver for order
      if (taskGoal.includes('best driver') || taskGoal.includes('أفضل سائق')) {
        const orderId = task.context?.orderId;
        if (!orderId) {
          return {
            success: false,
            error: 'معرف الطلب مطلوب',
          };
        }

        const tool = orderTools.find(t => t.name === 'find_best_driver');
        const result = await tool?.execute({ orderId }, context);

        if (result?.success) {
          return {
            success: true,
            data: {
              agent: this.name,
              action: 'found_best_driver',
              recommendation: result.data,
            },
          };
        }
      }

      // Operational efficiency analysis
      if (taskGoal.includes('efficiency') || taskGoal.includes('كفاءة')) {
        const tool = analyticsTools.find(t => t.name === 'get_operational_efficiency');
        const result = await tool?.execute({ period: 'month' }, context);

        if (result?.success) {
          return {
            success: true,
            data: {
              agent: this.name,
              action: 'efficiency_analysis',
              metrics: result.data,
              recommendations: this.generateEfficiencyRecommendations(result.data),
            },
          };
        }
      }

      return {
        success: false,
        error: 'لم أتمكن من معالجة مهمة التوزيع',
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private generateEfficiencyRecommendations(data: any) {
    const recommendations: string[] = [];
    
    if (data.metrics?.avgAssignmentTimeMinutes > 15) {
      recommendations.push('⚠️ وقت التعيين طويل - يحتاج تحسين');
      recommendations.push('اقتراح: تفعيل التعيين التلقائي');
    }

    if (data.metrics?.cancellationRate > 10) {
      recommendations.push('⚠️ معدل إلغاء مرتفع - يحتاج تحقيق');
    }

    return recommendations;
  }
}

/**
 * Analytics Agent
 * Provides insights, predictions, and data analysis
 */
class AnalyticsAgent extends BaseAgent {
  type: AgentType = 'analytics';
  name = 'وكيل التحليلات';
  description = 'متخصص في التحليلات المتقدمة والتنبؤات والرؤى الذكية';
  
  capabilities: AgentCapability[] = [
    {
      name: 'تحليل الأداء',
      description: 'KPIs، اتجاهات، وأداء الفريق',
      tools: ['get_kpis', 'get_order_trends', 'get_driver_performance_analytics'],
    },
    {
      name: 'رؤى العملاء',
      description: 'تحليل سلوك العملاء',
      tools: ['get_customer_behavior_analytics'],
    },
  ];

  async execute(task: AgentTask, context: ToolContext): Promise<ToolResult<any>> {
    const taskGoal = task.goal.toLowerCase();

    try {
      // KPIs analysis
      if (taskGoal.includes('kpi') || taskGoal.includes('مؤشر')) {
        const tool = analyticsTools.find(t => t.name === 'get_kpis');
        const result = await tool?.execute({ period: 'month', compareWithPrevious: true }, context);

        if (result?.success) {
          return {
            success: true,
            data: {
              agent: this.name,
              action: 'kpi_analysis',
              kpis: result.data,
              insights: this.generateKPIInsights(result.data),
            },
          };
        }
      }

      // Trend analysis
      if (taskGoal.includes('trend') || taskGoal.includes('اتجاه')) {
        const tool = analyticsTools.find(t => t.name === 'get_order_trends');
        const result = await tool?.execute({ days: 30, groupBy: 'day' }, context);

        if (result?.success) {
          return {
            success: true,
            data: {
              agent: this.name,
              action: 'trend_analysis',
              trends: result.data,
              predictions: result.data.prediction,
            },
          };
        }
      }

      return {
        success: false,
        error: 'لم أتمكن من إجراء التحليل المطلوب',
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private generateKPIInsights(data: any) {
    const insights: string[] = [];
    
    if (data.comparison?.ordersGrowth > 10) {
      insights.push('✅ نمو ممتاز في عدد الطلبات');
    } else if (data.comparison?.ordersGrowth < -5) {
      insights.push('⚠️ انخفاض في الطلبات - يحتاج تحقيق');
    }

    if (data.metrics?.completionRate > 90) {
      insights.push('✅ معدل إنجاز ممتاز');
    }

    return insights;
  }
}

/**
 * Multi-Agent System
 * Coordinates multiple specialized agents
 */
export class MultiAgentSystem {
  private agents: Map<AgentType, BaseAgent> = new Map();
  private taskQueue: AgentTask[] = [];

  constructor() {
    // Initialize all agents
    this.agents.set('ops', new OpsAgent());
    this.agents.set('finance', new FinanceAgent());
    this.agents.set('dispatch', new DispatchAgent());
    this.agents.set('analytics', new AnalyticsAgent());
  }

  /**
   * Route task to appropriate agent
   */
  routeTask(goal: string): AgentType | null {
    for (const [type, agent] of this.agents) {
      if (agent.canHandle(goal)) {
        return type;
      }
    }
    return null;
  }

  /**
   * Execute task with appropriate agent
   */
  async executeWithAgent(
    goal: string,
    context: ToolContext,
    agentType?: AgentType
  ): Promise<ToolResult<any>> {
    // Auto-route if agent not specified
    const targetAgent = agentType || this.routeTask(goal);

    if (!targetAgent) {
      return {
        success: false,
        error: 'لم أتمكن من تحديد الوكيل المناسب لهذه المهمة',
      };
    }

    const agent = this.agents.get(targetAgent);
    if (!agent) {
      return {
        success: false,
        error: 'الوكيل غير موجود',
      };
    }

    const task: AgentTask = {
      id: `task_${Date.now()}`,
      type: targetAgent,
      goal,
      context: {},
      priority: 'medium',
      status: 'in_progress',
    };

    try {
      const result = await agent.execute(task, context);
      task.status = result.success ? 'completed' : 'failed';
      task.result = result.data;
      task.error = result.error;

      return result;
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        error: task.error,
      };
    }
  }

  /**
   * Get all agents info
   */
  getAgentsInfo() {
    return Array.from(this.agents.values()).map(agent => agent.getInfo());
  }

  /**
   * Get agent by type
   */
  getAgent(type: AgentType): BaseAgent | undefined {
    return this.agents.get(type);
  }

  /**
   * Collaborate between multiple agents
   */
  async collaborate(
    goal: string,
    context: ToolContext,
    involvedAgents: AgentType[]
  ): Promise<ToolResult<any>> {
    const results: any[] = [];

    for (const agentType of involvedAgents) {
      const result = await this.executeWithAgent(goal, context, agentType);
      results.push({
        agent: agentType,
        result,
      });
    }

    const allSuccessful = results.every(r => r.result.success);

    return {
      success: allSuccessful,
      data: {
        collaboration: true,
        agents: involvedAgents,
        results,
        summary: `${results.length} agents collaborated on the task`,
      },
    };
  }
}

// Singleton instance
export const multiAgentSystem = new MultiAgentSystem();

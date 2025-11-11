/**
 * Long-Term Memory Service for Speedy AI
 * Stores conversation summaries and retrieves context for future sessions
 */

import { prisma } from '@/lib/prisma';

export interface ConversationMemory {
  id: string;
  adminId: string;
  summary: string;
  keyTopics: string[];
  importantDecisions: string[];
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ProactiveInsight {
  type: 'pattern' | 'alert' | 'recommendation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionable: boolean;
  suggestedAction?: string;
  data?: Record<string, unknown>;
}

export class MemoryService {
  /**
   * Store conversation summary for long-term memory
   */
  static async storeConversationSummary(
    adminId: string,
    messages: Array<{ role: string; content: string }>,
    summary: string,
    keyTopics: string[],
    importantDecisions: string[]
  ): Promise<void> {
    try {
      await prisma.aIConversationMemory.create({
        data: {
          adminId,
          summary,
          keyTopics,
          importantDecisions,
          messageCount: messages.length,
          metadata: {
            lastMessageAt: new Date(),
            conversationLength: messages.reduce((acc, m) => acc + m.content.length, 0),
          },
        },
      });
    } catch (error) {
      console.error('Failed to store conversation summary:', error);
      // Don't throw - memory storage failure shouldn't break the chat
    }
  }

  /**
   * Retrieve relevant memories for current context
   */
  static async getRelevantMemories(
    adminId: string,
    currentContext: string,
    limit: number = 5
  ): Promise<ConversationMemory[]> {
    try {
      // Get recent memories
      const memories = await prisma.aIConversationMemory.findMany({
        where: { adminId },
        orderBy: { createdAt: 'desc' },
        take: limit * 2, // Get more than needed for filtering
      });

      // Simple relevance scoring based on keyword matching
      const scoredMemories = memories.map((memory: { id: string; adminId: string; summary: string; keyTopics: string[]; importantDecisions: string[]; createdAt: Date; messageCount: number; metadata: unknown }) => {
        const contextLower = currentContext.toLowerCase();
        let score = 0;

        // Check if key topics match
        memory.keyTopics.forEach((topic) => {
          if (contextLower.includes(topic.toLowerCase())) {
            score += 10;
          }
        });

        // Check if summary contains relevant keywords
        if (memory.summary.toLowerCase().includes(contextLower.substring(0, 50))) {
          score += 5;
        }

        // Recency bonus
        const daysSince = (Date.now() - memory.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        score += Math.max(0, 10 - daysSince);

        return { ...memory, score };
      });

      // Sort by score and return top matches
      return scoredMemories
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ score, ...memory }) => memory as ConversationMemory);
    } catch (error) {
      console.error('Failed to retrieve memories:', error);
      return [];
    }
  }

  /**
   * Analyze patterns and generate proactive insights
   */
  static async generateProactiveInsights(adminId: string): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];

    try {
      // Get bookings from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentBookings = await prisma.booking.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
        include: {
          driver: true,
        },
      });

      // Pattern 1: Detect peak times
      const hourCounts = new Array(24).fill(0);
      recentBookings.forEach((booking) => {
        const hour = new Date(booking.pickupDateTime).getHours();
        hourCounts[hour]++;
      });

      const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
      const peakCount = hourCounts[peakHour];

      if (peakCount > 5) {
        insights.push({
          type: 'pattern',
          severity: 'medium',
          title: `Peak booking time detected: ${peakHour}:00`,
          description: `You have ${peakCount} bookings typically around ${peakHour}:00. Consider ensuring driver availability during this time.`,
          actionable: true,
          suggestedAction: 'Schedule more drivers for peak hours',
          data: { peakHour, peakCount, hourCounts },
        });
      }

      // Pattern 2: Unassigned bookings alert
      const unassignedCount = recentBookings.filter((b) => !b.driverId).length;
      if (unassignedCount > 3) {
        insights.push({
          type: 'alert',
          severity: 'high',
          title: `${unassignedCount} unassigned bookings`,
          description: `You have ${unassignedCount} bookings without assigned drivers. This may impact customer satisfaction.`,
          actionable: true,
          suggestedAction: 'Review and assign drivers to pending bookings',
          data: { unassignedCount },
        });
      }

      // Pattern 3: Driver utilization
      const activeDrivers = await prisma.driver.count({
        where: { status: 'ACTIVE' },
      });

      const assignedDrivers = new Set(
        recentBookings.filter((b) => b.driverId).map((b) => b.driverId)
      ).size;

      const utilization = activeDrivers > 0 ? (assignedDrivers / activeDrivers) * 100 : 0;

      if (utilization < 50) {
        insights.push({
          type: 'recommendation',
          severity: 'low',
          title: `Low driver utilization: ${utilization.toFixed(0)}%`,
          description: `Only ${assignedDrivers} out of ${activeDrivers} active drivers have bookings. Consider marketing campaigns or adjusting driver count.`,
          actionable: true,
          suggestedAction: 'Review driver roster or increase bookings',
          data: { utilization, activeDrivers, assignedDrivers },
        });
      }

      // Pattern 4: Weekend booking surge
      const weekendBookings = recentBookings.filter((b) => {
        const day = new Date(b.pickupDateTime).getDay();
        return day === 0 || day === 6; // Sunday or Saturday
      }).length;

      const weekdayBookings = recentBookings.length - weekendBookings;

      if (weekendBookings > weekdayBookings * 1.5) {
        insights.push({
          type: 'pattern',
          severity: 'medium',
          title: 'Weekend booking surge detected',
          description: `Weekend bookings (${weekendBookings}) are significantly higher than weekdays (${weekdayBookings}). Ensure adequate weekend staffing.`,
          actionable: true,
          suggestedAction: 'Increase weekend driver availability',
          data: { weekendBookings, weekdayBookings },
        });
      }

      // Pattern 5: Revenue trend
      const totalRevenue = recentBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const avgRevenuePerDay = totalRevenue / 7;

      if (avgRevenuePerDay < 500) {
        insights.push({
          type: 'alert',
          severity: 'medium',
          title: `Low average daily revenue: £${avgRevenuePerDay.toFixed(2)}`,
          description: `Your average daily revenue is below target. Consider promotional campaigns or pricing adjustments.`,
          actionable: true,
          suggestedAction: 'Review pricing strategy and marketing efforts',
          data: { totalRevenue, avgRevenuePerDay },
        });
      }
    } catch (error) {
      console.error('Failed to generate proactive insights:', error);
    }

    return insights;
  }

  /**
   * Detect sensitive context and warn admin
   */
  static detectSensitiveContext(message: string): {
    isSensitive: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let isSensitive = false;

    // Check for deletion/removal keywords
    if (/delete|remove|drop|truncate|destroy/i.test(message)) {
      warnings.push('⚠️ You are requesting a destructive operation. Please confirm before proceeding.');
      isSensitive = true;
    }

    // Check for bulk operations
    if (/all|every|bulk|mass/i.test(message) && /delete|update|change/i.test(message)) {
      warnings.push('⚠️ Bulk operation detected. This will affect multiple records.');
      isSensitive = true;
    }

    // Check for financial operations
    if (/refund|payment|charge|price|cost/i.test(message) && /change|update|modify/i.test(message)) {
      warnings.push('💰 Financial operation detected. Verify amounts carefully.');
      isSensitive = true;
    }

    // Check for customer data access
    if (/password|credit card|bank|ssn|national insurance/i.test(message)) {
      warnings.push('🔒 Sensitive customer data mentioned. Ensure compliance with data protection policies.');
      isSensitive = true;
    }

    return { isSensitive, warnings };
  }

  /**
   * Generate conversation summary using AI
   */
  static async generateSummary(
    messages: Array<{ role: string; content: string }>
  ): Promise<{
    summary: string;
    keyTopics: string[];
    importantDecisions: string[];
  }> {
    // Simple keyword extraction for now
    // In production, this would use the AI model to generate a proper summary
    const allContent = messages.map((m) => m.content).join(' ');

    // Extract key topics (simple approach)
    const topicKeywords = [
      'booking',
      'driver',
      'customer',
      'route',
      'payment',
      'refund',
      'complaint',
      'analytics',
      'revenue',
    ];
    const keyTopics = topicKeywords.filter((topic) =>
      allContent.toLowerCase().includes(topic)
    );

    // Extract important decisions (messages with action words)
    const decisionKeywords = ['assigned', 'approved', 'rejected', 'created', 'updated', 'deleted'];
    const importantDecisions = messages
      .filter((m) =>
        decisionKeywords.some((keyword) => m.content.toLowerCase().includes(keyword))
      )
      .map((m) => m.content.substring(0, 100))
      .slice(0, 5);

    // Generate simple summary
    const summary = `Conversation covered ${keyTopics.join(', ')} with ${messages.length} messages exchanged.`;

    return {
      summary,
      keyTopics,
      importantDecisions,
    };
  }
}

import { prisma } from '@/lib/prisma';

// Redis types
type Redis = any;

// Initialize Redis if available (optional - falls back to in-memory)
const redis: Redis | null = null;
// Redis disabled for now - using in-memory storage only
if (false && process.env.UPSTASH_REDIS_REST_URL) {
  console.log('Redis support available but disabled');
}

/**
 * Memory types
 */
type MemoryType = 
  | 'conversation'    // سجل المحادثة
  | 'context'         // سياق الجلسة
  | 'learning'        // تعلم من الأفعال السابقة
  | 'preference';     // تفضيلات المستخدم

/**
 * Memory entry
 */
interface MemoryEntry {
  id: string;
  userId: string;
  sessionId: string;
  type: MemoryType;
  content: any;
  timestamp: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Conversation turn
 */
interface ConversationTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  intent?: string;
  entities?: Record<string, any>;
  result?: any;
}

/**
 * Session context
 */
interface SessionContext {
  userId: string;
  sessionId: string;
  currentTopic?: string;
  recentEntities: Record<string, any>;
  conversationHistory: ConversationTurn[];
  activeOrderId?: string;
  activeDriverId?: string;
  preferences: Record<string, any>;
  lastActivity: Date;
}

/**
 * Learning entry
 */
interface LearningEntry {
  pattern: string;
  action: string;
  successRate: number;
  occurrences: number;
  lastSeen: Date;
}

/**
 * Memory System
 * نظام الذاكرة - يحافظ على السياق والتعلم من التفاعلات
 */
export class MemorySystem {
  private inMemoryStorage: Map<string, SessionContext> = new Map();
  private learningPatterns: Map<string, LearningEntry> = new Map();
  private readonly MAX_CONVERSATION_HISTORY = 20; // آخر 20 رسالة
  private readonly SESSION_TIMEOUT_MINUTES = 30;
  private readonly CONTEXT_EXPIRY_HOURS = 24;

  /**
   * Get or create session context
   */
  async getSessionContext(userId: string, sessionId: string): Promise<SessionContext> {
    const key = `${userId}:${sessionId}`;

    // Try in-memory first
    if (this.inMemoryStorage.has(key)) {
      const context = this.inMemoryStorage.get(key)!;
      
      // Check if session expired
      const minutesSinceLastActivity = 
        (Date.now() - context.lastActivity.getTime()) / 1000 / 60;
      
      if (minutesSinceLastActivity < this.SESSION_TIMEOUT_MINUTES) {
        return context;
      }
    }

    // Try Redis if available
    if (redis) {
      try {
        const cached = await redis.get(key) as SessionContext | null;
        if (cached) {
          this.inMemoryStorage.set(key, cached);
          return cached;
        }
      } catch (error) {
        console.error('Redis get error:', error);
      }
    }

    // Create new context
    const newContext: SessionContext = {
      userId,
      sessionId,
      recentEntities: {},
      conversationHistory: [],
      preferences: await this.loadUserPreferences(userId),
      lastActivity: new Date(),
    };

    await this.saveSessionContext(newContext);
    return newContext;
  }

  /**
   * Save session context
   */
  private async saveSessionContext(context: SessionContext) {
    const key = `${context.userId}:${context.sessionId}`;
    
    // Update timestamp
    context.lastActivity = new Date();

    // Save to in-memory
    this.inMemoryStorage.set(key, context);

    // Save to Redis if available
    if (redis) {
      try {
        await redis.set(key, context, {
          ex: this.SESSION_TIMEOUT_MINUTES * 60, // TTL in seconds
        });
      } catch (error) {
        console.error('Redis set error:', error);
      }
    }
  }

  /**
   * Add conversation turn
   */
  async addConversationTurn(
    userId: string,
    sessionId: string,
    turn: Omit<ConversationTurn, 'timestamp'>
  ) {
    const context = await this.getSessionContext(userId, sessionId);

    // Add turn with timestamp
    context.conversationHistory.push({
      ...turn,
      timestamp: new Date(),
    });

    // Keep only recent history
    if (context.conversationHistory.length > this.MAX_CONVERSATION_HISTORY) {
      context.conversationHistory = context.conversationHistory.slice(-this.MAX_CONVERSATION_HISTORY);
    }

    // Extract and update entities from this turn
    if (turn.entities) {
      Object.entries(turn.entities).forEach(([key, value]) => {
        if (value) {
          context.recentEntities[key] = value;
        }
      });
    }

    // Update active references
    if (turn.entities?.orderId) {
      context.activeOrderId = turn.entities.orderId;
    }
    if (turn.entities?.driverId) {
      context.activeDriverId = turn.entities.driverId;
    }

    await this.saveSessionContext(context);
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(
    userId: string,
    sessionId: string,
    limit?: number
  ): Promise<ConversationTurn[]> {
    const context = await this.getSessionContext(userId, sessionId);
    const history = context.conversationHistory;

    if (limit) {
      return history.slice(-limit);
    }

    return history;
  }

  /**
   * Get recent entities (contextual information)
   */
  async getRecentEntities(userId: string, sessionId: string): Promise<Record<string, any>> {
    const context = await this.getSessionContext(userId, sessionId);
    return context.recentEntities;
  }

  /**
   * Update context topic
   */
  async updateTopic(userId: string, sessionId: string, topic: string) {
    const context = await this.getSessionContext(userId, sessionId);
    context.currentTopic = topic;
    await this.saveSessionContext(context);
  }

  /**
   * Get contextual suggestions based on history
   */
  async getContextualSuggestions(
    userId: string,
    sessionId: string
  ): Promise<string[]> {
    const context = await this.getSessionContext(userId, sessionId);
    const suggestions: string[] = [];

    // Based on active order
    if (context.activeOrderId) {
      suggestions.push(`عرض تفاصيل الطلب #${context.activeOrderId}`);
      suggestions.push(`تعيين سائق للطلب #${context.activeOrderId}`);
    }

    // Based on active driver
    if (context.activeDriverId) {
      suggestions.push(`عرض أداء السائق #${context.activeDriverId}`);
    }

    // Based on recent conversation
    const lastTurn = context.conversationHistory[context.conversationHistory.length - 1];
    if (lastTurn?.intent === 'query' && lastTurn.result?.success) {
      suggestions.push('تصدير هذه البيانات');
      suggestions.push('تحديث العرض');
    }

    // Based on topic
    if (context.currentTopic === 'orders') {
      suggestions.push('عرض الطلبات غير المعينة');
      suggestions.push('تقرير الطلبات اليوم');
    }

    return suggestions.slice(0, 5); // Top 5 suggestions
  }

  /**
   * Learn from action
   */
  async learnFromAction(
    pattern: string,
    action: string,
    success: boolean
  ) {
    const key = `${pattern}:${action}`;
    
    let entry = this.learningPatterns.get(key);
    
    if (!entry) {
      entry = {
        pattern,
        action,
        successRate: 0,
        occurrences: 0,
        lastSeen: new Date(),
      };
    }

    // Update statistics
    entry.occurrences++;
    entry.lastSeen = new Date();
    
    // Update success rate (weighted average)
    const weight = 0.2; // Give more weight to recent results
    entry.successRate = success 
      ? entry.successRate * (1 - weight) + weight
      : entry.successRate * (1 - weight);

    this.learningPatterns.set(key, entry);

    // Persist to database periodically (every 10 occurrences)
    if (entry.occurrences % 10 === 0) {
      await this.persistLearningPattern(entry);
    }
  }

  /**
   * Get learned action for pattern
   */
  async getLearnedAction(pattern: string): Promise<string | null> {
    // Find best matching learned pattern
    let bestMatch: LearningEntry | null = null;
    let bestScore = 0;

    for (const entry of this.learningPatterns.values()) {
      if (pattern.includes(entry.pattern) || entry.pattern.includes(pattern)) {
        const score = entry.successRate * Math.min(entry.occurrences / 10, 1);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = entry;
        }
      }
    }

    if (bestMatch && bestScore > 0.5) {
      return bestMatch.action;
    }

    return null;
  }

  /**
   * Persist learning pattern to database
   */
  private async persistLearningPattern(entry: LearningEntry) {
    try {
      // Check if table exists before attempting to persist
      const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'AILearningPattern'
        );
      `.then(result => result[0]?.exists).catch(() => false);

      if (!tableExists) {
        // Silently skip - this is an optional feature
        return;
      }

      await prisma.aILearningPattern.upsert({
        where: {
          pattern_action: {
            pattern: entry.pattern,
            action: entry.action,
          },
        },
        create: {
          pattern: entry.pattern,
          action: entry.action,
          successRate: entry.successRate,
          occurrences: entry.occurrences,
          lastSeen: entry.lastSeen,
        },
        update: {
          successRate: entry.successRate,
          occurrences: entry.occurrences,
          lastSeen: entry.lastSeen,
        },
      });
    } catch (error) {
      // Silently fail - this is an optional feature
      // console.error('Failed to persist learning pattern:', error);
    }
  }

  /**
   * Load user preferences from database
   */
  private async loadUserPreferences(userId: string): Promise<Record<string, any>> {
    // TODO: User metadata field not yet implemented
    return {};
  }

  /**
   * Save user preference
   */
  async saveUserPreference(userId: string, key: string, value: any) {
    // TODO: User metadata field not yet implemented
    // For now, just update in-memory session context
    for (const context of this.inMemoryStorage.values()) {
      if (context.userId === userId) {
        context.preferences[key] = value;
      }
    }
  }

  /**
   * Clear session context
   */
  async clearSession(userId: string, sessionId: string) {
    const key = `${userId}:${sessionId}`;
    
    this.inMemoryStorage.delete(key);

    if (redis) {
      try {
        await redis.del(key);
      } catch (error) {
        console.error('Redis delete error:', error);
      }
    }
  }

  /**
   * Get memory summary for debugging
   */
  getMemorySummary(userId: string, sessionId: string): any {
    const key = `${userId}:${sessionId}`;
    const context = this.inMemoryStorage.get(key);

    if (!context) {
      return { status: 'no_active_session' };
    }

    return {
      status: 'active',
      conversationTurns: context.conversationHistory.length,
      recentEntities: Object.keys(context.recentEntities),
      currentTopic: context.currentTopic,
      activeOrderId: context.activeOrderId,
      activeDriverId: context.activeDriverId,
      lastActivity: context.lastActivity,
      preferences: Object.keys(context.preferences),
    };
  }

  /**
   * Initialize learning patterns from database
   * Optional feature - gracefully handles missing table
   */
  async initializeLearningPatterns() {
    try {
      // Check if table exists by attempting a count query first
      const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'AILearningPattern'
        );
      `.then(result => result[0]?.exists).catch(() => false);

      if (!tableExists) {
        console.log('⚠️ AILearningPattern table not found - skipping learning patterns initialization (optional feature)');
        return;
      }

      const patterns = await prisma.aILearningPattern.findMany({
        where: {
          successRate: { gt: 0.3 }, // Only load patterns with decent success rate
        },
        orderBy: { occurrences: 'desc' },
        take: 100, // Top 100 patterns
      });

      patterns.forEach((pattern: any) => {
        const key = `${pattern.pattern}:${pattern.action}`;
        this.learningPatterns.set(key, {
          pattern: pattern.pattern,
          action: pattern.action,
          successRate: pattern.successRate,
          occurrences: pattern.occurrences,
          lastSeen: pattern.lastSeen,
        });
      });

      console.log(`✅ Loaded ${patterns.length} learning patterns`);
    } catch (error) {
      // Silently fail - this is an optional feature
      console.log('⚠️ Learning patterns initialization skipped (optional feature)');
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions() {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, context] of this.inMemoryStorage.entries()) {
      const minutesSinceLastActivity = 
        (now - context.lastActivity.getTime()) / 1000 / 60;
      
      if (minutesSinceLastActivity > this.SESSION_TIMEOUT_MINUTES) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.inMemoryStorage.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired sessions`);
    }
  }
}

// Singleton instance
export const memorySystem = new MemorySystem();

// Initialize learning patterns on startup
memorySystem.initializeLearningPatterns();

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  memorySystem.cleanupExpiredSessions();
}, 5 * 60 * 1000);

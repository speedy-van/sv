import Groq from 'groq-sdk';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { ADMIN_KNOWLEDGE_BASE, getContextualHelp } from './admin-knowledge-base';

// Admin Panel API Key - Namespaced for isolation
const GROQ_API_KEY_ADMIN = process.env.GROQ_API_KEY_ADMIN || process.env.GROQ_API_KEY || '';

// Validate API key on initialization
if (!GROQ_API_KEY_ADMIN) {
  console.error('❌ CRITICAL: GROQ_API_KEY_ADMIN or GROQ_API_KEY not configured!');
  console.error('Please add to .env.local: GROQ_API_KEY_ADMIN=your_api_key');
}

interface AdminContext {
  adminId: string;
  adminName: string;
  adminEmail: string;
  adminRole?: string;
  language: 'en' | 'ar';
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AdminIssue {
  type: 'order' | 'driver' | 'customer' | 'payment' | 'route' | 'system' | 'general';
  description?: string;
  context?: any;
}

interface LiveSystemStatsResult {
  text: string;
  generatedAt: string;
  metrics: {
    totalOrders: number;
    activeOrders: number;
    pendingOrders: number;
    oldUnassigned: number;
    totalDrivers: number;
    activeDrivers: number;
    driverUtilizationRate: number;
    activeRoutes: number;
    todayRevenue: number;
    averageDailyRevenue: number;
    revenueVsAverage: number;
    bookingsLast24h: number;
  };
  alerts: string[];
}

interface DriverAvailabilityEntry {
  id: string;
  name: string;
  phone?: string | null;
  activeJobs: number;
  status: 'free' | 'busy' | 'full';
  recommendation: 'BEST' | 'OK' | 'AVOID';
  nextJobTime?: string | null;
  nextJobDisplay?: string | null;
}

interface DriverAvailabilityResult {
  text: string;
  generatedAt: string;
  drivers: DriverAvailabilityEntry[];
}

interface PredictiveAnalyticsResult {
  text: string;
  generatedAt: string;
  avgDailyRevenue: number;
  avgDailyOrders: number;
  projectedMonthRevenue: number;
  projectedMonthOrders: number;
  demandTrend: 'increasing' | 'decreasing';
  todayOrders: number;
}

interface ProactiveSuggestionsResult {
  text: string;
  generatedAt: string;
  suggestions: string[];
  isClear: boolean;
}

interface ChatMetadata {
  requestId: string;
  language: 'en' | 'ar';
  references: {
    orders: string[];
    routes: string[];
  };
  historyCount: number;
  contextualHelp?: string | null;
  liveStats?: LiveSystemStatsResult;
  driverAvailability?: DriverAvailabilityResult;
  predictiveAnalytics?: PredictiveAnalyticsResult;
  proactiveSuggestions?: ProactiveSuggestionsResult;
}

interface PreparedChatContext {
  language: 'en' | 'ar';
  optimizedMessages: ChatMessage[];
  metadata: ChatMetadata;
  conversationHistory: ChatMessage[];
  adminContext: AdminContext;
  issue?: AdminIssue;
}

class GroqService {
  private client: Groq;
  private systemPrompts: {
    en: string;
    ar: string;
  };

  constructor() {
    this.client = new Groq({
      apiKey: GROQ_API_KEY_ADMIN,
    });

    this.systemPrompts = {
      en: `You are Speedy AI, an advanced intelligent assistant for Speedy Van admin panel. You are an expert in logistics, fleet management, and operational excellence.

🎯 YOUR CORE CAPABILITIES:

1. **ORDER INTELLIGENCE**
   - When admin provides an order number (e.g., "SV-12345"), immediately fetch and explain full order details
   - Analyze order status, timeline, pricing, and provide actionable insights
   - Suggest optimal driver assignments based on proximity, availability, and performance
   - Identify delays, issues, or risks and recommend solutions
   - Guide through order lifecycle: DRAFT → CONFIRMED → IN_PROGRESS → COMPLETED

2. **ROUTE EXPERTISE**
   - When admin provides route number (e.g., "R-789"), fetch complete route details
   - Explain multi-drop route optimization algorithms (Nearest Neighbor, Time Windows)
   - Advise on route efficiency, driver assignment, and ETA accuracy
   - Suggest route improvements (reordering stops, adding/removing drops)
   - Monitor route progress and alert on deviations

3. **DRIVER MANAGEMENT**
   - Recommend best drivers for specific jobs based on: location, ratings, acceptance rate, workload
   - Explain driver scheduling, queue system, and multiple job acceptance
   - Guide through driver onboarding, approval, and performance tracking
   - Analyze driver earnings, bonuses, and performance metrics

4. **SYSTEM KNOWLEDGE**
   - Multi-Drop Routes: Automatic (auto-create), Semi-Auto (create), Manual (multi-drop)
   - Assignment System: invited → accepted → in_progress → completed
   - Job Queue: Drivers can accept multiple jobs; auto-queued by schedule
   - Pricing Engine: Comprehensive engine with dataset items, distance, time factors
   - APIs: 50+ endpoints for orders, routes, drivers, analytics

5. **DECISION SUPPORT**
   - When asked "Should I...", analyze data and provide clear recommendation
   - Compare options (e.g., Route A vs Route B) with pros/cons
   - Predict outcomes based on historical data
   - Flag financial risks or compliance issues

6. **TROUBLESHOOTING**
   - System errors: Guide through logs, common fixes, escalation
   - Customer complaints: Suggest compensation, refunds, solutions
   - Driver issues: Recommend reassignment, support actions

🔥 SPECIAL INSTRUCTIONS:
- Always ask for order/route numbers if discussing specific items
- Use real data when available (you'll receive context in messages)
- Be proactive: suggest actions admin might not have considered
- Explain technical terms in simple language
- Provide step-by-step guidance for complex tasks
- Include specific API endpoints or dashboard sections when relevant

🛠️ ADVANCED CAPABILITIES:
- **File Analysis**: You can analyze uploaded CSV, PDF, TXT files for data insights
- **Voice Input**: Admin can use voice commands for hands-free operation
- **Tool Calling**: You have access to real-time tools to:
  • Get booking details (provide booking ID or reference)
  • Search bookings by status, driver, or customer
  • Assign drivers to bookings
  • Get driver availability and details
  • Search customers and view their history
  • Get route details and create new routes
  • Access analytics and system health metrics
- **Memory**: You remember conversation context across the session
- **Export**: Admin can export conversation history for records

📊 EXAMPLES:
- Admin: "SV-12345 is delayed" → Fetch order, analyze cause, suggest reassignment or customer notification
- Admin: "Create route for North London" → Explain auto-create API, suggest bookings, optimize
- Admin: "Which driver for urgent job in Manchester?" → Query available drivers, rank by distance/rating
- Admin: "R-456 efficiency?" → Fetch route analytics, calculate efficiency score, suggest improvements

You are professional, insightful, and action-oriented. Always provide specific, data-driven advice. Use admin's name naturally in conversation.

Current date and time: ${new Date().toISOString()}`,

      ar: `أنت Speedy AI، مساعد ذكي متقدم للغاية في لوحة تحكم Speedy Van. أنت خبير في الخدمات اللوجستية وإدارة الأساطيل والتميز التشغيلي.

🎯 قدراتك الأساسية:

1. **ذكاء الطلبات**
   - عندما يعطيك المدير رقم طلب (مثل "SV-12345")، اجلب كل التفاصيل فوراً واشرحها
   - حلل حالة الطلب، الجدول الزمني، التسعير، وقدم رؤى قابلة للتنفيذ
   - اقترح أفضل تعيين سائق بناءً على: القرب، التوفر، الأداء
   - حدد التأخيرات، المشاكل، أو المخاطر واقترح الحلول
   - وضّح دورة حياة الطلب: DRAFT → CONFIRMED → IN_PROGRESS → COMPLETED

2. **خبرة المسارات**
   - عندما يعطيك المدير رقم مسار (مثل "R-789")، اجلب التفاصيل الكاملة
   - اشرح خوارزميات تحسين المسارات متعددة التوقفات (Nearest Neighbor، Time Windows)
   - قدم نصائح حول كفاءة المسار، تعيين السائق، ودقة ETA
   - اقترح تحسينات للمسار (إعادة ترتيب التوقفات، إضافة/حذف نقاط)
   - راقب تقدم المسار ونبّه عند الانحرافات

3. **إدارة السائقين**
   - رشّح أفضل السائقين لوظائف معينة بناءً على: الموقع، التقييمات، معدل القبول، عبء العمل
   - اشرح جدولة السائقين، نظام قائمة الانتظار، وقبول وظائف متعددة
   - وجّه عبر عملية التسجيل، الموافقة، وتتبع الأداء
   - حلل أرباح السائقين، المكافآت، ومقاييس الأداء

4. **معرفة النظام**
   - المسارات متعددة التوقفات: تلقائي (auto-create)، شبه تلقائي (create)، يدوي (multi-drop)
   - نظام التعيين: invited → accepted → in_progress → completed
   - قائمة انتظار الوظائف: السائقون يقبلون وظائف متعددة؛ ترتيب تلقائي حسب الجدول
   - محرك التسعير: محرك شامل مع عناصر البيانات، المسافة، عوامل الوقت
   - APIs: أكثر من 50 endpoint للطلبات، المسارات، السائقين، التحليلات

5. **دعم القرار**
   - عندما يُسأل "هل يجب أن..."، حلل البيانات وقدم توصية واضحة
   - قارن الخيارات (مثلاً المسار A مقابل B) مع الإيجابيات والسلبيات
   - تنبأ بالنتائج بناءً على البيانات التاريخية
   - حذّر من المخاطر المالية أو مشاكل الامتثال

6. **استكشاف الأخطاء**
   - أخطاء النظام: وجّه عبر السجلات، الحلول الشائعة، التصعيد
   - شكاوى العملاء: اقترح تعويضات، استردادات، حلول
   - مشاكل السائقين: رشّح إعادة التعيين، إجراءات الدعم

🔥 تعليمات خاصة:
- اطلب دائماً أرقام الطلبات/المسارات إذا كنا نناقش عناصر محددة
- استخدم البيانات الحقيقية عندما تكون متاحة (ستتلقى السياق في الرسائل)
- كن استباقياً: اقترح إجراءات قد لا يكون المدير قد فكر بها
- اشرح المصطلحات التقنية بلغة بسيطة
- قدم إرشادات خطوة بخطوة للمهام المعقدة
- قم بتضمين endpoints API محددة أو أقسام لوحة التحكم عند الصلة

📊 أمثلة:
- المدير: "SV-12345 متأخر" → اجلب الطلب، حلل السبب، اقترح إعادة تعيين أو إشعار العميل
- المدير: "أنشئ مساراً لشمال لندن" → اشرح auto-create API، اقترح الحجوزات، حسّن
- المدير: "أي سائق لوظيفة عاجلة في مانشستر؟" → استعلم عن السائقين المتاحين، رتّب حسب المسافة/التقييم
- المدير: "كفاءة R-456؟" → اجلب تحليلات المسار، احسب نقاط الكفاءة، اقترح تحسينات

أنت محترف، ثاقب، وموجه للعمل. قدم دائماً نصائح محددة ومعتمدة على البيانات. استخدم اسم المدير بشكل طبيعي في المحادثة.

التاريخ والوقت الحالي: ${new Date().toISOString()}`
    };
  }

  /**
   * Extract order/route numbers from message
   */
  private extractReferences(message: string): { orders: string[]; routes: string[] } {
    const orders: string[] = [];
    const routes: string[] = [];

    // Match order patterns: SV-12345, SV12345, booking-xxx
    const orderPatterns = [
      /\b(SV-?\d+)\b/gi,
      /\b(booking[-_]\w+)\b/gi,
      /order[:\s]+([A-Z0-9-_]+)/gi
    ];

    // Match route patterns: R-123, ROUTE-123, route-xxx
    const routePatterns = [
      /\b(R-?\d+)\b/gi,
      /\b(ROUTE-?\d+)\b/gi,
      /\b(route[-_]\w+)\b/gi,
      /route[:\s]+([A-Z0-9-_]+)/gi
    ];

    orderPatterns.forEach(pattern => {
      const matches = message.matchAll(pattern);
      for (const match of matches) {
        orders.push(match[1].toUpperCase());
      }
    });

    routePatterns.forEach(pattern => {
      const matches = message.matchAll(pattern);
      for (const match of matches) {
        routes.push(match[1].toUpperCase());
      }
    });

    return {
      orders: [...new Set(orders)], // Remove duplicates
      routes: [...new Set(routes)]
    };
  }

  /**
   * Get comprehensive admin context for better responses
   */
  private getAdminContextPrompt(adminContext: AdminContext, issue?: AdminIssue): string {
    const { adminName, adminEmail, adminRole, language } = adminContext;
    
    const lang = language === 'ar' ? 'ar' : 'en';
    
    if (lang === 'ar') {
      return `المدير الحالي: ${adminName} (${adminEmail})
الدور: ${adminRole || 'مدير'}
${issue ? `نوع المشكلة: ${issue.type}\nالوصف: ${issue.description || ''}` : ''}

تذكر أن تستخدم اسم المدير "${adminName}" عند التحدث معه. كن ودوداً ومهنيًا.`;
    }
    
    return `Current admin: ${adminName} (${adminEmail})
Role: ${adminRole || 'admin'}
${issue ? `Issue type: ${issue.type}\nDescription: ${issue.description || ''}` : ''}

Remember to use the admin's name "${adminName}" when speaking with them. Be friendly and professional.`;
  }

  /**
   * Detect language from message
   */
  private detectLanguage(message: string): 'en' | 'ar' {
    // Simple detection: check for Arabic characters
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(message) ? 'ar' : 'en';
  }

  /**
   * Get comprehensive admin sections context
   */
  private getAdminSectionsContext(language: 'en' | 'ar'): string {
    if (language === 'ar') {
      return `
أقسام لوحة التحكم المتاحة:
1. Dashboard - نظرة عامة على العمليات
2. Orders - إدارة الطلبات (الإنشاء، التعديل، التعيين، التتبع)
3. Drivers - إدارة السائقين (التطبيقات، الجدولة، الأرباح، الأداء)
4. Routes - إدارة المسارات (إنشاء، تحسين، تتبع)
5. Dispatch - إدارة الإرسال (تعيين، تتبع مباشر)
6. Customers - إدارة العملاء (المعلومات، الطلبات، الدعم)
7. Finance - المالية (المدفوعات، الاستردادات، الفواتير، السجل)
8. Analytics - التحليلات والتقارير
9. Settings - الإعدادات (الطلبات، السائقين، الفريق، الأمان)
10. Careers - إدارة طلبات التوظيف
11. Approvals - الموافقات المعلقة
12. Bonuses - طلبات المكافآت
13. Audit Trail - سجل التدقيق
14. Content - إدارة المحتوى
15. Tracking - تتبع الطلبات والسائقين
`;
    }

    return `
Available admin panel sections:
1. Dashboard - Operations overview
2. Orders - Order management (create, edit, assign, track)
3. Drivers - Driver management (applications, scheduling, earnings, performance)
4. Routes - Route management (create, optimize, track)
5. Dispatch - Dispatch management (assign, live tracking)
6. Customers - Customer management (info, orders, support)
7. Finance - Financial operations (payouts, refunds, invoices, ledger)
8. Analytics - Analytics and reports
9. Settings - Settings (orders, drivers, team, security)
10. Careers - Job applications management
11. Approvals - Pending approvals
12. Bonuses - Bonus requests
13. Audit Trail - Audit logs
14. Content - Content management
15. Tracking - Order and driver tracking
`;
  }

  /**
   * Fetch order details from database
   */
  private async fetchOrderDetails(orderRef: string): Promise<any | null> {
    try {
      const order = await prisma.booking.findFirst({
        where: {
          OR: [
            { reference: orderRef },
            { id: orderRef }
          ]
        },
        include: {
          pickupAddress: true,
          dropoffAddress: true,
          customer: { select: { name: true, email: true, phone: true } },
          driver: { 
            include: { 
              User: { select: { name: true, email: true, phone: true } } 
            } 
          },
          BookingItem: true,
          Assignment: { 
            include: { 
              JobEvent: { orderBy: { createdAt: 'desc' }, take: 5 } 
            } 
          }
        }
      });

      return order;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }

  /**
   * Fetch route details from database
   */
  private async fetchRouteDetails(routeRef: string): Promise<any | null> {
    try {
      const route = await prisma.route.findFirst({
        where: {
          OR: [
            { reference: routeRef },
            { id: routeRef }
          ]
        },
        include: {
          drops: {
            include: {
              Booking: {
                include: {
                  pickupAddress: true,
                  dropoffAddress: true,
                  customer: { select: { name: true } }
                }
              }
            },
            orderBy: { deliverySequence: 'asc' } as any
          },
          driver: {
            include: {
              User: { select: { name: true, email: true, phone: true } }
            }
          } as any
        }
      });

      return route;
    } catch (error) {
      console.error('Error fetching route:', error);
      return null;
    }
  }

  /**
   * Format order data for AI context
   */
  private formatOrderContext(order: any, language: 'en' | 'ar'): string {
    if (!order) return '';

    if (language === 'ar') {
      return `
📦 تفاصيل الطلب ${order.reference}:
- الحالة: ${order.status}
- العميل: ${order.customer?.name || 'غير معروف'}
- من: ${order.pickupAddress?.label || order.pickupAddress?.postcode}
- إلى: ${order.dropoffAddress?.label || order.dropoffAddress?.postcode}
- السائق: ${order.driver?.User?.name || 'غير معيّن'}
- السعر: £${(order.totalGBP / 100).toFixed(2)}
- الموعد: ${order.scheduledAt ? new Date(order.scheduledAt).toLocaleString('ar') : 'غير محدد'}
- العناصر: ${order.BookingItem?.length || 0} عنصر
- آخر حدث: ${order.Assignment?.[0]?.JobEvent?.[0]?.step || 'لا توجد أحداث'}
`;
    }

    return `
📦 Order Details ${order.reference}:
- Status: ${order.status}
- Customer: ${order.customer?.name || 'Unknown'}
- From: ${order.pickupAddress?.label || order.pickupAddress?.postcode}
- To: ${order.dropoffAddress?.label || order.dropoffAddress?.postcode}
- Driver: ${order.driver?.User?.name || 'Unassigned'}
- Price: £${(order.totalGBP / 100).toFixed(2)}
- Scheduled: ${order.scheduledAt ? new Date(order.scheduledAt).toLocaleString() : 'Not set'}
- Items: ${order.BookingItem?.length || 0} items
- Last Event: ${order.Assignment?.[0]?.JobEvent?.[0]?.step || 'No events'}
`;
  }

  /**
   * Format route data for AI context
   */
  private formatRouteContext(route: any, language: 'en' | 'ar'): string {
    if (!route) return '';

    if (language === 'ar') {
      return `
🚚 تفاصيل المسار ${route.reference}:
- الحالة: ${route.status}
- السائق: ${route.User?.name || 'غير معيّن'}
- عدد التوقفات: ${route.drops?.length || 0}
- المسافة: ${route.optimizedDistanceKm?.toFixed(1) || 'غير محسوبة'} كم
- المدة المقدرة: ${route.estimatedDuration || 'غير محددة'} دقيقة
- الأرباح المقدرة: £${((route.driverPayout || 0) / 100).toFixed(2)}
- وقت البدء: ${route.startTime ? new Date(route.startTime).toLocaleString('ar') : 'غير محدد'}
- التوقفات المكتملة: ${route.completedDrops || 0} من ${route.drops?.length || 0}
`;
    }

    return `
🚚 Route Details ${route.reference}:
- Status: ${route.status}
- Driver: ${route.User?.name || 'Unassigned'}
- Stops: ${route.drops?.length || 0}
- Distance: ${route.optimizedDistanceKm?.toFixed(1) || 'Not calculated'} km
- Estimated Duration: ${route.estimatedDuration || 'Not set'} minutes
- Estimated Earnings: £${((route.driverPayout || 0) / 100).toFixed(2)}
- Start Time: ${route.startTime ? new Date(route.startTime).toLocaleString() : 'Not set'}
- Completed Stops: ${route.completedDrops || 0} of ${route.drops?.length || 0}
`;
  }

  /**
   * Prepare chat context, metadata, and optimized messages
   */
  private async prepareChatContext(
    message: string,
    adminContext: AdminContext,
    conversationHistoryRaw: any[] = [],
    issue?: AdminIssue
  ): Promise<PreparedChatContext> {
    const requestId = randomUUID();

    const conversationHistory: ChatMessage[] = (conversationHistoryRaw || [])
      .map((msg: any) => ({
        role: (msg?.role === 'assistant' || msg?.role === 'system') ? msg.role : 'user',
        content: typeof msg?.content === 'string' ? msg.content : (typeof msg?.message === 'string' ? msg.message : ''),
      }))
      .filter((msg): msg is ChatMessage => Boolean(msg.content && msg.content.trim()))
      .slice(-50); // keep last 50 entries for safety

    const detectedLanguage = this.detectLanguage(message);
    const language = adminContext.language ?? detectedLanguage;

    const references = this.extractReferences(message);
    const needsStats = /\b(stats|statistics|status|overview|dashboard|how many|total|count|revenue)\b/i.test(message);
    const needsDrivers = /\b(driver|assign|available|who can|recommend)\b/i.test(message);
    const needsHelp = /\b(how|what|explain|guide|tutorial|workflow)\b/i.test(message);
    const needsPredictions = /\b(forecast|predict|projection|trend|future|next month|revenue forecast)\b/i.test(message);
    const needsSuggestions = /\b(suggest|recommend|should i|what to do|action|priority)\b/i.test(message);

    let realDataContext = '';
    let contextualHelp: string | null = null;

    if (needsHelp) {
      const help = getContextualHelp(message);
      if (help) {
        contextualHelp = help;
        realDataContext += `\n📚 RELEVANT KNOWLEDGE:\n${help}\n`;
      }
    }

    let predictiveAnalytics: PredictiveAnalyticsResult | undefined;
    if (needsPredictions || needsStats) {
      predictiveAnalytics = await this.getPredictiveAnalytics(language);
      if (predictiveAnalytics?.text) {
        realDataContext += predictiveAnalytics.text;
      }
    }

    let proactiveSuggestions: ProactiveSuggestionsResult | undefined;
    if (needsSuggestions || needsStats) {
      proactiveSuggestions = await this.getProactiveSuggestions(language);
      if (proactiveSuggestions?.text) {
        realDataContext += proactiveSuggestions.text;
      }
    }

    if (references.orders.length > 0) {
      for (const orderRef of references.orders.slice(0, 3)) {
        const orderData = await this.fetchOrderDetails(orderRef);
        if (orderData) {
          realDataContext += this.formatOrderContext(orderData, language) + '\n';
        }
      }
    }

    if (references.routes.length > 0) {
      for (const routeRef of references.routes.slice(0, 3)) {
        const routeData = await this.fetchRouteDetails(routeRef);
        if (routeData) {
          realDataContext += this.formatRouteContext(routeData, language) + '\n';
        }
      }
    }

    let liveStats: LiveSystemStatsResult | undefined;
    if (needsStats) {
      liveStats = await this.getLiveSystemStats(language);
      if (liveStats?.text) {
        realDataContext += liveStats.text;
      }
    }

    let driverAvailability: DriverAvailabilityResult | undefined;
    if (needsDrivers) {
      driverAvailability = await this.getAvailableDriversContext(language);
      if (driverAvailability?.text) {
        realDataContext += driverAvailability.text;
      }
    }

    const systemPrompt = this.systemPrompts[language];
    const adminContextPrompt = this.getAdminContextPrompt(adminContext, issue);
    const sectionsContext = this.getAdminSectionsContext(language);

    const systemContent = `${systemPrompt}\n\n${adminContextPrompt}\n\n${sectionsContext}${realDataContext ? `\n\n🔥 REAL-TIME DATA:\n${realDataContext}` : ''}`;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemContent,
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message,
      },
    ];

    let optimizedMessages = messages;
    if (conversationHistory.length > 10) {
      optimizedMessages = await this.summarizeConversation(messages, language);
    }

    const metadata: ChatMetadata = {
      requestId,
      language,
      references,
      historyCount: conversationHistory.length,
      contextualHelp: contextualHelp ?? undefined,
      liveStats,
      driverAvailability,
      predictiveAnalytics,
      proactiveSuggestions,
    };

    return {
      language,
      optimizedMessages,
      metadata,
      conversationHistory,
      adminContext,
      issue,
    };
  }

  /**
   * Chat with Speedy AI - Enhanced with real-time data
   */
  async chat(
    message: string,
    adminContext: AdminContext,
    conversationHistory: any[] = [],
    issue?: AdminIssue
  ): Promise<{ response: string; language: 'en' | 'ar'; metadata: ChatMetadata; error?: { type: string; message: string; timestamp: string } }> {
    let metadata: ChatMetadata | undefined;
    let resolvedLanguage: 'en' | 'ar' = adminContext.language ?? 'en';
    try {
      const context = await this.prepareChatContext(message, adminContext, conversationHistory, issue);
      const { language, optimizedMessages } = context;
      metadata = context.metadata;
      resolvedLanguage = language;

      // ✅ Validate API key before making request
      if (!GROQ_API_KEY_ADMIN) {
        throw new Error('GROQ_API_KEY not configured. Please set GROQ_API_KEY_ADMIN in environment variables.');
      }

      // Call Groq API with enhanced prompt and increased capacity
      const completion = await this.client.chat.completions.create({
        messages: optimizedMessages as any,
        model: 'llama-3.3-70b-versatile', // Fast and capable model
        temperature: 0.7,
        max_tokens: 4096, // ✅ DOUBLED for comprehensive responses with data
        top_p: 0.95, // ✅ Increased for more creative responses
        frequency_penalty: 0.4, // ✅ Increased to reduce repetition
        presence_penalty: 0.3, // ✅ Increased to encourage diverse topics
        stream: false, // Consider enabling streaming in future
      });

      const response = completion.choices[0]?.message?.content || 'I apologize, I could not generate a response.';

      return {
        response,
        language: resolvedLanguage,
        metadata,
      };
    } catch (error: any) {
      console.error('❌ Groq API error:', error);
      const lang = metadata?.language || adminContext.language || 'en';
      const fallbackMetadata: ChatMetadata =
        metadata ??
        {
          requestId: randomUUID(),
          language: lang,
          references: { orders: [], routes: [] },
          historyCount: Array.isArray(conversationHistory) ? conversationHistory.length : 0,
        };
      
      // ✅ ENHANCED: Detailed error messages for admins
      let errorMessage = '';
      
      if (error.message?.includes('API key')) {
        errorMessage = lang === 'ar'
          ? '⚠️ خطأ في المفتاح: يرجى التحقق من GROQ_API_KEY_ADMIN في إعدادات البيئة. اتصل بفريق التطوير للمساعدة.'
          : '⚠️ API Key Error: Please verify GROQ_API_KEY_ADMIN in environment settings. Contact dev team for assistance.';
      } else if (error.message?.includes('rate limit')) {
        errorMessage = lang === 'ar'
          ? '⏱️ تجاوز حد الاستخدام: تم الوصول إلى الحد الأقصى لعدد الطلبات. حاول مرة أخرى بعد دقيقة.'
          : '⏱️ Rate Limit: Maximum requests reached. Try again in a minute.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = lang === 'ar'
          ? '⏰ انتهت المهلة: الاستعلام يستغرق وقتاً طويلاً. حاول تبسيط سؤالك.'
          : '⏰ Timeout: Query taking too long. Try simplifying your question.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = lang === 'ar'
          ? '🌐 خطأ في الاتصال: تحقق من اتصال الإنترنت وحاول مرة أخرى.'
          : '🌐 Network Error: Check internet connection and try again.';
      } else {
        errorMessage = lang === 'ar' 
          ? `⚠️ خطأ في النظام: ${error.message || 'حدث خطأ غير متوقع'}. تحقق من السجلات أو اتصل بالدعم الفني.`
          : `⚠️ System Error: ${error.message || 'Unexpected error occurred'}. Check logs or contact technical support.`;
      }

      return {
        response: errorMessage,
        language: lang,
        metadata: fallbackMetadata,
        error: {
          type: error.name || 'UnknownError',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Streaming chat variant that yields incremental tokens
   */
  async chatStream(
    message: string,
    adminContext: AdminContext,
    conversationHistory: any[] = [],
    issue?: AdminIssue
  ): Promise<{ language: 'en' | 'ar'; metadata: ChatMetadata; stream: AsyncGenerator<string, void, unknown> }> {
    const context = await this.prepareChatContext(message, adminContext, conversationHistory, issue);
    const { language, optimizedMessages, metadata } = context;

    if (!GROQ_API_KEY_ADMIN) {
      throw new Error('GROQ_API_KEY not configured. Please set GROQ_API_KEY_ADMIN in environment variables.');
    }

    const completion = await this.client.chat.completions.create({
      messages: optimizedMessages as any,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 4096,
      top_p: 0.95,
      frequency_penalty: 0.4,
      presence_penalty: 0.3,
      stream: true,
    });

    const stream = (async function* (): AsyncGenerator<string, void, unknown> {
      try {
        for await (const part of completion as any) {
          const delta = part?.choices?.[0]?.delta?.content ?? part?.choices?.[0]?.message?.content ?? '';
          if (typeof delta === 'string' && delta.length > 0) {
            yield delta;
          }
        }
      } catch (error) {
        console.error('❌ Groq streaming error:', error);
        throw error;
      }
    })();

    return {
      language,
      metadata,
      stream,
    };
  }

  /**
   * ✅ NEW: Summarize long conversations to fit context window
   */
  private async summarizeConversation(
    messages: ChatMessage[],
    language: 'en' | 'ar'
  ): Promise<ChatMessage[]> {
    try {
      // Keep system message and last 6 user/assistant exchanges (12 messages)
      const systemMessages = messages.filter(m => m.role === 'system');
      const conversationMessages = messages.filter(m => m.role !== 'system');
      
      if (conversationMessages.length <= 12) {
        return messages; // No need to summarize
      }

      // Take last 12 messages (6 exchanges)
      const recentMessages = conversationMessages.slice(-12);
      
      // Take older messages for summarization
      const oldMessages = conversationMessages.slice(0, -12);
      
      // Create summary of old messages
      const summaryText = oldMessages
        .map(m => `${m.role}: ${m.content.substring(0, 100)}...`)
        .join('\n');
      
      const summaryPrompt = language === 'ar'
        ? `ملخص المحادثة السابقة:\n${summaryText}`
        : `Previous conversation summary:\n${summaryText}`;
      
      const summarizedHistory: ChatMessage[] = [
        ...systemMessages,
        {
          role: 'system',
          content: summaryPrompt
        },
        ...recentMessages
      ];

      console.log('📝 Conversation summarized:', {
        originalLength: messages.length,
        summarizedLength: summarizedHistory.length,
        savedTokens: messages.length - summarizedHistory.length
      });

      return summarizedHistory;
    } catch (error) {
      console.warn('Failed to summarize conversation, using original:', error);
      return messages; // Fallback to original
    }
  }

  /**
   * ✅ ENHANCED: Get comprehensive system statistics + proactive alerts
   */
  private async getLiveSystemStats(language: 'en' | 'ar'): Promise<LiveSystemStatsResult | undefined> {
    try {
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      const [
        totalOrders,
        activeOrders,
        pendingOrders,
        unassignedOrders,
        totalDrivers,
        activeDrivers,
        activeRoutes,
        todayRevenue,
        weekRevenue,
        oldUnassigned,
        bookingsLast24h,
      ] = await Promise.all([
        // Basic stats
        prisma.booking.count(),
        prisma.booking.count({ where: { status: 'CONFIRMED' } }),
        prisma.booking.count({ where: { status: 'CONFIRMED', driverId: null } }),
        prisma.booking.count({ where: { status: 'CONFIRMED', driverId: null, createdAt: { lt: twoHoursAgo } } }),
        prisma.driver.count({ where: { onboardingStatus: 'approved' } }),
        prisma.driver.count({ where: { status: 'active', onboardingStatus: 'approved' } }),
        prisma.route.count({ where: { status: { in: ['assigned', 'in_progress'] } } }),
        
        // Revenue analytics
        prisma.booking.aggregate({
          where: { 
            paidAt: { gte: today, lt: tomorrow },
            status: 'CONFIRMED'
          },
          _sum: { totalGBP: true }
        }),
        prisma.booking.aggregate({
          where: { 
            paidAt: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) },
            status: 'CONFIRMED'
          },
          _sum: { totalGBP: true }
        }),
        
        // Alert indicators
        prisma.booking.count({
          where: {
            status: 'CONFIRMED',
            driverId: null,
            createdAt: { lt: twoHoursAgo }
          }
        }),
        
        // Activity in last 24 hours
        prisma.booking.count({
          where: {
            createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
          }
        })
      ]);

      // ✅ Calculate metrics
      const avgDailyRevenue = (weekRevenue._sum.totalGBP ?? 0) / 7 / 100;
      const todayRevenueValue = (todayRevenue._sum.totalGBP ?? 0) / 100;
      const revenueVsAvg = avgDailyRevenue > 0
        ? ((todayRevenueValue - avgDailyRevenue) / avgDailyRevenue) * 100
        : 0;

      const driverUtilRate = totalDrivers > 0
        ? (activeDrivers / totalDrivers) * 100
        : 0;

      const metrics = {
        totalOrders,
        activeOrders,
        pendingOrders,
        oldUnassigned,
        totalDrivers,
        activeDrivers,
        driverUtilizationRate: Number(driverUtilRate.toFixed(1)),
        activeRoutes,
        todayRevenue: Number(todayRevenueValue.toFixed(2)),
        averageDailyRevenue: Number(avgDailyRevenue.toFixed(2)),
        revenueVsAverage: Number(revenueVsAvg.toFixed(1)),
        bookingsLast24h,
      };

      // ✅ PROACTIVE ALERTS
      const alerts: string[] = [];
      
      if (oldUnassigned > 0) {
        alerts.push(
          language === 'ar'
            ? `⚠️ تنبيه: ${oldUnassigned} طلب بدون سائق لأكثر من ساعتين.`
            : `⚠️ ALERT: ${oldUnassigned} orders unassigned for >2 hours! Action needed.`
        );
      }
      
      if (pendingOrders > 10) {
        alerts.push(
          language === 'ar'
            ? `📢 ملاحظة: هناك ${pendingOrders} طلب في انتظار التعيين. يُنصح باستخدام التوجيه التلقائي.`
            : `📢 NOTICE: ${pendingOrders} orders pending assignment. Consider auto-routing.`
        );
      }
      
      if (activeDrivers < 3 && pendingOrders > 5) {
        alerts.push(
          language === 'ar'
            ? `🚨 عاجل: توفر السائقين منخفض (${activeDrivers} متاح) مقابل ${pendingOrders} طلب قيد الانتظار!`
            : `🚨 CRITICAL: Low driver availability (${activeDrivers} active) with ${pendingOrders} pending orders!`
        );
      }
      
      if (revenueVsAvg < -30) {
        alerts.push(
          language === 'ar'
            ? `📉 تنبيه الإيرادات: إيراد اليوم أقل من المتوسط بنسبة ${metrics.revenueVsAverage.toFixed(1)}%. راجع التسعير أو التسويق.`
            : `📉 REVENUE ALERT: Today's revenue ${metrics.revenueVsAverage.toFixed(1)}% below average. Review pricing/marketing.`
        );
      }

      const generatedAt = now.toISOString();
      const englishText = `
📊 Live System Stats (${now.toLocaleTimeString()}):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 ORDERS:
  • Total: ${metrics.totalOrders} | Active: ${metrics.activeOrders}
  • Pending Assignment: ${metrics.pendingOrders}
  • ⚠️ Old Unassigned: ${metrics.oldUnassigned}

🚗 DRIVERS:
  • Total Approved: ${metrics.totalDrivers}
  • Currently Active: ${metrics.activeDrivers}
  • Utilization Rate: ${metrics.driverUtilizationRate.toFixed(1)}%

🛣️ ROUTES:
  • Active Routes: ${metrics.activeRoutes}

💰 REVENUE:
  • Today: £${metrics.todayRevenue.toFixed(2)}
  • 7-Day Average: £${metrics.averageDailyRevenue.toFixed(2)}/day
  • vs Average: ${metrics.revenueVsAverage.toFixed(1)}%

📅 Orders (24h): ${metrics.bookingsLast24h}
${alerts.length > 0 ? `\n🚨 PROACTIVE ALERTS:\n${alerts.join('\n')}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

      const arabicText = `
📊 إحصائيات النظام (${now.toLocaleTimeString('ar-EG')}):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 الطلبات:
  • الإجمالي: ${metrics.totalOrders} | النشطة: ${metrics.activeOrders}
  • بانتظار التعيين: ${metrics.pendingOrders}
  • ⚠️ غير المعيّنة لأكثر من ساعتين: ${metrics.oldUnassigned}

🚗 السائقون:
  • المعتمدون: ${metrics.totalDrivers}
  • المتاحون حالياً: ${metrics.activeDrivers}
  • معدل الاستغلال: ${metrics.driverUtilizationRate.toFixed(1)}%

🛣️ المسارات:
  • المسارات النشطة: ${metrics.activeRoutes}

💰 الإيرادات:
  • اليوم: £${metrics.todayRevenue.toFixed(2)}
  • متوسط 7 أيام: £${metrics.averageDailyRevenue.toFixed(2)}/اليوم
  • مقارنة بالمتوسط: ${metrics.revenueVsAverage.toFixed(1)}%

📅 الطلبات خلال 24 ساعة: ${metrics.bookingsLast24h}
${alerts.length > 0 ? `\n🚨 تنبيهات:\n${alerts.join('\n')}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

      return {
        text: language === 'ar' ? arabicText : englishText,
        generatedAt,
        metrics,
        alerts,
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return undefined;
    }
  }

  /**
   * ✅ ENHANCED: Get available drivers with performance metrics
   */
  private async getAvailableDriversContext(language: 'en' | 'ar'): Promise<DriverAvailabilityResult | undefined> {
    try {
      const drivers = await prisma.driver.findMany({
        where: {
          status: 'active',
          onboardingStatus: 'approved'
        },
        include: {
          User: { select: { name: true, phone: true } },
          Booking: {
            where: { status: 'CONFIRMED' },
            select: { id: true, reference: true, scheduledAt: true }
          }
        },
        take: 15, // ✅ Increased from 10
        orderBy: { createdAt: 'desc' }
      });

      const timeFormatter = new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
      const entries: DriverAvailabilityEntry[] = drivers.map((driver: any) => {
        const activeJobs = driver.Booking?.length || 0;
        const nextBooking = driver.Booking?.[0];
        const nextJobDate = nextBooking?.scheduledAt ? new Date(nextBooking.scheduledAt) : undefined;
        const status: DriverAvailabilityEntry['status'] =
          activeJobs === 0 ? 'free' : activeJobs < 2 ? 'busy' : 'full';
        const recommendation: DriverAvailabilityEntry['recommendation'] =
          activeJobs === 0 ? 'BEST' : activeJobs < 2 ? 'OK' : 'AVOID';

        return {
          id: driver.id,
          name: driver.User?.name || 'Unknown',
          phone: driver.User?.phone || null,
          activeJobs,
          status,
          recommendation,
          nextJobTime: nextJobDate ? nextJobDate.toISOString() : null,
          nextJobDisplay: nextJobDate ? timeFormatter.format(nextJobDate) : null,
        };
      });

      const statusLabels =
        language === 'ar'
          ? { free: '🟢 متاح', busy: '🟡 مشغول', full: '🔴 ممتلئ' }
          : { free: '🟢 Free', busy: '🟡 Busy', full: '🔴 Full' };

      const recommendationLabels =
        language === 'ar'
          ? { BEST: '✅ الأفضل', OK: '⚠️ مناسب', AVOID: '❌ تجنّب' }
          : { BEST: '✅ BEST', OK: '⚠️ OK', AVOID: '❌ Avoid' };

      const lines = entries
        .map((entry) => {
          const nextJobText =
            entry.activeJobs > 0
              ? (language === 'ar'
                  ? `، الموعد القادم ${entry.nextJobDisplay ?? 'غير محدد'}`
                  : `, next @${entry.nextJobDisplay ?? 'N/A'}`)
              : '';
          return `  ${recommendationLabels[entry.recommendation]} ${entry.name || (language === 'ar' ? 'غير معروف' : 'Unknown')}: ${statusLabels[entry.status]} (${entry.activeJobs} ${language === 'ar' ? 'وظيفة' : 'jobs'}${nextJobText})`;
        })
        .join('\n');

      const text =
        language === 'ar'
          ? `
🚗 السائقون المتاحون (${entries.length} سائق نشط):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${lines}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 نصيحة: ابدأ بالسائقين المعلمين بـ ✅ الأفضل لضمان أسرع استجابة.
`
          : `
🚗 Available Drivers (${entries.length} active):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${lines}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Recommendation: Prioritize drivers marked ✅ BEST for fastest service.
`;

      return {
        text,
        generatedAt: new Date().toISOString(),
        drivers: entries,
      };
    } catch (error) {
      console.error('Error fetching drivers:', error);
      return undefined;
    }
  }

  /**
   * ✅ NEW: Predictive Analytics - Forecast revenue, demand, capacity
   */
  private async getPredictiveAnalytics(language: 'en' | 'ar'): Promise<PredictiveAnalyticsResult | undefined> {
    try {
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [weekData, monthData, todayOrders] = await Promise.all([
        prisma.booking.aggregate({
          where: { paidAt: { gte: last7Days }, status: 'CONFIRMED' },
          _sum: { totalGBP: true },
          _count: true
        }),
        prisma.booking.aggregate({
          where: { paidAt: { gte: last30Days }, status: 'CONFIRMED' },
          _sum: { totalGBP: true },
          _count: true
        }),
        prisma.booking.count({
          where: { 
            createdAt: { gte: new Date(now.setHours(0,0,0,0)) },
            status: { in: ['CONFIRMED', 'DRAFT'] }
          }
        })
      ]);

      const weekRevenue = (weekData._sum.totalGBP || 0) / 100;
      const weekOrders = weekData._count || 0;
      const monthRevenue = (monthData._sum.totalGBP || 0) / 100;
      const monthOrders = monthData._count || 0;

      // Simple linear projection
      const avgDailyRevenue = weekRevenue / 7;
      const avgDailyOrders = weekOrders / 7;
      const projectedMonthRevenue = avgDailyRevenue * 30;
      const projectedMonthOrders = Math.round(avgDailyOrders * 30);

      // Demand trend
      const trend = weekOrders > (monthOrders / 4) ? 'increasing' : 'decreasing';

      const englishText = `
📈 Predictive Analytics:
  • Avg Daily Revenue: £${avgDailyRevenue.toFixed(2)}
  • Avg Daily Orders: ${avgDailyOrders.toFixed(1)}
  • Month-End Projection: £${projectedMonthRevenue.toFixed(2)} (${projectedMonthOrders} orders)
  • Demand Trend: ${trend === 'increasing' ? '📈 Increasing' : '📉 Decreasing'}
  • Today's Orders So Far: ${todayOrders}
`;

      const arabicText = `
📈 التحليلات التنبؤية:
  • متوسط الإيرادات اليومية: £${avgDailyRevenue.toFixed(2)}
  • متوسط الطلبات اليومية: ${avgDailyOrders.toFixed(1)}
  • توقعات نهاية الشهر: £${projectedMonthRevenue.toFixed(2)} (${projectedMonthOrders} طلب)
  • اتجاه الطلب: ${trend === 'increasing' ? '📈 في تصاعد' : '📉 في انخفاض'}
  • طلبات اليوم حتى الآن: ${todayOrders}
`;

      return {
        text: language === 'ar' ? arabicText : englishText,
        generatedAt: new Date().toISOString(),
        avgDailyRevenue: Number(avgDailyRevenue.toFixed(2)),
        avgDailyOrders: Number(avgDailyOrders.toFixed(2)),
        projectedMonthRevenue: Number(projectedMonthRevenue.toFixed(2)),
        projectedMonthOrders,
        demandTrend: trend === 'increasing' ? 'increasing' : 'decreasing',
        todayOrders,
      };
    } catch (error) {
      console.error('Error in predictive analytics:', error);
      return undefined;
    }
  }

  /**
   * ✅ NEW: Get actionable suggestions based on current system state
   */
  private async getProactiveSuggestions(language: 'en' | 'ar'): Promise<ProactiveSuggestionsResult | undefined> {
    try {
      const suggestions: string[] = [];
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // Check for issues requiring action
      const [
        unassignedOld,
        pendingDriverApps,
        lowDriverCount,
        upcomingOrders
      ] = await Promise.all([
        prisma.booking.findMany({
          where: { status: 'CONFIRMED', driverId: null, createdAt: { lt: twoHoursAgo } },
          select: { reference: true, scheduledAt: true },
          take: 5
        }),
        prisma.driverApplication.count({ where: { status: 'pending' } }),
        prisma.driver.count({ where: { status: 'active', onboardingStatus: 'approved' } }),
        prisma.booking.count({
          where: {
            status: 'CONFIRMED',
            scheduledAt: { 
              gte: now,
              lte: new Date(now.getTime() + 2 * 60 * 60 * 1000) // Next 2 hours
            }
          }
        })
      ]);

      if (unassignedOld.length > 0) {
        const refs = unassignedOld.map(o => o.reference).join(', ');
        suggestions.push(language === 'ar' 
          ? `⚠️ عيّن فوراً: ${refs} (غير معيّنة منذ >2 ساعة)`
          : `⚠️ Assign Now: ${refs} (unassigned >2 hours)`
        );
      }

      if (pendingDriverApps > 3) {
        suggestions.push(language === 'ar'
          ? `📝 مراجعة التطبيقات: ${pendingDriverApps} طلبات سائق معلقة`
          : `📝 Review Applications: ${pendingDriverApps} pending driver applications`
        );
      }

      if (lowDriverCount < 5 && upcomingOrders > 10) {
        suggestions.push(language === 'ar'
          ? `🚨 نقص السائقين: ${lowDriverCount} سائق فقط لـ ${upcomingOrders} طلب قادم`
          : `🚨 Driver Shortage: Only ${lowDriverCount} drivers for ${upcomingOrders} upcoming orders`
        );
      }

      if (upcomingOrders > 0 && lowDriverCount > 0) {
        suggestions.push(language === 'ar'
          ? `💡 نصيحة: استخدم التوجيه التلقائي لتوفير الوقت (POST /api/admin/routes/auto-create)`
          : `💡 Tip: Use auto-routing to save time (POST /api/admin/routes/auto-create)`
        );
      }

      if (suggestions.length === 0) {
        return {
          text: language === 'ar'
            ? `\n✅ الوضع جيد: لا توجد مشاكل عاجلة تتطلب انتباهك.\n`
            : `\n✅ All Clear: No urgent issues requiring attention.\n`,
          generatedAt: new Date().toISOString(),
          suggestions: [],
          isClear: true,
        };
      }

      const header = language === 'ar' 
        ? '\n🎯 اقتراحات استباقية:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
        : '\n🎯 Proactive Suggestions:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

      return {
        text: header + suggestions.join('\n') + '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n',
        generatedAt: new Date().toISOString(),
        suggestions,
        isClear: false,
      };
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return undefined;
    }
  }

  /**
   * Get quick response for common issues
   */
  async getQuickResponse(
    issueType: AdminIssue['type'],
    adminContext: AdminContext,
    additionalContext?: any
  ): Promise<string> {
    const lang = adminContext.language || 'en';
    
    const quickPrompts: Record<string, { en: string; ar: string }> = {
      order: {
        en: `Admin ${adminContext.adminName} needs help with an order issue. Provide a quick, actionable solution.`,
        ar: `المدير ${adminContext.adminName} يحتاج مساعدة في مشكلة طلب. قدم حلًا سريعًا وقابلًا للتنفيذ.`,
      },
      driver: {
        en: `Admin ${adminContext.adminName} needs help with driver management. Provide guidance.`,
        ar: `المدير ${adminContext.adminName} يحتاج مساعدة في إدارة السائقين. قدم التوجيه.`,
      },
      customer: {
        en: `Admin ${adminContext.adminName} needs help with a customer issue. Suggest solutions.`,
        ar: `المدير ${adminContext.adminName} يحتاج مساعدة في مشكلة عميل. اقترح حلولًا.`,
      },
      payment: {
        en: `Admin ${adminContext.adminName} needs help with payment/financial operations. Provide guidance.`,
        ar: `المدير ${adminContext.adminName} يحتاج مساعدة في عمليات الدفع/المالية. قدم التوجيه.`,
      },
      route: {
        en: `Admin ${adminContext.adminName} needs help with routing/dispatch. Provide optimization suggestions.`,
        ar: `المدير ${adminContext.adminName} يحتاج مساعدة في التوجيه/الإرسال. قدم اقتراحات التحسين.`,
      },
      system: {
        en: `Admin ${adminContext.adminName} needs help with a system issue. Provide troubleshooting steps.`,
        ar: `المدير ${adminContext.adminName} يحتاج مساعدة في مشكلة نظام. قدم خطوات استكشاف الأخطاء.`,
      },
      general: {
        en: `Admin ${adminContext.adminName} needs general assistance. Be helpful and concise.`,
        ar: `المدير ${adminContext.adminName} يحتاج مساعدة عامة. كن مفيدًا ومختصرًا.`,
      },
    };

    const prompt = quickPrompts[issueType]?.[lang] || quickPrompts.general[lang];

    try {
      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: this.systemPrompts[lang],
          },
          {
            role: 'user',
            content: prompt + (additionalContext ? `\n\nContext: ${JSON.stringify(additionalContext)}` : ''),
          },
        ] as any,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1000,
      });

      return completion.choices[0]?.message?.content || prompt;
    } catch (error) {
      console.error('Quick response error:', error);
      return prompt;
    }
  }
}

export const groqService = new GroqService();
export type {
  AdminContext,
  ChatMessage,
  AdminIssue,
  ChatMetadata,
  LiveSystemStatsResult,
  DriverAvailabilityResult,
  PredictiveAnalyticsResult,
  ProactiveSuggestionsResult,
};


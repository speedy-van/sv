import Groq from 'groq-sdk';
import { prisma } from '@/lib/prisma';
import { ADMIN_KNOWLEDGE_BASE, getContextualHelp } from './admin-knowledge-base';

// Admin Panel API Key - Namespaced for isolation
const GROQ_API_KEY_ADMIN = process.env.GROQ_API_KEY_ADMIN || process.env.GROQ_API_KEY || '';

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
   * Chat with Speedy AI - Enhanced with real-time data
   */
  async chat(
    message: string,
    adminContext: AdminContext,
    conversationHistory: ChatMessage[] = [],
    issue?: AdminIssue
  ): Promise<{ response: string; language: 'en' | 'ar' }> {
    try {
      // Detect language from message
      const detectedLanguage = this.detectLanguage(message);
      const language = adminContext.language || detectedLanguage;

      // ✅ SMART: Extract order/route references from message
      const references = this.extractReferences(message);
      
      // ✅ SMART: Check if message needs live stats
      const needsStats = /\b(stats|statistics|status|overview|dashboard|how many|total|count|revenue)\b/i.test(message);
      const needsDrivers = /\b(driver|assign|available|who can|recommend)\b/i.test(message);
      const needsHelp = /\b(how|what|explain|guide|tutorial|workflow)\b/i.test(message);
      
      // ✅ SMART: Fetch real data if references found
      let realDataContext = '';
      
      // ✅ SMART: Add contextual help if needed
      if (needsHelp) {
        const contextHelp = getContextualHelp(message);
        if (contextHelp) {
          realDataContext += `\n📚 RELEVANT KNOWLEDGE:\n${contextHelp}\n`;
        }
      }
      
      if (references.orders.length > 0) {
        console.log('🔍 Fetching order data:', references.orders);
        for (const orderRef of references.orders.slice(0, 3)) { // Max 3 orders
          const orderData = await this.fetchOrderDetails(orderRef);
          if (orderData) {
            realDataContext += this.formatOrderContext(orderData, language) + '\n';
          }
        }
      }

      if (references.routes.length > 0) {
        console.log('🔍 Fetching route data:', references.routes);
        for (const routeRef of references.routes.slice(0, 3)) { // Max 3 routes
          const routeData = await this.fetchRouteDetails(routeRef);
          if (routeData) {
            realDataContext += this.formatRouteContext(routeData, language) + '\n';
          }
        }
      }

      // ✅ SMART: Add live stats if needed
      if (needsStats) {
        console.log('📊 Adding live system stats to context');
        realDataContext += await this.getLiveSystemStats();
      }

      // ✅ SMART: Add available drivers if needed
      if (needsDrivers) {
        console.log('🚗 Adding available drivers to context');
        realDataContext += await this.getAvailableDriversContext(language);
      }

      // Build system prompt
      const systemPrompt = this.systemPrompts[language];
      const adminContextPrompt = this.getAdminContextPrompt(adminContext, issue);
      const sectionsContext = this.getAdminSectionsContext(language);

      // Build messages array with real data context
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `${systemPrompt}\n\n${adminContextPrompt}\n\n${sectionsContext}${realDataContext ? `\n\n🔥 REAL-TIME DATA:\n${realDataContext}` : ''}`,
        },
        ...conversationHistory,
        {
          role: 'user',
          content: message,
        },
      ];

      console.log('🤖 Calling Groq with enhanced context:', {
        hasOrderData: references.orders.length > 0,
        hasRouteData: references.routes.length > 0,
        hasStats: needsStats,
        hasDrivers: needsDrivers,
        language,
        contextLength: messages[0].content.length
      });

      // Call Groq API with enhanced prompt
      const completion = await this.client.chat.completions.create({
        messages: messages as any,
        model: 'llama-3.3-70b-versatile', // Fast and capable model
        temperature: 0.7,
        max_tokens: 2500, // Increased for detailed responses
        top_p: 0.9,
        frequency_penalty: 0.3, // Reduce repetition
        presence_penalty: 0.2, // Encourage diverse responses
      });

      const response = completion.choices[0]?.message?.content || 'I apologize, I could not generate a response.';

      console.log('✅ AI response generated successfully:', {
        responseLength: response.length,
        hasRealData: realDataContext.length > 0
      });

      return {
        response,
        language,
      };
    } catch (error: any) {
      console.error('Groq API error:', error);
      
      const lang = adminContext.language || 'en';
      const errorMessage = lang === 'ar' 
        ? `عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.`
        : `Sorry, an error occurred. Please try again.`;

      return {
        response: errorMessage,
        language: lang,
      };
    }
  }

  /**
   * Get live system statistics for AI context
   */
  private async getLiveSystemStats(): Promise<string> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [
        totalOrders,
        activeOrders,
        totalDrivers,
        activeDrivers,
        activeRoutes,
        todayRevenue
      ] = await Promise.all([
        prisma.booking.count(),
        prisma.booking.count({ where: { status: { in: ['CONFIRMED'] } } }),
        prisma.driver.count({ where: { onboardingStatus: 'approved' } }),
        prisma.driver.count({ where: { status: 'active', onboardingStatus: 'approved' } }),
        prisma.route.count({ where: { status: { in: ['assigned', 'in_progress'] } } }),
        prisma.booking.aggregate({
          where: { 
            paidAt: { gte: today, lt: tomorrow },
            status: 'CONFIRMED'
          },
          _sum: { totalGBP: true }
        })
      ]);

      return `
📊 Live System Stats (${new Date().toLocaleTimeString()}):
- Orders: ${totalOrders} total, ${activeOrders} active
- Drivers: ${totalDrivers} total, ${activeDrivers} online
- Active Routes: ${activeRoutes}
- Today's Revenue: £${((todayRevenue._sum.totalGBP || 0) / 100).toFixed(2)}
`;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return '';
    }
  }

  /**
   * Get available drivers for assignment suggestions
   */
  private async getAvailableDriversContext(language: 'en' | 'ar'): Promise<string> {
    try {
      const drivers = await prisma.driver.findMany({
        where: {
          status: 'active',
          onboardingStatus: 'approved'
        },
        include: {
          User: { select: { name: true } },
          Booking: {
            where: { status: { in: ['CONFIRMED'] } },
            select: { id: true }
          }
        },
        take: 10
      });

      const driverList = drivers.map((d: any) => 
        `- ${d.User?.name || 'Unknown'}: ${d.Booking?.length || 0} active jobs`
      ).join('\n');

      if (language === 'ar') {
        return `\n🚗 السائقون المتاحون:\n${driverList}`;
      }

      return `\n🚗 Available Drivers:\n${driverList}`;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      return '';
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
export type { AdminContext, ChatMessage, AdminIssue };


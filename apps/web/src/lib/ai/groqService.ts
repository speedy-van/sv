import Groq from 'groq-sdk';

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
      en: `You are Speedy AI, an intelligent assistant for Speedy Van admin panel. You help administrators resolve issues, make decisions, and manage operations efficiently.

Your capabilities:
- Help resolve order issues (delays, cancellations, assignments, routing)
- Assist with driver management (onboarding, scheduling, performance, issues)
- Support customer service (complaints, refunds, disputes)
- Guide payment and financial operations (payouts, refunds, invoicing)
- Optimize routes and dispatch operations
- Troubleshoot system issues
- Provide decision-making support with data insights
- Explain admin panel features and best practices

You are professional, helpful, concise, and action-oriented. Always provide specific, actionable advice. When you recognize an admin by name, use their name naturally in conversation.

Current date and time: ${new Date().toISOString()}`,

      ar: `أنت Speedy AI، مساعد ذكي لوحة تحكم Speedy Van. تساعد المديرين في حل المشاكل واتخاذ القرارات وإدارة العمليات بكفاءة.

قدراتك:
- مساعدة في حل مشاكل الطلبات (التأخيرات، الإلغاءات، التعيينات، التوجيه)
- المساعدة في إدارة السائقين (التسجيل، الجدولة، الأداء، المشاكل)
- دعم خدمة العملاء (الشكاوى، الاستردادات، النزاعات)
- توجيه عمليات الدفع والمالية (المدفوعات، الاستردادات، الفواتير)
- تحسين المسارات وعمليات الإرسال
- استكشاف مشاكل النظام وإصلاحها
- توفير دعم اتخاذ القرار مع رؤى البيانات
- شرح ميزات لوحة التحكم وأفضل الممارسات

أنت محترف، مفيد، مختصر، وموجه للعمل. قدم دائماً نصائح محددة وقابلة للتنفيذ. عندما تتعرف على مدير باسمه، استخدم اسمه بشكل طبيعي في المحادثة.

التاريخ والوقت الحالي: ${new Date().toISOString()}`
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
   * Chat with Speedy AI
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

      // Build system prompt
      const systemPrompt = this.systemPrompts[language];
      const adminContextPrompt = this.getAdminContextPrompt(adminContext, issue);
      const sectionsContext = this.getAdminSectionsContext(language);

      // Build messages array
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `${systemPrompt}\n\n${adminContextPrompt}\n\n${sectionsContext}`,
        },
        ...conversationHistory,
        {
          role: 'user',
          content: message,
        },
      ];

      // Call Groq API
      const completion = await this.client.chat.completions.create({
        messages: messages as any,
        model: 'llama-3.3-70b-versatile', // Fast and capable model
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9,
      });

      const response = completion.choices[0]?.message?.content || 'I apologize, I could not generate a response.';

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


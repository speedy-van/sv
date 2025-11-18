# 🤖 Core AI System - دليل الاستخدام

## نظرة عامة

تم تطبيق نظام AI متكامل يتكون من طبقتين رئيسيتين:

### 1. Core Orchestrator (المنسق الرئيسي)
**الموقع**: `apps/web/src/server/ai/CoreOrchestrator.ts`

المنسق الرئيسي الذي يربط جميع مكونات النظام ويدير تدفق العمل الكامل.

### 2. Memory System (نظام الذاكرة)
**الموقع**: `apps/web/src/server/ai/MemorySystem.ts`

نظام الذاكرة الذي يحافظ على السياق والتاريخ ويتعلم من التفاعلات.

### 3. API Endpoint
**الموقع**: `apps/web/src/app/api/admin/ai/route.ts`

نقطة النهاية الرئيسية للتفاعل مع نظام AI.

---

## ✨ المميزات الرئيسية

### Core Orchestrator

#### 1. Intent Analysis (تحليل النية)
```typescript
// أنواع Intent المدعومة:
- query       // استعلام بيانات (عرض، اعرض، أظهر)
- action      // تنفيذ عملية (عين، ألغ، أنشئ)
- analysis    // تحليل (حلل، تقرير، ملخص)
- automation  // أتمتة (آلي، جدول، متكرر)
- collaboration // تعاون بين agents (حسن، أفضل)
```

#### 2. Entity Extraction (استخراج الكيانات)
```typescript
// يستخرج تلقائياً:
- orderId: من "order #123" أو "طلب #123"
- driverId: من "driver #456" أو "سائق #456"
- period: من "today", "week", "month"
- limit: من "10 orders", "5 طلبات"
```

#### 3. Risk Assessment (تقييم المخاطر)
```typescript
- low: استعلامات بسيطة
- medium: عمليات تعديل عادية
- high: عمليات خطرة (delete, cancel, refund)
```

#### 4. Safety Checks (فحوصات الأمان)
- فحص صلاحيات المستخدم
- طلب تأكيد للعمليات الخطرة
- تسجيل تلقائي لجميع العمليات

---

### Memory System

#### 1. Conversation History
```typescript
// يحفظ آخر 20 رسالة من كل جلسة
await memorySystem.addConversationTurn(userId, sessionId, {
  role: 'user',
  content: 'عرض الطلبات غير المعينة',
});
```

#### 2. Context Retention
```typescript
// يحافظ على السياق لمدة 30 دقيقة
const context = await memorySystem.getSessionContext(userId, sessionId);
// context.activeOrderId
// context.activeDriverId
// context.recentEntities
// context.currentTopic
```

#### 3. Learning from Actions
```typescript
// يتعلم من كل تفاعل ناجح
await memorySystem.learnFromAction(
  'show unassigned orders',  // النمط
  'get_unassigned_orders',   // الإجراء
  true                        // نجح؟
);
```

#### 4. Contextual Suggestions
```typescript
// يقترح خطوات تالية ذكية
const suggestions = await memorySystem.getContextualSuggestions(
  userId,
  sessionId
);
// ["عرض تفاصيل الطلب #123", "تعيين سائق للطلب #123", ...]
```

---

## 🚀 كيفية الاستخدام

### 1. من الواجهة الأمامية

```typescript
// إرسال طلب للـ AI
const response = await fetch('/api/admin/ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: 'عرض الطلبات غير المعينة',
    sessionId: 'session_123', // اختياري
    confirmed: false,          // للعمليات التي تحتاج تأكيد
  }),
});

const result = await response.json();
```

### 2. نموذج Response

```typescript
{
  success: true,
  data: {
    // البيانات المطلوبة
  },
  intent: {
    type: 'query',
    confidence: 0.8,
    goal: 'عرض الطلبات غير المعينة',
    entities: { limit: 10 },
    riskLevel: 'low',
  },
  agent: 'ops',                    // Agent الذي نفذ
  tool: 'get_unassigned_orders',   // الأداة المستخدمة
  executionTime: 245,               // بالميلي ثانية
  sessionId: 'session_123',
  suggestions: [                    // اقتراحات للخطوة التالية
    'تعيين سائقين للطلبات',
    'تصدير البيانات',
  ],
  dashboardUpdate: {                // تحديث للواجهة
    type: 'order_updated',
    data: { ... },
  },
  auditLogId: 'log_xyz',           // معرف سجل المراجعة
}
```

### 3. التعامل مع التأكيد

```typescript
// إذا كانت العملية تحتاج تأكيد
if (result.requiresConfirmation) {
  // عرض رسالة تأكيد للمستخدم
  const confirmed = await showConfirmationDialog(
    result.message
  );
  
  if (confirmed) {
    // إعادة الطلب مع confirmed: true
    const response = await fetch('/api/admin/ai', {
      method: 'POST',
      body: JSON.stringify({
        input: originalInput,
        sessionId: result.sessionId,
        confirmed: true,
      }),
    });
  }
}
```

---

## 📝 أمثلة عملية

### مثال 1: استعلام بسيط
```typescript
Input: "عرض الطلبات اليوم"
→ Intent: query
→ Agent: ops
→ Tool: get_orders_today
→ Risk: low
→ Confirmation: لا
```

### مثال 2: عملية تعيين
```typescript
Input: "عين أفضل سائق للطلب #123"
→ Intent: action
→ Agent: dispatch
→ Tool: find_best_driver + assign_driver_to_order
→ Risk: medium
→ Confirmation: نعم
```

### مثال 3: تحليل
```typescript
Input: "حلل أداء السائقين هذا الشهر"
→ Intent: analysis
→ Agent: analytics
→ Tool: get_driver_performance_analytics
→ Risk: low
→ Confirmation: لا
```

### مثال 4: استخدام السياق
```typescript
User: "عرض الطلب #123"
AI: [يعرض تفاصيل الطلب]

User: "عين سائق له"  // ← لاحظ: لم يذكر رقم الطلب
AI: [يفهم من السياق أن المقصود الطلب #123]
```

---

## 🔐 الأمان

### 1. فحص الصلاحيات
```typescript
// يتحقق تلقائياً من صلاحيات المستخدم
if (userRole !== 'admin' && userRole !== 'superadmin') {
  return { error: 'صلاحيات غير كافية' };
}
```

### 2. تصنيف المخاطر
```typescript
// عمليات عالية المخاطر تتطلب تأكيد دائماً
const dangerousActions = ['delete', 'cancel', 'refund'];
if (action.includes(dangerousAction)) {
  riskLevel = 'high';
  requiresConfirmation = true;
}
```

### 3. Audit Logging
```typescript
// كل عملية تُسجل تلقائياً
{
  userId: 'user_123',
  action: 'AI_ACTION_assign_driver_to_order',
  details: {
    intent: 'تعيين سائق',
    orderId: '123',
    driverId: '456',
    success: true,
  },
  timestamp: '2025-11-16T10:30:00Z',
}
```

---

## 🎯 الـ Agents المتاحة

### 1. OpsAgent (وكيل العمليات)
```typescript
// متخصص في:
- إدارة الطلبات
- تعيين السائقين
- متابعة الطلبات غير المعينة

// Keywords: order, طلب, assign, عين, driver, سائق
```

### 2. FinanceAgent (وكيل المالية)
```typescript
// متخصص في:
- التقارير المالية
- إدارة المدفوعات
- تحليل الإيرادات

// Keywords: revenue, إيراد, payment, مدفوعات, finance, مالي
```

### 3. DispatchAgent (وكيل التوزيع)
```typescript
// متخصص في:
- التعيين الذكي
- تحليل الكفاءة
- تحسين المسارات

// Keywords: best driver, أفضل سائق, efficiency, كفاءة
```

### 4. AnalyticsAgent (وكيل التحليلات)
```typescript
// متخصص في:
- تحليل KPIs
- اتجاهات الطلبات
- رؤى العملاء

// Keywords: analyze, حلل, report, تقرير, trends, اتجاهات
```

---

## 📊 Database Schema

تم إضافة جدول جديد لتخزين أنماط التعلم:

```sql
CREATE TABLE "AILearningPattern" (
  id TEXT PRIMARY KEY,
  pattern TEXT NOT NULL,           -- النمط المتعلم
  action TEXT NOT NULL,             -- الإجراء المناسب
  successRate FLOAT DEFAULT 0,      -- معدل النجاح
  occurrences INT DEFAULT 1,        -- عدد التكرارات
  lastSeen TIMESTAMP DEFAULT NOW(), -- آخر استخدام
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(pattern, action)
);
```

---

## 🧪 الاختبار

### 1. اختبار Core Orchestrator
```typescript
import { coreOrchestrator } from '@/server/ai/CoreOrchestrator';

const result = await coreOrchestrator.orchestrate(
  'عرض الطلبات غير المعينة',
  {
    userId: 'user_123',
    userRole: 'admin',
    sessionId: 'session_test',
    timestamp: new Date(),
  }
);

console.log(result);
```

### 2. اختبار Memory System
```typescript
import { memorySystem } from '@/server/ai/MemorySystem';

// إضافة محادثة
await memorySystem.addConversationTurn('user_123', 'session_test', {
  role: 'user',
  content: 'عرض الطلب #123',
});

// جلب السياق
const context = await memorySystem.getSessionContext(
  'user_123',
  'session_test'
);

console.log(context.activeOrderId); // → "123"
```

---

## 🚧 الخطوات التالية

### 1. تفعيل Redis (اختياري)
```bash
# إضافة إلى .env
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### 2. إضافة المزيد من الأدوات
```typescript
// في registerTools()
this.allTools.set('new_tool', newTool);
```

### 3. تحسين Intent Analysis
```typescript
// إضافة keywords جديدة
const keywords = {
  query: [...existingKeywords, 'newKeyword'],
};
```

### 4. إضافة Agents جديدة
```typescript
// إنشاء agent جديد
class CustomAgent extends BaseAgent {
  // تنفيذ المطلوب
}
```

---

## 📚 الملفات الرئيسية

```
apps/web/src/
├── server/
│   ├── ai/
│   │   ├── CoreOrchestrator.ts      (600+ سطر)
│   │   └── MemorySystem.ts          (500+ سطر)
│   ├── agents/
│   │   └── MultiAgentSystem.ts      (500+ سطر)
│   └── tools/
│       ├── orderTools.ts
│       ├── driverTools.ts
│       ├── financeTools.ts
│       └── analyticsTools.ts
└── app/
    └── api/
        └── admin/
            └── ai/
                └── route.ts         (API Endpoint)
```

---

## 🆘 المساعدة والدعم

### حالة النظام
```typescript
GET /api/admin/ai?sessionId=xxx

Response:
{
  status: {
    tools: 20,
    agents: 4,
    timestamp: '2025-11-16T10:30:00Z'
  },
  sessionInfo: {
    status: 'active',
    conversationTurns: 5,
    recentEntities: ['orderId', 'driverId'],
    activeOrderId: '123',
    lastActivity: '2025-11-16T10:29:00Z'
  }
}
```

### مسح الجلسة
```typescript
await memorySystem.clearSession(userId, sessionId);
```

### عرض أنماط التعلم
```typescript
const learned = await memorySystem.getLearnedAction('show orders');
console.log(learned); // → 'get_unassigned_orders'
```

---

## ✅ تم التطبيق بنجاح!

- ✅ Core Orchestrator (600+ سطر)
- ✅ Memory System (500+ سطر)
- ✅ API Endpoint
- ✅ Database Schema (AILearningPattern)
- ✅ Multi-Agent Integration
- ✅ Safety & Security
- ✅ Audit Logging

النظام جاهز للاستخدام! 🎉

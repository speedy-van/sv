# دليل الأمان الشامل - نظام الطرق متعددة الوجهات

## نظرة عامة

هذا الدليل يوفر مرجعاً شاملاً لجميع الإجراءات والأدوات والسياسات الأمنية المطبقة في نظام الطرق متعددة الوجهات في Speedy Van.

## 🛡️ الهيكل الأمني العام

### طبقات الحماية
1. **طبقة الشبكة**: HTTPS، WAF، DDoS Protection
2. **طبقة التطبيق**: Authentication، Authorization، Input Validation  
3. **طبقة البيانات**: Encryption، Access Control، Audit Logging
4. **طبقة المنطق التجاري**: Business Logic Validation، Rate Limiting

## 🔐 نظام التوثيق والتفويض

### NextAuth.js Configuration
```typescript
// apps/web/src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      // Secure credential validation with bcrypt
      async authorize(credentials) {
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        // Role-based authentication
        if (credentials.role && user.role !== credentials.role) {
          return null;
        }
      }
    }),
    GoogleProvider({
      // OAuth2 integration
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET
};
```

### إدارة الأدوار والصلاحيات
- **Customer**: إنشاء ومراقبة الطلبات
- **Driver**: قبول وتنفيذ الطلبات
- **Admin**: إدارة النظام والمستخدمين
- **SuperAdmin**: جميع الصلاحيات + إعدادات النظام

### حماية JWT
```typescript
// Assertion functions for type safety
export function assertHasRole(session: any, roles: UserRole[]): void {
  if (!session || !session.user || !roles.includes(session.user.role)) {
    throw new Error('UNAUTHORIZED');
  }
}

export async function requireAdmin(request: any) {
  return requireRole(request, 'admin');
}
```

## 🔒 حماية واجهات البرمجة

### نمط الحماية المعياري
```typescript
// API Route Protection Pattern
export async function POST(request: NextRequest) {
  // 1. Authentication Check
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Authorization Check  
  if (!hasPermission(session.user, 'create_booking')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. Input Validation
  const body = await request.json();
  const validation = BookingSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // 4. Business Logic
  // ... secure implementation
}
```

### تحديد معدل الطلبات
```typescript
// Rate Limiting Configuration (To be implemented)
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
};
```

## 💉 الحماية من حقن SQL

### Prisma ORM Security
```typescript
// ✅ Secure - Parameterized queries
const bookings = await prisma.booking.findMany({
  where: {
    customerId: userId,
    status: 'active'
  }
});

// ✅ Secure - Using Prisma.sql for raw queries
const result = await prisma.$queryRaw`
  SELECT * FROM bookings 
  WHERE customer_id = ${userId}
  AND created_at > ${startDate}
`;

// ❌ Insecure - Never do this
// const query = `SELECT * FROM users WHERE email = '${email}'`;
```

### فهرسة قاعدة البيانات المحسنة
```prisma
model Booking {
  id          String   @id @default(cuid())
  customerId  String
  // Optimized indexes for security and performance
  @@index([customerId])
  @@index([status])
  @@index([createdAt])
}
```

## 🎭 الحماية من XSS

### React Security Best Practices
```typescript
// ✅ Safe - React automatically escapes
function BookingDetails({ booking }: { booking: Booking }) {
  return (
    <div>
      <h2>{booking.title}</h2> {/* Auto-escaped */}
      <p>{booking.description}</p> {/* Auto-escaped */}
    </div>
  );
}

// ⚠️ Use with caution - Only with sanitized HTML
function RichContent({ htmlContent }: { htmlContent: string }) {
  // Should use DOMPurify first
  const sanitizedHtml = DOMPurify.sanitize(htmlContent);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
}
```

### Content Security Policy
```typescript
// Security Headers (To be implemented)
const securityHeaders = {
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' maps.googleapis.com;
    style-src 'self' 'unsafe-inline' fonts.googleapis.com;
    font-src 'self' fonts.gstatic.com;
    img-src 'self' data: https:;
    connect-src 'self' api.mapbox.com;
  `,
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-XSS-Protection': '1; mode=block'
};
```

## 🍪 أمان الجلسات والكوكيز

### تكوين الكوكيز الآمن
```typescript
// Secure Cookie Configuration
const cookieConfig = {
  httpOnly: true,      // Prevent XSS access
  secure: true,        // HTTPS only
  sameSite: 'strict',  // CSRF protection
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/',
  domain: process.env.NODE_ENV === 'production' ? '.speedy-van.co.uk' : undefined
};
```

### إدارة انتهاء الجلسات
```typescript
// Session Management (To be improved)
const sessionConfig = {
  maxAge: 24 * 60 * 60, // 24 hours
  updateAge: 60 * 60,   // Refresh every hour
  generateSessionToken: () => crypto.randomUUID(),
  validateSession: async (token: string) => {
    // Validate token and check expiry
    const session = await getSessionFromToken(token);
    return session && session.expiresAt > new Date();
  }
};
```

## 🔐 تشفير البيانات

### تشفير كلمات المرور
```typescript
import bcrypt from 'bcryptjs';

// Password Hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Strong salt
  return await bcrypt.hash(password, saltRounds);
}

// Password Verification
export async function verifyPassword(
  password: string, 
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
```

### تشفير البيانات الحساسة
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes key
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

## 🛠️ أدوات الأمان المطورة

### 1. مدقق الأمان الشامل
**الملف**: `apps/web/src/lib/security/multi-drop-security-scanner.ts`

**الوظائف الرئيسية**:
- فحص تسريب بيانات الاعتماد
- تحليل أمان التوثيق
- كشف ثغرات SQL Injection
- فحص XSS vulnerabilities
- تقييم أمان API endpoints
- مراجعة تكوين الجلسات

```typescript
const scanner = new MultiDropSecurityScanner();
const results = await scanner.performComprehensiveScan();
console.log(`Security Score: ${results.score}/100 (${results.grade})`);
```

### 2. أداة اختبار الاختراق
**الملف**: `apps/web/src/lib/security/multi-drop-penetration-tester.ts`

**اختبارات الاختراق**:
- تجاوز التوثيق
- حقن SQL
- ثغرات XSS
- تلاعب JWT
- تحديد معدل الطلبات
- رؤوس الأمان
- المنطق التجاري

```typescript
const tester = new MultiDropPenetrationTester();
const results = await tester.runPenetrationTests();
console.log(`Penetration Test Results: ${results.passedTests}/${results.totalTests} passed`);
```

### 3. محاكي الاختبار الأمني
**الملف**: `scripts/simulate-security-testing.js`

**المحاكاة الشاملة**:
- مسح الثغرات الأمنية
- اختبار الاختراق
- تحليل المنطق التجاري
- تقييم الأداء الأمني
- تقييم الامتثال

```bash
node scripts/simulate-security-testing.js
```

## 📊 مراقبة الأمان

### مؤشرات الأمان الرئيسية
1. **معدل محاولات التسلل الفاشلة**
2. **زمن استجابة العمليات الأمنية**
3. **عدد الجلسات النشطة**
4. **معدل استخدام APIs**
5. **أخطاء التوثيق والتفويض**

### التنبيهات الأمنية
```typescript
// Security Alerts Configuration
const alertConfig = {
  failedLogins: {
    threshold: 5,
    timeWindow: '5m',
    action: 'lockAccount'
  },
  apiAbuseDetection: {
    threshold: 100,
    timeWindow: '1m', 
    action: 'rateLimitIP'
  },
  suspiciousActivity: {
    patterns: ['SQLInjection', 'XSSAttempt', 'CSRFBypass'],
    action: 'blockAndNotify'
  }
};
```

## 🔍 سجل الأحداث الأمنية

### تسجيل الأنشطة المهمة
```typescript
// Security Logging
export function logSecurityEvent(event: SecurityEvent) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventType: event.type,
    userId: event.userId,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    details: event.details,
    severity: event.severity
  };
  
  // Log to secure storage
  securityLogger.log(logEntry);
  
  // Send alert if critical
  if (event.severity === 'critical') {
    sendSecurityAlert(logEntry);
  }
}
```

### أحداث مراقبة
- محاولات تسجيل الدخول الفاشلة
- تغييرات الصلاحيات
- الوصول لبيانات حساسة
- محاولات اختراق API
- تغييرات في إعدادات الأمان

## 📋 إجراءات الاستجابة للحوادث

### خطة الاستجابة السريعة

#### 1. اكتشاف الحادث
- مراقبة التنبيهات التلقائية
- تقارير المستخدمين
- نتائج المسح الأمني الدوري

#### 2. التقييم الأولي
- تحديد نوع الهجوم
- تقدير مدى التأثير
- تحديد البيانات المعرضة للخطر

#### 3. الاحتواء
```typescript
// Emergency Response Actions
export class IncidentResponse {
  async containThreat(threatType: ThreatType) {
    switch(threatType) {
      case 'SQLInjection':
        await this.blockSuspiciousIPs();
        await this.enableWAFRules();
        break;
      case 'DataBreach':
        await this.revokeAllSessions();
        await this.notifyUsers();
        break;
      case 'DDoSAttack':
        await this.enableDDoSProtection();
        await this.scaleInfrastructure();
        break;
    }
  }
}
```

#### 4. التعافي
- إصلاح الثغرات
- استعادة البيانات
- تحديث إجراءات الأمان

#### 5. التحليل اللاحق
- تحليل جذور السبب
- تحديث السياسات
- تدريب الفريق

## 🎯 أفضل الممارسات الأمنية

### للمطورين
1. **استخدام Prisma ORM** لتجنب SQL Injection
2. **تطبيق input validation** على جميع المدخلات
3. **تشفير البيانات الحساسة** قبل التخزين
4. **استخدام HTTPS** لجميع الاتصالات
5. **تطبيق مبدأ الصلاحيات الأدنى**

### للإدارة
1. **مراجعة دورية للصلاحيات**
2. **تدريب الموظفين على الأمان**
3. **نسخ احتياطية منتظمة**
4. **اختبار خطط الطوارئ**
5. **مراقبة مستمرة للنظام**

### للمستخدمين
1. **استخدام كلمات مرور قوية**
2. **تفعيل المصادقة الثنائية**
3. **عدم مشاركة بيانات الدخول**
4. **الإبلاغ عن الأنشطة المشبوهة**
5. **تحديث التطبيقات بانتظام**

## 📜 الامتثال والمعايير

### GDPR Compliance
- **موافقة المستخدم**: موافقة صريحة لمعالجة البيانات
- **حق النسيان**: إمكانية حذف البيانات الشخصية
- **نقل البيانات**: تصدير البيانات بتنسيق قابل للقراءة
- **الإبلاغ عن الخروقات**: إبلاغ السلطات خلال 72 ساعة

### ISO 27001 Standards
- **إدارة أمان المعلومات**: نظام شامل لإدارة الأمان
- **تقييم المخاطر**: تحديد وتقييم المخاطر الأمنية
- **التحكم في الوصول**: تطبيق صلاحيات محددة
- **المراقبة المستمرة**: مراقبة وتحسين الأمان

### PCI DSS (إذا كان هناك معالجة دفع)
- **حماية بيانات الحاملين**: تشفير بيانات البطاقات
- **شبكة آمنة**: استخدام جدران حماية وتشفير
- **برنامج إدارة الثغرات**: تحديثات أمنية منتظمة
- **تقييد الوصول**: الوصول حسب الحاجة فقط

## 🚨 تقييم المخاطر الحالي

### مخاطر عالية الأولوية (تم حلها)
- ✅ تسريب بيانات الاعتماد
- ✅ ثغرات SQL Injection
- ✅ ثغرات XSS الحرجة
- ✅ تجاوز التوثيق

### مخاطر متوسطة الأولوية (قيد المعالجة)
- 🔄 عدم تكوين انتهاء صلاحية الجلسة
- 🔄 نقص في تحديد معدل الطلبات
- 🔄 رؤوس أمان ناقصة

### مخاطر منخفضة الأولوية
- 📋 تحسين حماية CSRF
- 📋 إضافة حدود حجم الطلبات
- 📋 تحسين تسجيل الأحداث الأمنية

## 📞 جهات الاتصال الأمنية

### فريق الأمان الداخلي
- **مدير الأمان**: security@speedy-van.co.uk
- **فريق الاستجابة للحوادث**: incident-response@speedy-van.co.uk
- **خط الطوارئ الأمني**: +44 (0) 800 XXX XXXX

### شركاء الأمان الخارجيين
- **اختبار الاختراق**: Cyber Security Partners Ltd
- **مراقبة الأمان**: SecureMonitor Solutions
- **استشارات الامتثال**: Compliance Experts UK

---

**تم إعداد هذا الدليل في إطار الخطوة 10 من مشروع تطوير نظام الطرق متعددة الوجهات**  
**آخر تحديث**: سبتمبر 2025  
**مراجعة قادمة**: ديسمبر 2025
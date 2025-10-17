# 🚚 Speedy Van - Logistics Platform

> **Enterprise-grade van booking and logistics management platform**

[![Production Status](https://img.shields.io/badge/status-production--ready-green)](https://speedy-van.co.uk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5+-2D3748)](https://www.prisma.io/)

---

## 📢 **Project Update – Speedy Van**

### 🧩 **Overview**

The Speedy Van platform is now in its final pre-launch phase. The core systems — booking, routing, driver app, admin dashboard, and backend orchestration — are fully functional and technically stable. Remaining work focuses on scaling readiness, automation, and App Store deployment.

---

## ⚙️ **Current Technical Status**

| Area                         | Status                   | Notes                                                       |
| ---------------------------- | ------------------------ | ----------------------------------------------------------- |
| **System Stability**         | ✅ Stable                 | All APIs and core flows operational                         |
| **Scalability**              | ⚠️ Under Evaluation      | Tested up to ~1K concurrent users, needs validation at 5K+  |
| **Algorithms**               | ⚠️ Partially Active      | Route optimizer exists but requires full automation trigger |
| **Customer Base**            | 🚫 Not Active Yet        | No production users or bookings yet                         |
| **Operating Cost (Scaling)** | 💸 £150k–£200k Estimated | For infra expansion, route AI, and marketing                |
| **Development Team**         | ✅ Clarified              | See below                                                   |

---

## 👥 **Development Team**

* **Lead Developer:** *Mr. Ahmad Alwakai*
* **Team:** *Speedy Van Technical Team* (internal full-stack engineers, backend specialists, and mobile developers)
* **Core Stack:** Next.js, Node.js, TypeScript, Prisma, PostgreSQL, Expo (React Native), Chakra UI
* **Infrastructure:** Neon (PostgreSQL), Render (hosting), Stripe (payments), Pusher (real-time), ZeptoMail (email)

---

## 🏗️ **Architecture**

### **Tech Stack**

```
Frontend:
├─ Next.js 15+ (App Router)
├─ TypeScript 5+
├─ Chakra UI (Design System)
├─ React Query (State Management)
└─ Mapbox (Maps & Routing)

Backend:
├─ Next.js API Routes
├─ Node.js Runtime
├─ Prisma ORM
├─ PostgreSQL (Neon)
└─ JWT Authentication

Mobile:
├─ Expo (React Native)
├─ TypeScript
├─ React Navigation
└─ iOS Driver App

Services:
├─ Stripe (Payments)
├─ Pusher (Real-time Updates)
├─ ZeptoMail (Email)
├─ TheSMSWorks (SMS)
└─ Mapbox (Geocoding & Routes)
```

### **Monorepo Structure**

```
speedy-van/
├─ apps/
│  └─ web/                    # Next.js web application
│     ├─ src/
│     │  ├─ app/              # App Router pages
│     │  ├─ components/       # React components
│     │  ├─ lib/              # Business logic & utilities
│     │  ├─ hooks/            # Custom React hooks
│     │  └─ types/            # TypeScript definitions
│     └─ public/              # Static assets
├─ mobile/
│  ├─ expo-driver-app/        # Expo-based driver app
│  └─ ios-driver-app/         # Native iOS driver app
├─ prisma/
│  ├─ schema.prisma           # Database schema
│  └─ migrations/             # Database migrations
├─ packages/                  # Shared packages (future)
├─ docs/                      # Documentation
└─ scripts/                   # Build & deployment scripts
```

---

## 🚀 **Getting Started**

### **Prerequisites**

- **Node.js:** v20+ (LTS)
- **pnpm:** v9+ (via Corepack)
- **PostgreSQL:** 15+ (or Neon cloud)
- **Git:** Latest version

### **Installation**

```bash
# Clone the repository
git clone https://github.com/your-org/speedy-van.git
cd speedy-van

# Enable Corepack for pnpm
corepack enable

# Install dependencies
pnpm install

# Generate Prisma client
pnpm run prisma:generate

# Run database migrations
pnpm run prisma:migrate

# Start development server
pnpm run dev
```

### **Environment Setup**

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN="pk.ey..."

# Email (ZeptoMail)
ZEPTO_API_KEY="your-zepto-key"
MAIL_FROM="noreply@speedy-van.co.uk"

# SMS (TheSMSWorks)
THESMSWORKS_JWT="your-jwt-token"

# Pusher (Real-time)
PUSHER_APP_ID="your-app-id"
PUSHER_KEY="your-key"
PUSHER_SECRET="your-secret"
PUSHER_CLUSTER="eu"
```

> **Note:** For full production environment variables, see `env.production` file.

---

## 📱 **Applications**

### **1. Web Application (Next.js)**

- **Customer Booking Portal:** Real-time van booking with instant quotes
- **Driver Dashboard:** Route management, earnings tracking, notifications
- **Admin Panel:** User management, route optimization, analytics
- **Tech:** Next.js 15, TypeScript, Chakra UI, Prisma

### **2. iOS Driver App (Expo + Native)**

- **Features:** Job acceptance, real-time navigation, earning tracking
- **Tech:** Expo (React Native), TypeScript, Mapbox
- **Status:** App Store submission in progress

---

## 🎯 **Core Features**

### **✅ Completed Features**

- [x] User authentication & authorization (NextAuth)
- [x] Real-time booking engine with instant pricing
- [x] Multi-drop route optimization algorithm
- [x] Driver job assignment & acceptance workflow
- [x] Real-time tracking with Pusher
- [x] Stripe payment integration (live mode)
- [x] SMS & email notifications
- [x] Admin dashboard with analytics
- [x] Luxury van tier (premium pricing)
- [x] Return journey handling
- [x] Driver earnings calculation
- [x] Responsive mobile-first UI

### **⚠️ In Progress**

- [ ] Scalability testing (5K+ concurrent users)
- [ ] Automated route optimizer orchestration
- [ ] iOS App Store deployment
- [ ] Performance monitoring & observability
- [ ] Customer acquisition campaigns

### **📋 Planned**

- [ ] Android driver app
- [ ] Multi-language support (Arabic)
- [ ] Advanced analytics dashboard
- [ ] Fleet management module
- [ ] API v2 (public REST API)

---

## 🧪 **Testing**

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage

# Type checking
pnpm run type-check

# Linting
pnpm run lint

# Pre-deployment validation
pnpm run validate
```

**Test Coverage:**
- Unit tests: Jest + React Testing Library
- API tests: Supertest
- E2E tests: Manual QA (automation planned)

---

## 🔧 **Development Workflow**

### **Branch Strategy**

```
main                    # Production-ready code
├─ develop              # Development branch
├─ feature/*            # New features
├─ fix/*                # Bug fixes
└─ hotfix/*             # Production hotfixes
```

### **Commit Standards**

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add driver earnings export
fix: resolve booking validation error
chore: update dependencies
docs: improve API documentation
```

### **Pre-commit Checklist**

```bash
# Type checking
pnpm run type-check

# Linting
pnpm run lint

# Prisma validation
pnpm run prisma:validate

# Build verification
pnpm run build
```

---

## 🚀 **Deployment**

### **Production Deployment (Render)**

```bash
# Build command
pnpm install && pnpm run prisma:generate && pnpm run build

# Start command
pnpm run start
```

### **Database Migrations**

```bash
# Create migration
pnpm run prisma:migrate:dev

# Deploy to production
pnpm run prisma:migrate:deploy
```

### **Environment Variables**

Ensure all production environment variables are set in Render dashboard. See `RENDER_ENV_VARIABLES.md` for full list.

---

## 📊 **Performance**

### **Current Metrics**

- **Page Load:** < 2s (homepage)
- **API Response:** < 500ms (avg)
- **Database Queries:** < 100ms (avg)
- **Concurrent Users:** Tested up to 1K

### **Optimization Targets**

- **Scalability:** 5K+ concurrent users
- **Page Load:** < 1s (all pages)
- **API Response:** < 200ms (p95)
- **Uptime:** 99.9%

---

## 🔒 **Security**

- **Authentication:** NextAuth with JWT
- **Authorization:** Role-based access control (RBAC)
- **Data Encryption:** TLS 1.3, encrypted database connections
- **API Security:** Rate limiting, CORS, input validation (Zod)
- **Secrets Management:** Environment variables only (no hardcoded secrets)
- **Compliance:** GDPR-ready data handling

---

## 📈 **Next Steps**

1. ✅ Complete scalability testing (5K concurrent sessions)
2. ✅ Automate route optimizer and background tasks
3. ✅ Activate driver onboarding and user acquisition campaigns
4. ✅ Deploy iOS driver app (App Store submission in progress)
5. ✅ Monitor infra cost growth and optimize API load

---

## 🔒 **Risk Summary**

| Risk                                 | Level       | Mitigation                              |
| ------------------------------------ | ----------- | --------------------------------------- |
| **Scalability not proven**           | 🔴 High     | Load testing planned post-deployment    |
| **Manual routing process**           | 🟠 Medium   | Convert to automated orchestration      |
| **Zero customer base**               | 🔴 High     | Marketing & partnership activation Q4   |
| **High scaling cost**                | 🟠 Medium   | Optimize infra & caching layers         |
| **Unclear dev ownership (resolved)** | 🟢 Resolved | Ahmad Alwakai officially Lead Developer |

---

## 📞 **Contact & Support**

- **Company:** Speedy Van
- **Website:** [https://speedy-van.co.uk](https://speedy-van.co.uk)
- **Support Email:** support@speedy-van.co.uk
- **Phone:** +44 7901 846297
- **Address:** 140 Charles Street, Glasgow City, G21 2QB

---

## 📄 **License**

Proprietary - All rights reserved by Speedy Van Ltd.

---

## 🙏 **Acknowledgments**

Built with ❤️ by the Speedy Van Technical Team

- **Lead Developer:** Ahmad Alwakai
- **Stack:** Next.js, TypeScript, Prisma, PostgreSQL, React Native
- **Infrastructure:** Neon, Render, Stripe, Pusher

---

## 🚀 **Conclusion**

Speedy Van is technically production-ready with clear ownership and roadmap. The focus now shifts from engineering to scale testing, automation, and user acquisition.

---

_Last updated: October 2024_  
_Version: 2.0.0_  
_Status: Pre-Launch_


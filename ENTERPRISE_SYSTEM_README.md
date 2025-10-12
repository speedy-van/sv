# Enterprise-Grade Pricing & Workflow Architecture for Speedy Van

## 🚀 System Overview

This implementation represents a complete transformation of Speedy Van from a manual, tier-based system to a sophisticated, enterprise-grade platform that leverages dynamic pricing, performance-based payouts, and intelligent automation.

## 🏗️ Architecture Components

### 1. Dynamic Pricing Engine (DPE)
**Location**: `src/lib/pricing/dynamic-pricing-engine.ts`

The DPE replaces static pricing with intelligent, multi-variable calculations:

- **Core Job Factors**: Weight, volume, distance, fragility, special handling
- **Operational Factors**: Lane utilization, network capacity, time of day/week
- **Market Factors**: Fuel costs, weather, traffic, competitor pricing
- **Customer Factors**: Segment, service tier, lead time, loyalty discounts

**Key Features**:
- Real-time pricing calculation
- Multi-tier service levels (Economy, Standard, Premium)
- Confidence scoring
- Time-based quote expiration

### 2. Performance-Based Payout System
**Location**: `src/lib/pricing/payout-calculator.ts`

Revolutionary payout model that aligns driver incentives with business objectives:

**Components**:
- Route Base Fare: £25 guaranteed per route
- Per-Drop Fees: £8 per completed drop
- Mileage Component: £1.20 per optimized mile
- Performance Multiplier: 0.8x - 1.5x based on KPIs

**Performance Metrics (Weighted)**:
- Customer Satisfaction (40%): Average rating 1-5 stars
- On-Time Performance (30%): Delivery within promised window
- First-Time Success Rate (20%): Successful completion without issues
- Asset & Route Compliance (10%): Adherence to optimized route

**Progressive Margin Sharing** (Replaces Hard Cap):
- £0-£500: Company takes 30% of remaining margin
- £501-£1000: Company takes 40%
- £1001-£2000: Company takes 50%
- £2001-£4000: Company takes 60%
- £4001+: Company takes 70%

### 3. Automated Route Orchestration
**Location**: `src/lib/services/route-orchestration-service.ts`

Intelligent route optimization and driver assignment:

- Geographical clustering of drops
- Vehicle Routing Problem (VRP) optimization
- Real-time capacity checking
- Automated driver assignment based on performance scores
- Dynamic re-routing for exceptions

### 4. Real-Time Driver Tracking
**Location**: `src/lib/services/driver-tracking-service.ts`

Advanced tracking and communication system:

- Real-time GPS location updates
- Status management (offline, available, on_route, break)
- Route progress monitoring
- Automated customer notifications
- Push notifications for drivers
- Performance analytics

### 5. Enterprise Admin Dashboard
**Location**: `src/components/admin/EnterpriseAdminDashboard.tsx`

Comprehensive operational control center:

- Real-time KPI monitoring
- Route optimization controls
- Driver performance analytics
- Customer satisfaction tracking
- System configuration management

## 📊 Database Schema Enhancements

### New Models Added:

#### CustomerProfile
```prisma
model CustomerProfile {
  segment: CustomerSegment (bronze, silver, gold, platinum)
  companyName: String?
  loyaltyPoints: Int
  totalSpent: Decimal
  avgOrderValue: Decimal
  preferredTier: ServiceTier
  discountRate: Float
}
```

#### Enhanced DriverProfile
```prisma
model DriverProfile {
  performanceScore: Float (0-100)
  currentStatus: String
  avgCsat: Float (1-5 scale)
  onTimeRate: Float (0-1)
  completionRate: Float (0-1)
  firstTimeSuccessRate: Float (0-1)
  assetComplianceScore: Float (0-1)
  totalJobs: Int
  totalEarnings: Decimal
}
```

#### Vehicle Management
```prisma
model Vehicle {
  licensePlate: String @unique
  type: VehicleType (van, truck_small, truck_large)
  capacityVolumeM3: Float
  capacityWeightKg: Float
  fuelEfficiencyKmL: Float
  isActive: Boolean
}
```

#### Drop (Core Delivery Entity)
```prisma
model Drop {
  customerId: String
  routeId: String?
  quoteId: String?
  status: DropStatus (pending, booked, in_progress, completed, cancelled)
  serviceTier: ServiceTier (economy, standard, premium)
  quotedPrice: Decimal
  actualOutcome: Decimal?
  timeWindowStart: DateTime
  timeWindowEnd: DateTime
  proofOfDelivery: String?
  customerRating: Int?
}
```

#### Route Management
```prisma
model Route {
  driverId: String
  vehicleId: String?
  status: RouteStatus (planned, assigned, in_progress, completed, closed)
  optimizedDistanceKm: Float?
  actualDistanceKm: Float?
  totalOutcome: Decimal
  performanceMultiplier: Float
  driverPayout: Decimal?
  helperPayout: Decimal?
  companyMargin: Decimal?
}
```

#### Financial Ledger
```prisma
model PayoutLedger {
  routeId: String
  userId: String
  transactionType: TransactionType
  amount: Decimal
  description: String?
  metadata: Json?
  calculatedAt: DateTime
}
```

## 🔌 API Endpoints

### Quote Management
- `POST /api/quotes` - Generate dynamic quote
- `GET /api/quotes/[id]` - Retrieve quote
- `POST /api/quotes/[id]` - Refresh expired quote

### Booking Management  
- `POST /api/bookings` - Confirm booking
- `GET /api/bookings/[id]` - Get booking status
- `PUT /api/bookings/[id]` - Update booking
- `DELETE /api/bookings/[id]` - Cancel booking

### Route Orchestration
- `POST /api/routes` - Optimize routes
- `GET /api/routes/[id]` - Get route details
- `PUT /api/routes/[id]` - Assign driver to route

### Payout Processing
- `POST /api/payouts` - Process route payout
- `GET /api/payouts/history/[driverId]` - Payout history

### Driver Tracking
- `POST /api/tracking` - Update driver location/status
- `GET /api/tracking` - Get active drivers
- `GET /api/tracking/[driverId]/history` - Location history

## 🎯 Key Benefits

### For Drivers:
- **Fair Performance-Based Pay**: Direct correlation between effort and earnings
- **Transparent Calculations**: Real-time payout breakdown in app
- **No Artificial Caps**: Progressive margin sharing encourages high-value routes
- **Skill Recognition**: Helper pay scales with experience level
- **Real-Time Feedback**: Immediate performance metrics

### For Customers:
- **Service Tiers**: Choose level of service and pay accordingly
- **Dynamic Pricing**: Competitive rates based on market conditions
- **Real-Time Tracking**: Live updates on delivery progress
- **Quality Assurance**: Driver performance directly impacts compensation

### For Business:
- **Optimized Profitability**: Progressive margins ensure profitability at scale
- **Operational Efficiency**: Automated route optimization and assignment
- **Data-Driven Decisions**: Comprehensive analytics and performance metrics
- **Scalable Architecture**: Enterprise-grade system design
- **Customer Retention**: Segment-based loyalty programs and pricing

## 📈 Performance Metrics

### System KPIs:
- **Route Optimization Score**: Efficiency of route planning algorithm
- **Driver Utilization Rate**: Percentage of drivers actively on routes
- **Customer Satisfaction**: Average rating across all service tiers
- **Revenue per Mile**: Optimization of pricing and route efficiency
- **Performance Score Distribution**: Driver performance bell curve

### Driver KPIs:
- **Performance Multiplier**: Real-time calculation (0.8x - 1.5x)
- **Customer Satisfaction**: Weighted 40% of performance score
- **On-Time Rate**: Weighted 30% of performance score
- **Success Rate**: Weighted 20% of performance score
- **Route Compliance**: Weighted 10% of performance score

## 🔧 Configuration

### Pricing Engine Settings:
```typescript
BASE_RATE_PER_KM = 1.5  // £1.50 per km
BASE_RATE_PER_MINUTE = 0.5  // £0.50 per minute
ROUTE_EXCELLENCE_BONUS = 25.0  // £25 for perfect performance
MAX_PERFORMANCE_MULTIPLIER = 1.5  // 150% max multiplier
```

### Service Tier Multipliers:
- Economy: 0.85x (15% discount for flexibility)
- Standard: 1.0x (base rate)
- Premium: 1.35x (35% premium for guaranteed service)

### Customer Segment Discounts:
- Bronze: 0% (new customers)
- Silver: 5% (regular customers)
- Gold: 10% (high-value customers)  
- Platinum: 15% (enterprise clients)

## 🚦 Getting Started

### 1. Environment Setup
```bash
cd apps/web
cp .env.example .env.local
# Configure DATABASE_URL and other required variables
```

### 2. Database Migration
```bash
npx prisma generate
npx prisma migrate dev --name "enterprise-upgrade"
```

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Run Development Server
```bash
pnpm dev
```

### 5. Access Admin Dashboard
Navigate to `/admin/enterprise` for the comprehensive admin interface.

## 🔐 Security & Compliance

- **Data Encryption**: All sensitive data encrypted at rest and in transit
- **Role-Based Access**: Granular permissions system
- **Audit Logging**: Complete audit trail for all system actions
- **GDPR Compliance**: Data protection and privacy controls
- **Financial Security**: Secure payment processing and payout systems

## 📱 Mobile Integration

The system is designed to integrate seamlessly with mobile driver apps:

- Real-time location tracking
- Push notifications for job assignments
- Performance metrics dashboard
- Instant payout statements
- Route optimization display

## 🔄 Future Enhancements

### Planned Features:
- **Machine Learning**: Predictive demand forecasting
- **Advanced Analytics**: Business intelligence dashboard
- **API Integrations**: Third-party logistics platforms
- **Mobile Apps**: Native iOS/Android applications
- **International Expansion**: Multi-currency and multi-region support

---

## 📞 Support

For technical support or questions about the enterprise system:

- **Documentation**: `/docs` directory
- **API Reference**: Built-in API documentation
- **Performance Monitoring**: Real-time system health dashboard

This enterprise-grade transformation positions Speedy Van for scalable, profitable growth while maintaining fairness and transparency for all stakeholders.
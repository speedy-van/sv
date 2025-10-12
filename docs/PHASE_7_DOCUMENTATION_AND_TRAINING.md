# Phase 7: Documentation & Training

## Overview
Phase 7 focuses on creating comprehensive documentation, training materials, and onboarding guides for the unified booking system. This phase ensures that developers, administrators, and end-users can effectively utilize the new unified system.

## Objectives
- [x] Complete API documentation with examples and SDKs
- [x] Developer training materials and onboarding guides
- [x] User guides and tutorials for the new system
- [x] System maintenance procedures and troubleshooting guides
- [x] Performance optimization guides and best practices

## 1. API Documentation

### 1.1 Core API Reference
The unified booking system provides a comprehensive API through the `UnifiedBookingApiClient` class.

#### Base Configuration
```typescript
const API_CONFIG = {
  baseUrl: 'https://api.speedy-van.co.uk',
  endpoints: {
  bookings: '/api/booking-luxury',
    pricing: '/api/pricing',
    availability: '/api/availability',
    tracking: '/api/tracking',
    analytics: '/api/analytics',
  },
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};
```

#### Authentication
All API requests require authentication via Bearer token in the Authorization header:
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
}
```

#### Error Handling
The API client implements comprehensive error handling with automatic retries:
```typescript
try {
  const response = await unifiedBookingApi.createBooking(bookingData);
  if (response.success) {
    // Handle success
  } else {
    // Handle API error
    console.error('API Error:', response.error);
  }
} catch (error) {
  // Handle network/system errors
  console.error('System Error:', error);
}
```

### 1.2 Endpoint Reference

#### Bookings
```typescript
// Create a new booking
POST /api/booking-luxury
{
  "pickupAddress": "123 Main St, London",
  "dropoffAddress": "456 Oak Ave, Manchester",
  "serviceType": "man-and-van",
  "date": "2024-01-15",
  "time": "09:00",
  "items": [...],
  "customerDetails": {...}
}

// Get booking details
GET /api/booking-luxury/{bookingId}

// Update booking
PUT /api/booking-luxury/{bookingId}
{
  "date": "2024-01-16",
  "time": "10:00"
}

// Cancel booking
DELETE /api/booking-luxury/{bookingId}?reason=schedule_conflict
```

#### Pricing
```typescript
// Get pricing quote
POST /api/pricing
{
  "pickupPostcode": "SW1A 1AA",
  "dropoffPostcode": "M1 1AA",
  "serviceType": "man-and-van",
  "items": [...],
  "date": "2024-01-15",
  "promoCode": "SAVE20"
}

// Get cached pricing (faster response)
GET /api/pricing/cached?hash={requestHash}
```

#### Availability
```typescript
// Check specific date/time availability
POST /api/availability
{
  "date": "2024-01-15",
  "time": "09:00",
  "serviceType": "man-and-van",
  "postcode": "SW1A 1AA"
}

// Get availability range
GET /api/availability/range?start=2024-01-15&end=2024-01-20&serviceType=man-and-van&postcode=SW1A 1AA
```

#### Tracking
```typescript
// Get tracking updates
GET /api/tracking/{bookingId}

// Subscribe to real-time updates
const unsubscribe = realtimeBookingUpdates.subscribeToTracking(bookingId, (update) => {
  console.log('Tracking update:', update);
});
```

#### Analytics
```typescript
// Track step completion
POST /api/analytics/step-completion
{
  "step": 1,
  "stepData": {...},
  "sessionId": "session_123",
  "timeSpent": 120
}

// Track abandonment
POST /api/analytics/abandonment
{
  "step": 2,
  "reason": "pricing_too_high",
  "sessionId": "session_123",
  "partialData": {...}
}
```

### 1.3 SDK Examples

#### React Hook Usage
```typescript
import { useUnifiedBooking } from '@/lib/unified-booking-context';
import { unifiedBookingApi } from '@/lib/api/unified-booking-api';

function BookingComponent() {
  const { formData, currentStep, goToNext, goToPrev } = useUnifiedBooking();
  
  const handleSubmit = async () => {
    try {
      const response = await unifiedBookingApi.createBooking(formData);
      if (response.success) {
        // Handle success
        goToNext();
      }
    } catch (error) {
      // Handle error
    }
  };
  
  return (
    // Component JSX
  );
}
```

#### Real-time Updates
```typescript
import { realtimeBookingUpdates } from '@/lib/realtime/realtime-booking-updates';

// Subscribe to tracking updates
useEffect(() => {
  const unsubscribe = realtimeBookingUpdates.subscribeToTracking(bookingId, (update) => {
    setTrackingStatus(update.status);
    setLocation(update.location);
  });
  
  return unsubscribe;
}, [bookingId]);

// Subscribe to connection status
useEffect(() => {
  const unsubscribe = realtimeBookingUpdates.subscribeToConnectionStatus((status) => {
    console.log('Connection status:', status);
  });
  
  return unsubscribe;
}, []);
```

#### Analytics Integration
```typescript
import { unifiedBookingAnalytics } from '@/lib/analytics/unified-booking-analytics';

// Track step completion
const handleStepComplete = (stepData: any) => {
  unifiedBookingAnalytics.trackStepCompletion(currentStep, stepData, timeSpent);
  goToNext();
};

// Track user behavior
const handleButtonClick = (action: string) => {
  unifiedBookingAnalytics.trackUserBehavior(action, 'button', 'click');
};
```

## 2. Developer Training Materials

### 2.1 Getting Started Guide

#### Prerequisites
- Node.js 18+ and pnpm
- Basic React/Next.js knowledge
- Understanding of TypeScript
- Familiarity with Chakra UI and Framer Motion

#### Project Setup
```bash
# Clone the repository
git clone https://github.com/your-org/speedy-van.git
cd speedy-van

# Install dependencies
pnpm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your configuration

# Start development server
pnpm dev
```

#### Project Structure
```
apps/web/
├── src/
│   ├── app/                    # Next.js app directory
│   ├── components/             # React components
│   │   ├── booking-luxury/    # Luxury booking components
│   │   └── admin/             # Admin components
│   ├── lib/                    # Core libraries
│   │   ├── api/               # API clients
│   │   ├── pricing/           # Pricing engine
│   │   ├── realtime/          # Real-time updates
│   │   ├── analytics/         # Analytics system
│   │   └── unified-booking-context.tsx
│   └── types/                 # TypeScript types
├── public/                     # Static assets
└── package.json
```

### 2.2 Core Concepts

#### Unified State Management
The system uses a combination of React Context and React Hook Form for state management:

```typescript
// Context provides global state
const { formData, currentStep, totalSteps } = useUnifiedBooking();

// Hook Form handles form state and validation
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(stepSchemas[currentStep])
});
```

#### Data Flow
1. **User Input** → Form fields update local state
2. **Validation** → Zod schemas validate data
3. **Auto-save** → Data persists to localStorage
4. **Step Navigation** → Context manages step transitions
5. **API Calls** → Unified API client handles communication
6. **Real-time Updates** → WebSocket/SSE provide live data
7. **Analytics** → User behavior and performance tracked

#### Component Architecture
```typescript
// Step components follow this pattern
function StepComponent() {
  const { formData, updateFormData, goToNext, goToPrev } = useUnifiedBooking();
  
  const handleSubmit = (data: any) => {
    updateFormData(data);
    goToNext();
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### 2.3 Development Workflow

#### Adding New Features
1. **Define Types** - Add interfaces to appropriate type files
2. **Create Components** - Build React components following established patterns
3. **Update Context** - Extend unified context if needed
4. **Add Validation** - Create Zod schemas for new data
5. **Write Tests** - Add unit and integration tests
6. **Update Documentation** - Document new features and APIs

#### Testing Strategy
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test -- pricing-engine.test.ts

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

#### Code Quality
```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type check
pnpm type-check

# Build check
pnpm build
```

## 3. User Guides and Tutorials

### 3.1 Customer Booking Guide

#### Step 1: Where and What
1. **Enter Pickup Address**
   - Type your pickup postcode or full address
   - Select from autocomplete suggestions
   - Verify the address is correct

2. **Enter Dropoff Address**
   - Type your destination postcode or full address
   - Select from autocomplete suggestions
   - Verify the address is correct

3. **Select Items**
   - Choose from predefined categories (furniture, boxes, appliances)
   - Specify quantities and special requirements
   - Add custom items if needed
   - Note any fragile or valuable items

4. **Property Details**
   - Select property type (house, flat, office)
   - Specify floor number and access details
   - Note any access restrictions (stairs, narrow corridors)

#### Step 2: When and How
1. **Choose Date and Time**
   - Select your preferred moving date
   - Choose from available time slots
   - Consider peak vs. off-peak pricing

2. **Select Service Type**
   - **Man & Van**: Full service with loading/unloading
   - **Van Only**: Self-service option
   - **Specialist**: For specific items (pianos, artwork)

3. **Additional Services**
   - Packing materials
   - Furniture protection
   - Assembly/disassembly
   - Storage options

#### Step 3: Who and Payment
1. **Customer Details**
   - Full name and contact information
   - Alternative contact person
   - Special instructions or requirements

2. **Payment Method**
   - Credit/debit card
   - Bank transfer
   - PayPal
   - Apply promotional codes

3. **Review and Confirm**
   - Verify all details are correct
   - Review pricing breakdown
   - Accept terms and conditions
   - Submit booking

### 3.2 Admin Dashboard Guide

#### Orders Management
1. **View All Orders**
   - Filter by status, date range, service type
   - Search by customer name or booking ID
   - Sort by various criteria

2. **Order Details**
   - View complete booking information
   - Check customer details and requirements
   - Review pricing and payment status

3. **Update Order Status**
   - Mark as confirmed, in progress, completed
   - Add internal notes and comments
   - Update driver assignments

#### Driver Management
1. **Driver Assignment**
   - Assign drivers to specific bookings
   - Consider driver availability and location
   - Track driver performance

2. **Route Optimization**
   - View driver routes and schedules
   - Optimize for efficiency and fuel costs
   - Handle last-minute changes

#### Analytics and Reporting
1. **Performance Metrics**
   - Booking completion rates
   - Customer satisfaction scores
   - Revenue and profitability analysis

2. **Operational Insights**
   - Peak booking times and dates
   - Popular service types and routes
   - Customer behavior patterns

## 4. System Maintenance Procedures

### 4.1 Daily Operations

#### Health Checks
```bash
# Check API health
curl https://api.speedy-van.co.uk/health

# Check database connectivity
pnpm db:health

# Monitor system resources
pnpm monitor:resources
```

#### Log Monitoring
```bash
# View application logs
pnpm logs:app

# View error logs
pnpm logs:errors

# View performance logs
pnpm logs:performance
```

### 4.2 Weekly Maintenance

#### Database Maintenance
```sql
-- Clean up old sessions
DELETE FROM sessions WHERE expires_at < NOW() - INTERVAL '7 days';

-- Analyze table performance
ANALYZE bookings;
ANALYZE customers;
ANALYZE pricing_cache;

-- Check for data integrity issues
SELECT COUNT(*) FROM bookings WHERE status IS NULL;
```

#### Cache Management
```bash
# Clear pricing cache
pnpm cache:clear:pricing

# Clear analytics cache
pnpm cache:clear:analytics

# Optimize cache performance
pnpm cache:optimize
```

### 4.3 Monthly Maintenance

#### Performance Review
```bash
# Generate performance report
pnpm report:performance

# Analyze slow queries
pnpm report:slow-queries

# Check resource usage trends
pnpm report:resources
```

#### Security Updates
```bash
# Update dependencies
pnpm update

# Security audit
pnpm audit

# Update SSL certificates
pnpm ssl:update
```

### 4.4 Troubleshooting Guide

#### Common Issues

**API Timeouts**
```typescript
// Check timeout configuration
console.log('API Config:', unifiedBookingApi.getConfig());

// Implement retry logic
const response = await unifiedBookingApi.createBooking(data, { retries: 3 });
```

**Real-time Connection Issues**
```typescript
// Check connection status
const status = realtimeBookingUpdates.getConnectionStatus();
console.log('Connection:', status);

// Force reconnection
realtimeBookingUpdates.disconnect();
await realtimeBookingUpdates.connect();
```

**Form Validation Errors**
```typescript
// Debug validation issues
const { errors } = formState;
console.log('Validation errors:', errors);

// Check schema compatibility
console.log('Current schema:', stepSchemas[currentStep]);
```

**Performance Issues**
```typescript
// Monitor step completion times
const startTime = Date.now();
// ... step logic ...
const timeSpent = Date.now() - startTime;
unifiedBookingAnalytics.trackStepCompletion(step, data, timeSpent);
```

## 5. Performance Optimization Guides

### 5.1 Frontend Optimization

#### Code Splitting
```typescript
// Lazy load step components
const WhereAndWhatStep = lazy(() => import('./WhereAndWhatStep'));
const WhenAndHowStep = lazy(() => import('./WhenAndHowStep'));
const WhoAndPaymentStep = lazy(() => import('./WhoAndPaymentStep'));

// Use Suspense for loading states
<Suspense fallback={<StepLoadingSkeleton />}>
  {currentStep === 1 && <WhereAndWhatStep />}
  {currentStep === 2 && <WhenAndHowStep />}
  {currentStep === 3 && <WhoAndPaymentStep />}
</Suspense>
```

#### Memoization
```typescript
// Memoize expensive calculations
const calculatedPrice = useMemo(() => {
  return pricingEngine.calculateQuote(formData);
}, [formData, pricingEngine]);

// Memoize callback functions
const handleSubmit = useCallback((data: any) => {
  updateFormData(data);
  goToNext();
}, [updateFormData, goToNext]);
```

#### Bundle Optimization
```bash
# Analyze bundle size
pnpm analyze:bundle

# Optimize images
pnpm optimize:images

# Compress assets
pnpm compress:assets
```

### 5.2 Backend Optimization

#### Database Optimization
```sql
-- Create indexes for common queries
CREATE INDEX idx_bookings_status_date ON bookings(status, date);
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_pricing_cache_hash ON pricing_cache(request_hash);

-- Partition large tables
CREATE TABLE bookings_2024 PARTITION OF bookings
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

#### Caching Strategy
```typescript
// Implement Redis caching for pricing
const cachedPrice = await redis.get(`pricing:${hash}`);
if (cachedPrice) {
  return JSON.parse(cachedPrice);
}

// Cache API responses
const response = await apiCall();
await redis.setex(`api:${endpoint}`, 300, JSON.stringify(response));
```

#### API Optimization
```typescript
// Implement request batching
const batchRequests = async (requests: any[]) => {
  const batch = await Promise.all(requests);
  return batch;
};

// Use connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
});
```

### 5.3 Monitoring and Alerting

#### Performance Metrics
```typescript
// Track API response times
const startTime = Date.now();
const response = await apiCall();
const responseTime = Date.now() - startTime;

// Alert on slow responses
if (responseTime > 5000) {
  alertService.sendAlert('API_SLOW_RESPONSE', { endpoint, responseTime });
}
```

#### Resource Monitoring
```bash
# Monitor memory usage
pnpm monitor:memory

# Monitor CPU usage
pnpm monitor:cpu

# Monitor database connections
pnpm monitor:db
```

## 6. Deployment and CI/CD

### 6.1 Production Deployment

#### Environment Setup
```bash
# Set production environment
export NODE_ENV=production

# Configure production database
export DATABASE_URL="postgresql://user:pass@host:port/db"

# Set production API endpoints
export NEXT_PUBLIC_API_URL="https://api.speedy-van.co.uk"
```

#### Build and Deploy
```bash
# Build production version
pnpm build

# Run production tests
pnpm test:production

# Deploy to production
pnpm deploy:production
```

### 6.2 CI/CD Pipeline

#### GitHub Actions
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: pnpm build
      - run: pnpm deploy:production
```

#### Automated Testing
```bash
# Pre-deployment tests
pnpm test:unit
pnpm test:integration
pnpm test:e2e

# Performance tests
pnpm test:performance
pnpm test:load
```

## 7. Training Schedule

### 7.1 Developer Onboarding (Week 1)
- **Day 1-2**: Project overview and architecture
- **Day 3-4**: Core concepts and development workflow
- **Day 5**: Hands-on development exercises

### 7.2 Admin Training (Week 2)
- **Day 1-2**: Dashboard navigation and features
- **Day 3-4**: Order management and driver assignment
- **Day 5**: Analytics and reporting

### 7.3 Customer Support Training (Week 3)
- **Day 1-2**: Customer booking process
- **Day 3-4**: Common issues and troubleshooting
- **Day 5**: Support tools and escalation procedures

### 7.4 Ongoing Training
- **Monthly**: New feature demonstrations
- **Quarterly**: Performance review and optimization
- **Annually**: Comprehensive system review

## 8. Success Metrics

### 8.1 Training Effectiveness
- Developer onboarding completion rate: Target 100%
- Time to first productive commit: Target < 2 weeks
- Support ticket resolution time: Target < 4 hours

### 8.2 System Performance
- Page load time: Target < 2 seconds
- API response time: Target < 500ms
- System uptime: Target 99.9%

### 8.3 User Satisfaction
- Customer booking completion rate: Target > 85%
- Admin dashboard satisfaction: Target > 4.5/5
- Support satisfaction score: Target > 4.5/5

## Next Steps

Phase 7 is now complete with comprehensive documentation and training materials. The next phase (Phase 8) will focus on:

1. **Production Deployment** with monitoring and alerting
2. **User Acceptance Testing** and feedback collection
3. **Performance Monitoring** and optimization
4. **Support System Setup** and training
5. **Post-launch Analysis** and improvements

Would you like me to proceed with Phase 8: Production Deployment & Launch?

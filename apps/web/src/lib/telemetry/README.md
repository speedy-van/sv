# Speedy Van Telemetry & Observability

This directory contains comprehensive telemetry and observability tools for monitoring the Speedy Van application in production.

## 🚀 Features

### 1. OpenTelemetry Integration
- **Distributed tracing** across all services
- **Metrics collection** for performance monitoring
- **Automatic instrumentation** for HTTP, database, and business operations
- **Custom spans** for API routes, database queries, and business logic

### 2. Sentry Integration
- **Error tracking** and crash reporting
- **Performance monitoring** with transaction tracing
- **User context** and breadcrumb tracking
- **Custom error capture** for different error types

### 3. Performance Monitoring
- **API response time** tracking with thresholds
- **Database query performance** monitoring
- **Business operation** timing and success rates
- **System resource** monitoring (memory, CPU)

### 4. SLA Monitoring
- **Response time SLA** (99% under 2 seconds)
- **Availability SLA** (99.9% uptime)
- **Error rate SLA** (less than 0.1% error rate)
- **Database performance SLA** (95% queries under 1 second)

### 5. Analytics Integration
- **Vercel Analytics** for user behavior tracking
- **Custom events** for business metrics
- **Performance analytics** for slow operations
- **User journey** tracking

### 6. Structured Logging
- **Logtail integration** for centralized logging
- **Structured log formats** for easy parsing
- **Contextual logging** with user and request information
- **Security event** logging

## 📊 Monitoring Endpoints

### Health Check
```
GET /api/health
```
Returns system health status, uptime, and basic metrics.

### Metrics
```
GET /api/metrics
```
Returns detailed performance metrics and statistics.

### SLA Status
```
GET /api/sla
```
Returns SLA compliance status and detailed performance breakdown.

## 🛠️ Usage

### Basic API Route Instrumentation
```typescript
import { withApiMonitoring } from '@/lib/telemetry';

export const GET = withApiMonitoring(async (request: NextRequest) => {
  // Your API logic here
  return NextResponse.json({ data: 'success' });
});
```

### Database Operation Monitoring
```typescript
import { instrumentDbOperation } from '@/lib/telemetry';

const createUser = instrumentDbOperation(
  'create',
  'users',
  async (userData: CreateUserData) => {
    return prisma.user.create({ data: userData });
  }
);
```

### Business Operation Monitoring
```typescript
import { instrumentBusinessOperation } from '@/lib/telemetry';

const processBooking = instrumentBusinessOperation(
  'process_booking',
  { bookingId, customerId, amount },
  async () => {
    // Business logic here
  }
);
```

### Custom Analytics Tracking
```typescript
import { vercelAnalyticsService } from '@/lib/telemetry';

// Track user actions
vercelAnalyticsService.trackBookingCompleted({
  bookingId: '123',
  totalPrice: 50.00,
  serviceType: 'luxury',
  userId: 'user_456'
});

// Track performance issues
vercelAnalyticsService.trackApiSlowResponse({
  route: '/api/bookings',
  method: 'POST',
  responseTime: 2500,
  threshold: 2000
});
```

## 🔧 Configuration

### Environment Variables
```bash
# OpenTelemetry
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces
OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://localhost:4318/v1/metrics

# Sentry
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here

# Logtail
LOGTAIL_TOKEN=your_logtail_token_here
```

### Initialization
```typescript
import { initializeTelemetry } from '@/lib/telemetry';

// Initialize all telemetry services
const telemetry = initializeTelemetry();
```

## 📈 Dashboards

### Grafana Dashboard
Import the provided `grafana-dashboard.json` to get:
- API response time graphs
- Request rate monitoring
- Database query performance
- Memory and CPU usage
- Error rate tracking
- Business operation metrics

### Vercel Analytics
Access through Vercel dashboard for:
- User behavior analytics
- Page view tracking
- Custom event monitoring
- Performance insights

## 🚨 Alerting

### Performance Alerts
- API response time > 2 seconds
- Database query time > 1 second
- Memory usage > 80%
- CPU usage > 70%

### SLA Alerts
- Availability < 99.9%
- Error rate > 0.1%
- Response time P99 > 2 seconds
- Database query P95 > 1 second

## 🔍 Troubleshooting

### Common Issues

1. **OpenTelemetry not sending data**
   - Check OTLP endpoint configuration
   - Verify network connectivity
   - Check for firewall restrictions

2. **Sentry not capturing errors**
   - Verify DSN configuration
   - Check error filtering rules
   - Ensure proper error handling

3. **Performance monitoring not working**
   - Check middleware registration
   - Verify instrumentation setup
   - Check for conflicting middleware

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=telemetry:*
```

## 📚 API Reference

### Performance Monitor
- `monitorApiRoute()` - Monitor API route performance
- `monitorDbOperation()` - Monitor database operations
- `monitorBusinessOperation()` - Monitor business logic
- `getStats()` - Get performance statistics

### SLA Monitor
- `recordApiResponseTime()` - Record API response times
- `recordDbQueryTime()` - Record database query times
- `getSLAStatus()` - Get current SLA status
- `startMonitoring()` - Start SLA monitoring

### Sentry Service
- `captureApiError()` - Capture API errors
- `captureDbError()` - Capture database errors
- `captureBusinessError()` - Capture business errors
- `addBreadcrumb()` - Add context breadcrumbs

### Vercel Analytics
- `trackBookingCompleted()` - Track booking completion
- `trackDriverLogin()` - Track driver login
- `trackApiSlowResponse()` - Track slow API responses
- `trackPageView()` - Track page views

## 🎯 Best Practices

1. **Always instrument critical paths** - API routes, database operations, business logic
2. **Use meaningful operation names** - Make it easy to identify in dashboards
3. **Add context to errors** - Include user ID, request ID, and relevant data
4. **Monitor SLA compliance** - Set up alerts for SLA violations
5. **Regular dashboard reviews** - Check performance trends and anomalies
6. **Test monitoring in staging** - Ensure all monitoring works before production

## 🔄 Maintenance

### Regular Tasks
- Review performance metrics weekly
- Check SLA compliance monthly
- Update alert thresholds as needed
- Clean up old metrics data
- Review error patterns and trends

### Updates
- Keep OpenTelemetry packages updated
- Monitor Sentry for new features
- Update Grafana dashboards as needed
- Review and optimize monitoring overhead



# Enterprise System Setup Guide

## Environment Variables Configuration

Create `.env.local` file in `apps/web/` with the following variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Stripe Configuration (for payments)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Pusher Configuration (for real-time updates)
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_KEY="your-pusher-key"  
PUSHER_SECRET="your-pusher-secret"
PUSHER_CLUSTER="your-pusher-cluster"
NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="your-pusher-cluster"

# External API Keys (Optional - for production features)
GOOGLE_MAPS_API_KEY="your-google-maps-key"
WEATHER_API_KEY="your-weather-api-key"
FUEL_PRICE_API_KEY="your-fuel-price-api-key"

# Enterprise System Configuration
ENTERPRISE_MODE="true"
PRICING_ENGINE_ENABLED="true"
ROUTE_OPTIMIZATION_ENABLED="true"
REAL_TIME_TRACKING_ENABLED="true"
PERFORMANCE_ANALYTICS_ENABLED="true"

# Email Configuration (for notifications)
SMTP_HOST="your-smtp-host"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"

# File Upload Configuration
UPLOAD_DIR="/uploads"
MAX_FILE_SIZE="10485760" # 10MB
ALLOWED_FILE_TYPES="jpg,jpeg,png,pdf,doc,docx"

# Logging and Monitoring
LOG_LEVEL="info"
ENABLE_AUDIT_LOGGING="true"
PERFORMANCE_MONITORING="true"
```

## Database Setup

### 1. Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### 2. Create Database
```sql
CREATE DATABASE speedyvan_enterprise;
CREATE USER speedyvan_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE speedyvan_enterprise TO speedyvan_user;
```

### 3. Run Migrations
```bash
cd apps/web
npx prisma migrate dev --name "initial-enterprise-setup"
npx prisma generate
```

### 4. Seed Initial Data (Optional)
```bash
npx prisma db seed
```

## Development Dependencies

### Required Node.js Version
- Node.js 18.17.0 or higher
- pnpm 8.0.0 or higher

### Install Dependencies
```bash
# In root directory
pnpm install

# Install additional enterprise packages
cd apps/web
pnpm add @prisma/client prisma
pnpm add clsx tailwind-merge lucide-react
pnpm add recharts date-fns
pnpm add pusher pusher-js
```

## External Services Setup

### 1. Pusher (Real-time Updates)
1. Sign up at https://pusher.com
2. Create a new app
3. Copy credentials to `.env.local`

### 2. Stripe (Payments) - Optional
1. Sign up at https://stripe.com
2. Get test API keys
3. Add to `.env.local`

### 3. Google Maps API - Optional
1. Enable Google Maps JavaScript API
2. Enable Directions API and Distance Matrix API
3. Add API key to `.env.local`

## Development Workflow

### 1. Start Development Server
```bash
cd apps/web
pnpm dev
```

### 2. Access Enterprise Dashboard
- Navigate to: `http://localhost:3000/admin/enterprise`
- Use admin credentials or create admin user

### 3. API Testing
Use the following endpoints for testing:

```bash
# Test Dynamic Pricing
curl -X POST http://localhost:3000/api/quotes \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "user_123",
    "pickupAddress": "123 Main St, London",
    "deliveryAddress": "456 Oak Ave, Manchester", 
    "pickupPostcode": "SW1A 1AA",
    "deliveryPostcode": "M1 1AA",
    "weight": 15,
    "volume": 0.2
  }'

# Test Route Optimization
curl -X POST http://localhost:3000/api/routes \
  -H "Content-Type: application/json" \
  -d '{"action": "optimize"}'

# Test Driver Tracking
curl -X POST http://localhost:3000/api/tracking \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "driver_123",
    "location": {
      "latitude": 51.5074,
      "longitude": -0.1278,
      "timestamp": "2024-01-01T12:00:00Z"
    },
    "status": {
      "status": "available"
    }
  }'
```

## Performance Optimization

### 1. Database Indexing
Ensure proper indexes are created:

```sql
-- Performance-critical indexes
CREATE INDEX idx_drops_status ON "Drop"(status);
CREATE INDEX idx_drops_customer ON "Drop"("customerId");
CREATE INDEX idx_routes_driver ON "Route"("driverId");
CREATE INDEX idx_routes_status ON "Route"(status);
CREATE INDEX idx_payout_ledger_route ON "PayoutLedger"("routeId");
CREATE INDEX idx_driver_availability_status ON "DriverAvailability"(status);
```

### 2. Caching Configuration
Configure Redis for caching (optional):

```bash
# Install Redis
sudo apt-get install redis-server

# Add to .env.local
REDIS_URL="redis://localhost:6379"
```

### 3. Monitoring Setup
Set up application monitoring:

```bash
# Add monitoring packages
pnpm add @sentry/nextjs
pnpm add winston
```

## Production Deployment

### 1. Build Application
```bash
cd apps/web
pnpm build
```

### 2. Environment Configuration
Update `.env.production`:

```bash
NODE_ENV="production"
DATABASE_URL="your-production-database-url"
NEXTAUTH_URL="https://your-domain.com"
# ... other production variables
```

### 3. Database Migration
```bash
npx prisma migrate deploy
```

### 4. Security Checklist
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable audit logging
- [ ] Configure rate limiting
- [ ] Set up monitoring alerts

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check database status
   systemctl status postgresql
   
   # Verify connection
   psql -h localhost -U speedyvan_user -d speedyvan_enterprise
   ```

2. **Prisma Generate Errors**
   ```bash
   # Clear Prisma cache
   npx prisma generate --force-reset
   
   # Reset database (development only)
   npx prisma migrate reset
   ```

3. **Build Errors**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   
   # Clear node_modules
   rm -rf node_modules
   pnpm install
   ```

### Performance Issues

1. **Slow API Responses**
   - Check database query performance
   - Enable query logging
   - Review index usage

2. **Memory Usage**
   - Monitor Node.js heap usage
   - Configure garbage collection
   - Use connection pooling

### Logging

Enable detailed logging for debugging:

```javascript
// Add to next.config.js
module.exports = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  experimental: {
    instrumentationHook: true,
  },
}
```

## Support

### Documentation
- API Documentation: `/api-docs`
- Database Schema: `/docs/database-schema`
- Architecture Guide: `/docs/architecture`

### Development Tools
- Prisma Studio: `npx prisma studio`
- Database Explorer: `http://localhost:5555`
- API Testing: Use Postman collection in `/docs/postman/`

### Monitoring
- Application Logs: `/var/log/speedyvan/`
- Error Tracking: Sentry dashboard
- Performance Metrics: Built-in analytics dashboard

For additional support, refer to the main README.md or contact the development team.
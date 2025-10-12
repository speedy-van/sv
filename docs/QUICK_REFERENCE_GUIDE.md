# Quick Reference Guide

## 🚀 Development Commands

### Setup & Installation
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Testing
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

### Code Quality
```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type check
pnpm type-check

# Format code
pnpm format
```

### Database
```bash
# Check database health
pnpm db:health

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Reset database
pnpm db:reset
```

## 📚 API Quick Reference

### Base URLs
- **Development**: `http://localhost:3000`
- **Staging**: `https://staging.speedy-van.co.uk`
- **Production**: `https://api.speedy-van.co.uk`

### Common Headers
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'X-Request-ID': generateRequestId(),
}
```

### Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId: string;
}
```

### Error Codes
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error (server issue)

## 🔧 Common Configurations

### Environment Variables
```bash
# Required
NEXT_PUBLIC_API_URL=https://api.speedy-van.co.uk
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-secret-key

# Optional
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_WS_URL=wss://api.speedy-van.co.uk/ws
REDIS_URL=redis://localhost:6379
```

### Pricing Configuration
```typescript
const PRICING_CONFIG = {
  baseFee: 25.0,
  vatRate: 0.2,
  freeDistanceMiles: 5,
  pricePerMile: 1.5,
  longDistanceThreshold: 50,
  pricePerCubicMeter: 8.0,
  minimumDuration: 2,
  pricePerHour: 35.0,
};
```

### Service Types
```typescript
const SERVICE_TYPES = {
  'man-and-van': { basePrice: 45.0, pricePerMile: 1.5 },
  'van-only': { basePrice: 35.0, pricePerMile: 1.2 },
  'specialist': { basePrice: 75.0, pricePerMile: 2.0 },
};
```

## 🎯 React Hooks Quick Reference

### useUnifiedBooking
```typescript
const {
  // State
  formData,
  currentStep,
  totalSteps,
  isLoading,
  
  // Actions
  updateFormData,
  goToNext,
  goToPrev,
  goToStep,
  resetForm,
  
  // Validation
  validateStep,
  getStepErrors,
  
  // Navigation
  canGoNext,
  canGoPrev,
  getStepStatus,
} = useUnifiedBooking();
```

### useUnifiedBookingEnhanced
```typescript
const {
  // Enhanced features
  validateAllSteps,
  getProgressPercentage,
  getStepData,
  submitForm,
  saveDraft,
  loadDraft,
  
  // Analytics helpers
  trackStepStart,
  trackStepComplete,
  trackUserAction,
} = useUnifiedBookingEnhanced();
```

## 📱 Component Patterns

### Step Component Template
```typescript
function StepComponent() {
  const { formData, updateFormData, goToNext, goToPrev } = useUnifiedBooking();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(stepSchemas[currentStep])
  });

  const onSubmit = (data: any) => {
    updateFormData(data);
    goToNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
      <Button type="submit">Continue</Button>
      <Button onClick={goToPrev}>Back</Button>
    </form>
  );
}
```

### Form Field with Validation
```typescript
<FormControl isInvalid={!!errors.pickupAddress}>
  <FormLabel>Pickup Address</FormLabel>
  <Input
    {...register('pickupAddress')}
    placeholder="Enter pickup address"
  />
  <FormErrorMessage>
    {errors.pickupAddress?.message}
  </FormErrorMessage>
</FormControl>
```

## 🔄 State Management Patterns

### Updating Form Data
```typescript
// Update single field
updateFormData({ pickupAddress: '123 Main St' });

// Update multiple fields
updateFormData({
  pickupAddress: '123 Main St',
  dropoffAddress: '456 Oak Ave',
  serviceType: 'man-and-van'
});

// Update with existing data
updateFormData({
  ...formData,
  pickupAddress: '123 Main St'
});
```

### Local Storage Integration
```typescript
// Auto-save on every change
useEffect(() => {
  if (formData) {
    localStorage.setItem('booking-draft', JSON.stringify(formData));
  }
}, [formData]);

// Load draft on component mount
useEffect(() => {
  const draft = localStorage.getItem('booking-draft');
  if (draft) {
    updateFormData(JSON.parse(draft));
  }
}, []);
```

## 📊 Analytics Integration

### Track User Actions
```typescript
import { unifiedBookingAnalytics } from '@/lib/analytics/unified-booking-analytics';

// Track step completion
unifiedBookingAnalytics.trackStepCompletion(step, data, timeSpent);

// Track user behavior
unifiedBookingAnalytics.trackUserBehavior('button_click', 'submit_button');

// Track abandonment
unifiedBookingAnalytics.trackAbandonment(step, 'pricing_too_high', sessionId);
```

### Google Analytics 4
```typescript
// Track page views
unifiedBookingAnalytics.trackPageView('/booking-luxury', 'Luxury Booking');

// Track custom events
unifiedBookingAnalytics.trackEvent('booking_started', {
  service_type: 'man-and-van',
  source: 'homepage'
});
```

## 🔌 Real-time Updates

### WebSocket Connection
```typescript
import { realtimeBookingUpdates } from '@/lib/realtime/realtime-booking-updates';

// Subscribe to tracking updates
const unsubscribe = realtimeBookingUpdates.subscribeToTracking(bookingId, (update) => {
  console.log('Tracking update:', update);
});

// Subscribe to connection status
realtimeBookingUpdates.subscribeToConnectionStatus((status) => {
  console.log('Connection:', status);
});

// Cleanup on unmount
useEffect(() => {
  return unsubscribe;
}, []);
```

### Connection Management
```typescript
// Check connection status
const status = realtimeBookingUpdates.getConnectionStatus();

// Force reconnection
realtimeBookingUpdates.disconnect();
await realtimeBookingUpdates.connect();

// Get connection stats
const stats = realtimeBookingUpdates.getConnectionStats();
```

## 🚨 Error Handling

### API Error Handling
```typescript
try {
  const response = await unifiedBookingApi.createBooking(data);
  if (response.success) {
    // Handle success
  } else {
    // Handle API error
    console.error('API Error:', response.error);
    showErrorToast(response.error);
  }
} catch (error) {
  // Handle network/system errors
  console.error('System Error:', error);
  showErrorToast('Network error. Please try again.');
}
```

### Form Validation Errors
```typescript
// Display field errors
{errors.pickupAddress && (
  <Text color="red.500" fontSize="sm">
    {errors.pickupAddress.message}
  </Text>
)}

// Display form errors
{Object.keys(errors).length > 0 && (
  <Alert status="error">
    <AlertIcon />
    <Box>
      <AlertTitle>Please fix the following errors:</AlertTitle>
      <AlertDescription>
        {Object.values(errors).map((error: any) => error.message).join(', ')}
      </AlertDescription>
    </Box>
  </Alert>
)}
```

## 🧪 Testing Patterns

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { BookingProvider } from '@/lib/unified-booking-context';

test('renders step component', () => {
  render(
    <BookingProvider>
      <StepComponent />
    </BookingProvider>
  );
  
  expect(screen.getByText('Step Title')).toBeInTheDocument();
});
```

### Hook Testing
```typescript
import { renderHook, act } from '@testing-library/react';
import { useUnifiedBooking } from '@/lib/unified-booking-context';

test('updates form data', () => {
  const { result } = renderHook(() => useUnifiedBooking());
  
  act(() => {
    result.current.updateFormData({ pickupAddress: '123 Main St' });
  });
  
  expect(result.current.formData.pickupAddress).toBe('123 Main St');
});
```

### API Mocking
```typescript
// Mock API responses
jest.mock('@/lib/api/unified-booking-api', () => ({
  unifiedBookingApi: {
    createBooking: jest.fn().mockResolvedValue({
      success: true,
      data: { bookingId: 'test-123' }
    })
  }
}));
```

## 📈 Performance Monitoring

### Performance Metrics
```typescript
// Track API performance
const startTime = Date.now();
const response = await apiCall();
const responseTime = Date.now() - startTime;

unifiedBookingAnalytics.trackApiPerformance(endpoint, responseTime, true);

// Track component render time
const renderStart = performance.now();
// ... component logic ...
const renderTime = performance.now() - renderStart;
```

### Bundle Analysis
```bash
# Analyze bundle size
pnpm analyze:bundle

# Check for duplicate dependencies
pnpm dedupe

# Optimize imports
pnpm optimize:imports
```

## 🔐 Security Best Practices

### Input Validation
```typescript
// Always validate on both client and server
const schema = z.object({
  email: z.string().email(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/),
});

// Sanitize user input
const sanitizedInput = DOMPurify.sanitize(userInput);
```

### Authentication
```typescript
// Verify JWT tokens
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// Check user permissions
if (user.role !== 'admin') {
  throw new Error('Insufficient permissions');
}
```

### Rate Limiting
```typescript
// Implement rate limiting
const rateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
```

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Code linted and formatted
- [ ] TypeScript compilation successful
- [ ] Build successful
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates valid

### Deployment
- [ ] Backup current version
- [ ] Deploy new version
- [ ] Run health checks
- [ ] Verify functionality
- [ ] Monitor error rates
- [ ] Check performance metrics

### Post-deployment
- [ ] Monitor system health
- [ ] Check user feedback
- [ ] Verify analytics tracking
- [ ] Monitor error logs
- [ ] Performance analysis

## 📞 Support Contacts

### Development Team
- **Lead Developer**: [Name] - [Email]
- **Frontend Developer**: [Name] - [Email]
- **Backend Developer**: [Name] - [Email]

### Operations Team
- **DevOps Engineer**: [Name] - [Email]
- **System Administrator**: [Name] - [Email]
- **Database Administrator**: [Name] - [Email]

### Emergency Contacts
- **On-call Engineer**: [Phone]
- **System Manager**: [Phone]
- **CTO**: [Phone]

## 📚 Additional Resources

### Documentation
- [Full API Documentation](./PHASE_7_DOCUMENTATION_AND_TRAINING.md)
- [Migration Guide](../src/lib/MIGRATION_GUIDE.md)
- [Component Library](https://chakra-ui.com)
- [Next.js Documentation](https://nextjs.org/docs)

### Tools
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools)
- [Postman](https://www.postman.com) - API testing
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance

### Community
- [GitHub Issues](https://github.com/your-org/speedy-van/issues)
- [Discord Channel](https://discord.gg/your-channel)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/speedy-van)

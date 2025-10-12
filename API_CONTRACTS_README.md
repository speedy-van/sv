# API Contracts Implementation

This directory contains the complete API contracts implementation for the Speedy Van admin dashboard, following the specifications from cursor tasks section 17.

## Files Overview

### 📄 API_CONTRACTS.md

Complete API documentation with all endpoints, request/response formats, examples, and error handling.

### 📄 Speedy_Van_Admin_API.postman_collection.json

Ready-to-use Postman collection for testing all API endpoints with pre-configured requests and examples.

### 📄 apps/web/src/types/api-contracts.ts

TypeScript type definitions for all API contracts, providing type safety and IntelliSense support.

### 📄 apps/web/src/lib/api-client.ts

Typed API client utility with methods for all endpoints, error handling, and real-time subscriptions.

## Quick Start

### 1. Using the TypeScript Types

```typescript
import { Order, OrderFilters, OrderStatus, apiClient } from '@/lib/api-client';

// Type-safe order filtering
const filters: OrderFilters = {
  status: 'assigned',
  dateRange: 'today',
  take: 20,
};

// Type-safe API calls
const orders = await apiClient.getOrders(filters);
```

### 2. Using the API Client

```typescript
import { apiClient } from '@/lib/api-client';

// Set session token for authentication
apiClient.setSessionToken('your-session-token');

// List orders
const orders = await apiClient.getOrders({
  status: 'assigned',
  dateRange: 'today',
});

// Update an order
const updatedOrder = await apiClient.updateOrder('ABC123', {
  status: 'in_progress',
  reason: 'Driver started pickup',
});

// Create a refund
const refund = await apiClient.createRefund({
  paymentId: 'pay_123456789',
  amount: 5000,
  reason: 'customer_request',
  notes: 'Customer requested partial refund',
});
```

### 3. Real-time Updates

```typescript
// Subscribe to order updates
const unsubscribe = apiClient.subscribeToOrderUpdates(order => {
  console.log('Order updated:', order);
});

// Subscribe to driver locations
const unsubscribeLocations = apiClient.subscribeToDriverLocations(location => {
  console.log('Driver location:', location);
});

// Cleanup when done
unsubscribe();
unsubscribeLocations();
```

### 4. Error Handling

```typescript
import { ApiError, handleApiError } from '@/lib/api-client';

try {
  const orders = await apiClient.getOrders();
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.status}:`, error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## API Endpoints Summary

### Orders Management

- `GET /api/admin/orders` - List orders with filtering
- `GET /api/admin/orders/:code` - Get order details
- `PUT /api/admin/orders/:code` - Update order
- `POST /api/admin/orders/:code/assign` - Assign driver
- `GET /api/admin/orders/:code/assign` - Get assignment suggestions

### Refunds Management

- `POST /api/admin/refunds` - Create refund
- `GET /api/admin/refunds` - List refunds

### Drivers Management

- `GET /api/admin/drivers/applications` - List applications
- `POST /api/admin/drivers/:id/approve` - Approve driver
- `POST /api/admin/drivers/:id/reject` - Reject driver
- `GET /api/admin/drivers/:id` - Get driver details
- `PUT /api/admin/drivers/:id` - Update driver

### Configuration Management

- `PUT /api/admin/config/pricing` - Update pricing
- `GET /api/admin/config/pricing` - Get pricing configs

### Analytics

- `GET /api/admin/analytics/summary` - Get analytics summary

## Authentication

All endpoints require admin authentication via session cookies:

```typescript
// Set session token
apiClient.setSessionToken('your-session-token');

// Or include in headers manually
const response = await fetch('/api/admin/orders', {
  headers: {
    Cookie: 'session=your-session-token',
  },
});
```

## Rate Limiting

The API implements rate limiting with the following limits:

- Standard endpoints: 100 requests/minute
- Analytics endpoints: 20 requests/minute
- Bulk operations: 10 requests/minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Audit Logging

All mutations (POST, PUT, DELETE) are automatically logged with:

- User ID and role
- Action performed
- Target entity and ID
- Before/after state
- IP address and user agent
- Timestamp

## Testing with Postman

1. Import `Speedy_Van_Admin_API.postman_collection.json` into Postman
2. Set environment variables:
   - `base_url`: Your API base URL
   - `session_token`: Your admin session token
3. Use the pre-configured requests to test all endpoints

## Type Safety Features

### Type Guards

```typescript
import { isOrderStatus, isPaymentStatus } from '@/types/api-contracts';

const status = 'assigned';
if (isOrderStatus(status)) {
  // TypeScript knows status is OrderStatus
  const filters: OrderFilters = { status };
}
```

### Validation

```typescript
import { validateOrderFilters, validateRefundRequest } from '@/lib/api-client';

// Validate before making API calls
validateOrderFilters(filters);
validateRefundRequest(refundData);
```

## Bulk Operations

```typescript
// Bulk assign drivers
const updatedOrders = await apiClient.bulkAssignDrivers(
  ['ABC123', 'DEF456'],
  'driver_123'
);

// Bulk update status
const updatedOrders = await apiClient.bulkUpdateOrders(
  ['ABC123', 'DEF456'],
  'completed',
  'All orders completed'
);
```

## Export Operations

```typescript
// Export orders to CSV
const csvBlob = await apiClient.exportOrders({
  status: 'completed',
  dateRange: 'month',
});

// Download the file
const url = URL.createObjectURL(csvBlob);
const a = document.createElement('a');
a.href = url;
a.download = 'orders.csv';
a.click();
```

## Webhooks

The system supports webhooks for real-time notifications:

```typescript
// Example webhook payloads
interface OrderStatusWebhook {
  event: 'order.status_changed';
  data: {
    orderId: string;
    code: string;
    oldStatus: string;
    newStatus: string;
    timestamp: string;
  };
}
```

## Error Responses

All endpoints may return standardized error responses:

```typescript
// 401 Unauthorized
{ error: "Unauthorized" }

// 400 Bad Request
{
  error: "Validation error",
  details: { field: "Error message" }
}

// 500 Internal Server Error
{ error: "Internal server error" }
```

## Development Workflow

1. **Define Types**: Add new types to `api-contracts.ts`
2. **Update Client**: Add methods to `api-client.ts`
3. **Document**: Update `API_CONTRACTS.md`
4. **Test**: Add examples to Postman collection
5. **Validate**: Use type guards and validation functions

## Best Practices

1. **Always use TypeScript types** for type safety
2. **Handle errors gracefully** with try-catch blocks
3. **Validate input** before making API calls
4. **Use the API client** instead of raw fetch calls
5. **Subscribe to real-time updates** for live data
6. **Clean up subscriptions** when components unmount
7. **Use bulk operations** for multiple items
8. **Implement proper error boundaries** in React components

## Integration Examples

### React Hook Example

```typescript
import { useState, useEffect } from 'react';
import { apiClient, Order } from '@/lib/api-client';

export function useOrders(filters?: OrderFilters) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getOrders(filters);
        setOrders(response.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Subscribe to real-time updates
    const unsubscribe = apiClient.subscribeToOrderUpdates(order => {
      setOrders(prev => prev.map(o => (o.id === order.id ? order : o)));
    });

    return unsubscribe;
  }, [filters]);

  return { orders, loading, error };
}
```

### Next.js API Route Example

```typescript
// pages/api/admin/orders/[code].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { apiClient } from '@/lib/api-client';
import { Order, OrderUpdateRequest } from '@/types/api-contracts';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Order | { error: string }>
) {
  const { code } = req.query;

  try {
    switch (req.method) {
      case 'GET':
        const order = await apiClient.getOrder(code as string);
        res.status(200).json(order);
        break;

      case 'PUT':
        const updateData: OrderUpdateRequest = req.body;
        const updatedOrder = await apiClient.updateOrder(
          code as string,
          updateData
        );
        res.status(200).json(updatedOrder);
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
```

This implementation provides a complete, type-safe, and production-ready API contracts system for the Speedy Van admin dashboard.

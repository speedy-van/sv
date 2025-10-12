# API Contracts - Admin Dashboard

This document outlines the API contracts for the Speedy Van admin dashboard, following the specifications from cursor tasks section 17.

## Authentication

All admin API endpoints require authentication with admin role. Use session-based authentication:

```typescript
// All requests must include valid admin session
// Session is validated server-side with role check
```

## Base URL

```
https://your-domain.com/api/admin
```

---

## 1. Orders Management

### GET /api/admin/orders

**Description:** List orders with filtering and pagination

**Query Parameters:**

- `status` (optional): Filter by order status
- `q` (optional): Search query (order code, addresses, customer name/email)
- `from` (optional): Start date (ISO string)
- `to` (optional): End date (ISO string)
- `payment` (optional): Payment status filter
- `driver` (optional): Driver name filter
- `area` (optional): Area filter
- `dateRange` (optional): Predefined ranges ('today', 'week', 'month')
- `take` (optional): Number of items per page (1-200, default: 50)
- `cursor` (optional): Pagination cursor

**Response:**

```typescript
{
  items: Array<{
    id: string;
    code: string;
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
    pickupAddress: string;
    dropoffAddress: string;
    preferredDate: string;
    timeSlot: string;
    amountPence: number;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    createdAt: string;
    customer: {
      id: string;
      name: string;
      email: string;
    };
    driver?: {
      id: string;
      user: {
        id: string;
        name: string;
        email: string;
      };
    };
    assignment?: {
      id: string;
      status: string;
      driver: {
        id: string;
        user: {
          id: string;
          name: string;
          email: string;
        };
      };
    };
  }>;
  nextCursor?: string;
}
```

**Example:**

```bash
GET /api/admin/orders?status=assigned&q=ABC123&dateRange=today&take=20
```

### GET /api/admin/orders/:code

**Description:** Get detailed order information

**Path Parameters:**

- `code`: Order reference code

**Response:**

```typescript
{
  id: string;
  code: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  preferredDate: string;
  timeSlot: string;
  amountPence: number;
  paymentStatus: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  driver?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  assignment?: {
    id: string;
    status: string;
    driver: {
      id: string;
      user: {
        id: string;
        name: string;
        email: string;
      };
    };
    events: Array<{
      id: string;
      type: string;
      description: string;
      createdAt: string;
    }>;
  };
  messages: Array<{
    id: string;
    content: string;
    sender: string;
    createdAt: string;
  }>;
  trackingPings: Array<{
    id: string;
    lat: number;
    lng: number;
    createdAt: string;
  }>;
}
```

### PUT /api/admin/orders/:code

**Description:** Update order details (status, driver, time, notes)

**Path Parameters:**

- `code`: Order reference code

**Request Body:**

```typescript
{
  status?: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  driverId?: string | null;
  timeSlot?: string;
  preferredDate?: string;
  notes?: string;
  reason?: string; // Required for status changes
}
```

**Response:** Updated order object

**Example:**

```bash
PUT /api/admin/orders/ABC123
Content-Type: application/json

{
  "status": "assigned",
  "driverId": "driver_123",
  "reason": "Manual assignment by admin"
}
```

### POST /api/admin/orders/:code/assign

**Description:** Assign driver to order (manual or auto-assign)

**Path Parameters:**

- `code`: Order reference code

**Request Body:**

```typescript
{
  driverId?: string; // Optional for auto-assign
  autoAssign?: boolean; // Default: false
  reason?: string;
}
```

**Response:**

```typescript
{
  id: string;
  code: string;
  status: 'assigned';
  driverId: string;
  driver: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    }
  }
  customer: {
    id: string;
    name: string;
    email: string;
  }
}
```

**Example:**

```bash
POST /api/admin/orders/ABC123/assign
Content-Type: application/json

{
  "autoAssign": true,
  "reason": "Auto-assignment based on availability"
}
```

### GET /api/admin/orders/:code/assign

**Description:** Get driver assignment suggestions

**Response:**

```typescript
{
  booking: {
    id: string;
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
    preferredDate: string;
    timeSlot: string;
    vanSize: string;
    crewSize: number;
  }
  suggestions: Array<{
    id: string;
    score: number;
    activeJobs: number;
    suitability: 'available' | 'at_capacity';
    user: {
      id: string;
      name: string;
      email: string;
    };
    rating: number;
    vehicles: Array<{
      id: string;
      make: string;
      model: string;
      reg: string;
      weightClass: string;
    }>;
  }>;
}
```

---

## 2. Refunds Management

### POST /api/admin/refunds

**Description:** Create a refund for a payment

**Request Body:**

```typescript
{
  paymentId: string;
  amount: number; // Amount in pence
  reason: 'customer_request' | 'service_issue' | 'duplicate_charge' | 'fraud' | 'other';
  notes?: string;
}
```

**Response:**

```typescript
{
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  notes?: string;
  createdAt: string;
  payment: {
    id: string;
    amount: number;
    booking: {
      code: string;
      customer: {
        user: {
          name: string;
          email: string;
        };
      };
    };
  };
}
```

**Example:**

```bash
POST /api/admin/refunds
Content-Type: application/json

{
  "paymentId": "pay_123456789",
  "amount": 5000,
  "reason": "customer_request",
  "notes": "Customer requested partial refund due to delay"
}
```

### GET /api/admin/refunds

**Description:** List refunds with filtering

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search by order code, customer email/name
- `status` (optional): Filter by refund status
- `reason` (optional): Filter by refund reason
- `fromDate` (optional): Start date filter
- `toDate` (optional): End date filter

**Response:**

```typescript
{
  refunds: Array<{
    id: string;
    amount: number;
    reason: string;
    status: string;
    createdAt: string;
    payment: {
      booking: {
        code: string;
        customer: {
          user: {
            name: string;
            email: string;
          };
        };
      };
    };
  }>;
  total: number;
  summary: {
    totalAmount: number;
    totalCount: number;
  }
  reasonsBreakdown: Array<{
    reason: string;
    totalAmount: number;
    count: number;
  }>;
}
```

---

## 3. Drivers Management

### GET /api/admin/drivers/applications

**Description:** List driver applications with filtering

**Query Parameters:**

- `status` (optional): Filter by onboarding status
- `search` (optional): Search by driver name/email
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**

```typescript
{
  drivers: Array<{
    id: string;
    onboardingStatus: 'pending' | 'approved' | 'rejected';
    rating: number;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      createdAt: string;
    };
    documents: Array<{
      id: string;
      category: string;
      fileUrl: string;
      status: string;
      uploadedAt: string;
      expiresAt?: string;
      verifiedAt?: string;
    }>;
    vehicles: Array<{
      id: string;
      make: string;
      model: string;
      reg: string;
      weightClass: string;
      motExpiry?: string;
    }>;
    checks: {
      rtwMethod?: string;
      rtwExpiresAt?: string;
      licenceCategories?: string[];
      points?: number;
      licenceExpiry?: string;
      dbsType?: string;
      dbsCheckedAt?: string;
      insurancePolicyNo?: string;
      insurer?: string;
      policyEnd?: string;
    };
    profile: {
      phone?: string;
      experience?: string;
      basePostcode?: string;
      rightToWorkType?: string;
    };
    ratings: Array<{
      rating: number;
      createdAt: string;
    }>;
  }>;
  total: number;
  summary: {
    pending: number;
    approved: number;
    rejected: number;
  }
}
```

### POST /api/admin/drivers/:id/approve

**Description:** Approve a driver application

**Path Parameters:**

- `id`: Driver ID

**Request Body:**

```typescript
{
  notes?: string;
  conditions?: string[];
}
```

**Response:**

```typescript
{
  id: string;
  onboardingStatus: 'approved';
  approvedAt: string;
  approvedBy: string;
  notes?: string;
}
```

### POST /api/admin/drivers/:id/reject

**Description:** Reject a driver application

**Path Parameters:**

- `id`: Driver ID

**Request Body:**

```typescript
{
  reason: string;
  notes?: string;
}
```

**Response:**

```typescript
{
  id: string;
  onboardingStatus: 'rejected';
  rejectedAt: string;
  rejectedBy: string;
  reason: string;
  notes?: string;
}
```

### GET /api/admin/drivers/:id

**Description:** Get detailed driver information

**Path Parameters:**

- `id`: Driver ID

**Response:**

```typescript
{
  id: string;
  status: 'active' | 'suspended' | 'inactive';
  onboardingStatus: string;
  rating: number;
  strikes: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  profile: {
    phone?: string;
    experience?: string;
    basePostcode?: string;
    rightToWorkType?: string;
  };
  vehicles: Array<{
    id: string;
    make: string;
    model: string;
    reg: string;
    weightClass: string;
    motExpiry?: string;
  }>;
  checks: {
    rtwMethod?: string;
    rtwExpiresAt?: string;
    licenceCategories?: string[];
    points?: number;
    licenceExpiry?: string;
    dbsType?: string;
    dbsCheckedAt?: string;
    insurancePolicyNo?: string;
    insurer?: string;
    policyEnd?: string;
  };
  documents: Array<{
    id: string;
    category: string;
    fileUrl: string;
    status: string;
    uploadedAt: string;
    expiresAt?: string;
    verifiedAt?: string;
  }>;
  ratings: Array<{
    rating: number;
    createdAt: string;
  }>;
  incidents: Array<{
    id: string;
    type: string;
    severity: string;
    description: string;
    createdAt: string;
    resolved: boolean;
  }>;
  bookings: Array<{
    id: string;
    status: string;
    amountPence: number;
    createdAt: string;
  }>;
  availability: {
    status: 'online' | 'offline' | 'break';
    lastSeen: string;
  };
}
```

### PUT /api/admin/drivers/:id

**Description:** Update driver status and details

**Path Parameters:**

- `id`: Driver ID

**Request Body:**

```typescript
{
  status?: 'active' | 'suspended' | 'inactive';
  notes?: string;
  reason?: string;
}
```

**Response:** Updated driver object

---

## 4. Configuration Management

### PUT /api/admin/config/pricing

**Description:** Update pricing configuration (versioned)

**Request Body:**

```typescript
{
  zoneKey: string;
  vanRates: {
    small: number;
    medium: number;
    large: number;
  }
  slotMultipliers: {
    morning: number;
    afternoon: number;
    evening: number;
  }
  dayMultipliers: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  }
  accessFees: {
    floors: number;
    lift: number;
    parking: number;
  }
  surcharges: {
    rushHour: number;
    weekend: number;
    bankHoliday: number;
  }
  minFareFloor: number;
  surgePolicy: {
    enabled: boolean;
    multiplier: number;
    threshold: number;
  }
  vatRate: number;
  rounding: 'nearest' | 'up' | 'down';
  lockTtlSeconds: number;
  activeFrom: string; // ISO date string
}
```

**Response:**

```typescript
{
  id: string;
  zoneKey: string;
  version: number;
  vanRates: object;
  slotMultipliers: object;
  dayMultipliers: object;
  accessFees: object;
  surcharges: object;
  minFareFloor: number;
  surgePolicy: object;
  vatRate: number;
  rounding: string;
  lockTtlSeconds: number;
  activeFrom: string;
  createdBy: string;
  createdAt: string;
}
```

**Example:**

```bash
PUT /api/admin/config/pricing
Content-Type: application/json

{
  "zoneKey": "london",
  "vanRates": {
    "small": 2500,
    "medium": 3500,
    "large": 4500
  },
  "slotMultipliers": {
    "morning": 1.2,
    "afternoon": 1.0,
    "evening": 1.1
  },
  "activeFrom": "2024-01-01T00:00:00Z"
}
```

### GET /api/admin/config/pricing

**Description:** Get pricing configurations

**Query Parameters:**

- `zoneKey` (optional): Filter by zone (default: 'default')
- `limit` (optional): Number of versions to return (default: 50)

**Response:**

```typescript
Array<{
  id: string;
  zoneKey: string;
  version: number;
  vanRates: object;
  slotMultipliers: object;
  dayMultipliers: object;
  accessFees: object;
  surcharges: object;
  minFareFloor: number;
  surgePolicy: object;
  vatRate: number;
  rounding: string;
  lockTtlSeconds: number;
  activeFrom: string;
  createdBy: string;
  createdAt: string;
}>;
```

---

## 5. Analytics

### GET /api/admin/analytics/summary

**Description:** Get analytics summary data

**Query Parameters:**

- `range` (optional): Time range ('24h', '7d', '30d', default: '30d')

**Response:**

```typescript
{
  // Revenue metrics
  revenue: {
    total30d: number;
    total7d: number;
    total24h: number;
    average: number;
    trend: number; // Percentage change
  }

  // Booking metrics
  bookings: {
    total: number;
    byStatus: {
      pending: number;
      assigned: number;
      in_progress: number;
      completed: number;
      cancelled: number;
    }
    trend: number;
  }

  // Driver metrics
  drivers: {
    total: number;
    active: number;
    online: number;
    averageRating: number;
    onTimeRate: number;
  }

  // Performance metrics
  performance: {
    averageResponseTime: number;
    onTimePickupRate: number;
    onTimeDeliveryRate: number;
    cancellationRate: number;
  }

  // Real-time metrics
  realtime: {
    jobsInProgress: number;
    latePickups: number;
    lateDeliveries: number;
    pendingAssignments: number;
  }

  // Service areas
  serviceAreas: Array<{
    regionKey: string;
    bookings: number;
    revenue: number;
    averageRating: number;
  }>;

  // Cancellation reasons
  cancellationReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;

  // Recent activity
  recentBookings: Array<{
    date: string;
    bookings: number;
    revenue: number;
  }>;
}
```

**Example:**

```bash
GET /api/admin/analytics/summary?range=7d
```

---

## 6. Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized

```typescript
{
  error: 'Unauthorized';
}
```

### 403 Forbidden

```typescript
{
  error: 'Insufficient permissions';
}
```

### 404 Not Found

```typescript
{
  error: 'Resource not found';
}
```

### 400 Bad Request

```typescript
{
  error: "Validation error",
  details: {
    field: "Error message"
  }
}
```

### 500 Internal Server Error

```typescript
{
  error: 'Internal server error';
}
```

---

## 7. Rate Limiting

- **Standard endpoints:** 100 requests per minute per admin
- **Analytics endpoints:** 20 requests per minute per admin
- **Bulk operations:** 10 requests per minute per admin

Rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 8. Audit Logging

All mutations (POST, PUT, DELETE) are automatically logged with:

- User ID and role
- Action performed
- Target entity and ID
- Before/after state (for updates)
- IP address and user agent
- Timestamp

Audit entries are immutable and retained for compliance purposes.

---

## 9. Webhooks

The system supports webhooks for real-time notifications:

### Order Status Changes

```
POST /webhook/order-status
{
  "event": "order.status_changed",
  "data": {
    "orderId": "string",
    "code": "string",
    "oldStatus": "string",
    "newStatus": "string",
    "timestamp": "string"
  }
}
```

### Driver Assignment

```
POST /webhook/driver-assignment
{
  "event": "driver.assigned",
  "data": {
    "orderId": "string",
    "driverId": "string",
    "timestamp": "string"
  }
}
```

### Payment Events

```
POST /webhook/payment
{
  "event": "payment.refunded",
  "data": {
    "paymentId": "string",
    "refundId": "string",
    "amount": "number",
    "timestamp": "string"
  }
}
```

---

## 10. Testing

### Postman Collection

Import the provided Postman collection for testing all endpoints with pre-configured authentication and example requests.

### Environment Variables

Set the following environment variables for testing:

```
BASE_URL=https://your-domain.com
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-password
```

### Example Test Script

```bash
# Test orders listing
curl -X GET "https://your-domain.com/api/admin/orders?status=assigned&take=10" \
  -H "Cookie: session=your-session-token"

# Test order assignment
curl -X POST "https://your-domain.com/api/admin/orders/ABC123/assign" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=your-session-token" \
  -d '{"autoAssign": true, "reason": "Test assignment"}'
```

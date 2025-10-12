# Customer Portal APIs Documentation

This document outlines all the APIs implemented for the Customer Portal, following the requirements from the cursor tasks.

## Authentication & Authorization

All portal APIs require authentication with a customer role. The middleware automatically checks for `session.user.role === 'customer'`.

## Core APIs

### 1. Portal Summary

**GET** `/api/portal/summary`

Returns dashboard overview data including next booking, counts, and recent orders.

**Response:**

```json
{
  "nextBooking": {
    "id": "string",
    "code": "SV077353305",
    "status": "confirmed",
    "preferredDate": "2024-01-15T10:00:00Z",
    "pickupAddress": "123 Main St, London",
    "dropoffAddress": "456 Oak Ave, Manchester",
    "amountPence": 5000,
    "vanSize": "medium",
    "crewSize": 2
  },
  "counts": {
    "current": 3,
    "past": 12,
    "total": 15
  },
  "invoices": {
    "paid": 10,
    "unpaid": 2,
    "totalSpent": 45000
  },
  "recentOrders": [...]
}
```

### 2. Bookings Management

#### List Bookings

**GET** `/api/portal/bookings?status=current|past&page=1&limit=10`

Returns paginated list of customer bookings with optional status filtering.

**Query Parameters:**

- `status`: `current` | `past` | `all` (default: all)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**

```json
{
  "bookings": [
    {
      "id": "string",
      "code": "SV077353305",
      "status": "confirmed",
      "paymentStatus": "paid",
      "preferredDate": "2024-01-15T10:00:00Z",
      "pickupAddress": "123 Main St, London",
      "dropoffAddress": "456 Oak Ave, Manchester",
      "amountPence": 5000,
      "currency": "GBP",
      "vanSize": "medium",
      "crewSize": 2,
      "driver": {
        "user": {
          "name": "John Driver"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

#### Get Booking Details

**GET** `/api/portal/bookings/:id`

Returns detailed information about a specific booking.

**Response:**

```json
{
  "booking": {
    "id": "string",
    "code": "SV077353305",
    "status": "confirmed",
    "paymentStatus": "paid",
    "preferredDate": "2024-01-15T10:00:00Z",
    "pickupAddress": "123 Main St, London",
    "dropoffAddress": "456 Oak Ave, Manchester",
    "pickupLat": 51.5074,
    "pickupLng": -0.1278,
    "dropoffLat": 53.4808,
    "dropoffLng": -2.2426,
    "amountPence": 5000,
    "currency": "GBP",
    "vanSize": "medium",
    "crewSize": 2,
    "stairsFloors": 2,
    "assembly": true,
    "packingMaterials": false,
    "heavyItems": true,
    "buildingType": "apartment",
    "hasElevator": true,
    "parkingNotes": "Visitor parking available",
    "doorCodes": "1234",
    "specialInstructions": "Please call 10 minutes before arrival",
    "contactName": "John Smith",
    "contactPhone": "+44123456789",
    "contactEmail": "john@example.com",
    "driver": {
      "id": "string",
      "user": {
        "name": "John Driver",
        "email": "driver@speedy-van.co.uk"
      },
      "rating": 4.8
    },
    "assignment": {
      "id": "string",
      "status": "assigned",
      "events": [...]
    },
    "messages": [...]
  }
}
```

#### Live Tracking

**GET** `/api/portal/bookings/:id/track`

Returns real-time tracking information for active bookings.

**Response:**

```json
{
  "booking": {
    "id": "string",
    "code": "SV077353305",
    "status": "en_route_pickup",
    "pickupAddress": "123 Main St, London",
    "dropoffAddress": "456 Oak Ave, Manchester",
    "driver": {
      "id": "string",
      "user": {
        "name": "John Driver"
      },
      "rating": 4.8
    },
    "routeProgress": 25,
    "currentLocation": {
      "lat": 51.5074,
      "lng": -0.1278,
      "timestamp": "2024-01-15T09:30:00Z"
    },
    "eta": {
      "estimatedArrival": "2024-01-15T10:00:00Z",
      "minutesRemaining": 30
    },
    "lastEvent": {
      "step": "en_route_pickup",
      "notes": "Driver is on the way to pickup location",
      "createdAt": "2024-01-15T09:25:00Z"
    }
  }
}
```

### 3. Invoices & Payments

#### List Invoices

**GET** `/api/portal/invoices?status=paid&page=1&limit=20`

Returns paginated list of invoices with payment status.

**Query Parameters:**

- `status`: `paid` | `unpaid` | `all` (default: all)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**

```json
{
  "invoices": [
    {
      "id": "string",
      "orderRef": "SV077353305",
      "invoiceNumber": "INV-SV077353305",
      "date": "2024-01-15T10:00:00Z",
      "amount": 5000,
      "currency": "GBP",
      "status": "paid",
      "paidAt": "2024-01-15T09:45:00Z",
      "stripePaymentIntentId": "pi_1234567890",
      "pickupAddress": "123 Main St, London",
      "dropoffAddress": "456 Oak Ave, Manchester",
      "contactName": "John Smith",
      "contactEmail": "john@example.com"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1
  }
}
```

#### Download Invoice PDF

**GET** `/api/portal/invoices/:id/pdf`

Downloads the invoice as a PDF file.

**Response:** PDF file with `Content-Type: application/pdf`

#### Export Invoices CSV

**GET** `/api/portal/invoices/export?status=paid&startDate=2024-01-01&endDate=2024-01-31`

Exports invoices to CSV format for accounting purposes.

**Query Parameters:**

- `status`: `paid` | `unpaid` | `all` (default: all)
- `startDate`: Start date filter (YYYY-MM-DD)
- `endDate`: End date filter (YYYY-MM-DD)

**Response:** CSV file with `Content-Type: text/csv`

### 4. Profile Management

#### Get Profile

**GET** `/api/portal/profile`

Returns current user profile information.

**Response:**

```json
{
  "user": {
    "id": "string",
    "name": "John Smith",
    "email": "john@example.com",
    "emailVerified": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Update Profile

**POST** `/api/portal/profile`

Updates user profile information.

**Request Body:**

```json
{
  "name": "John Smith",
  "phone": "+44123456789",
  "email": "john@example.com",
  "timezone": "Europe/London",
  "language": "en"
}
```

**Response:**

```json
{
  "user": {
    "id": "string",
    "name": "John Smith",
    "email": "john@example.com",
    "emailVerified": true,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "message": "Profile updated successfully"
}
```

### 5. Addresses Management

#### List Addresses

**GET** `/api/portal/addresses`

Returns all saved addresses for the customer.

**Response:**

```json
{
  "addresses": [
    {
      "id": "string",
      "label": "Home",
      "line1": "123 Main Street",
      "line2": "Apt 4B",
      "city": "London",
      "postcode": "SW1A 1AA",
      "floor": "4",
      "flat": "4B",
      "lift": true,
      "notes": "Call on arrival",
      "isDefault": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Create Address

**POST** `/api/portal/addresses`

Creates a new address.

**Request Body:**

```json
{
  "label": "Office",
  "line1": "456 Business Park",
  "line2": "Suite 100",
  "city": "Manchester",
  "postcode": "M1 1AA",
  "floor": "1",
  "flat": "100",
  "lift": false,
  "notes": "Reception will sign",
  "isDefault": false
}
```

#### Update Address

**PUT** `/api/portal/addresses`

Updates an existing address.

**Request Body:**

```json
{
  "id": "string",
  "label": "Updated Office",
  "line1": "456 Business Park",
  "line2": "Suite 200",
  "city": "Manchester",
  "postcode": "M1 1AA",
  "floor": "2",
  "flat": "200",
  "lift": true,
  "notes": "Updated notes",
  "isDefault": true
}
```

#### Delete Address

**DELETE** `/api/portal/addresses?id=string`

Deletes an address.

### 6. Contacts Management

#### List Contacts

**GET** `/api/portal/contacts`

Returns all saved contacts for the customer.

**Response:**

```json
{
  "contacts": [
    {
      "id": "string",
      "label": "Spouse",
      "name": "Jane Smith",
      "phone": "+44123456789",
      "email": "jane@example.com",
      "notes": "Alternative contact",
      "isDefault": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Create Contact

**POST** `/api/portal/contacts`

Creates a new contact.

**Request Body:**

```json
{
  "label": "Friend",
  "name": "Bob Johnson",
  "phone": "+44123456790",
  "email": "bob@example.com",
  "notes": "Can sign for deliveries",
  "isDefault": false
}
```

#### Update Contact

**PUT** `/api/portal/contacts`

Updates an existing contact.

#### Delete Contact

**DELETE** `/api/portal/contacts?id=string`

Deletes a contact.

### 7. Support Tickets

#### List Support Tickets

**GET** `/api/portal/support?status=open&category=booking&page=1&limit=10`

Returns paginated list of support tickets.

**Query Parameters:**

- `status`: `open` | `waiting_for_customer` | `customer_replied` | `closed` | `all`
- `category`: `booking` | `payment` | `technical` | `general` | `complaint` | `all`
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**

```json
{
  "tickets": [
    {
      "id": "string",
      "subject": "Booking modification request",
      "description": "I need to change the pickup time",
      "category": "booking",
      "priority": "medium",
      "status": "open",
      "createdAt": "2024-01-15T10:00:00Z",
      "booking": {
        "id": "string",
        "code": "SV077353305",
        "status": "confirmed"
      },
      "messages": [
        {
          "id": "string",
          "content": "Support team response",
          "isFromCustomer": false,
          "createdAt": "2024-01-15T11:00:00Z"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

#### Create Support Ticket

**POST** `/api/portal/support`

Creates a new support ticket.

**Request Body:**

```json
{
  "subject": "Booking modification request",
  "description": "I need to change the pickup time from 10 AM to 2 PM",
  "category": "booking",
  "priority": "medium",
  "bookingId": "string",
  "attachments": ["https://example.com/file1.pdf"]
}
```

#### Get Support Ticket Details

**GET** `/api/portal/support/:id`

Returns detailed information about a support ticket including all messages.

**Response:**

```json
{
  "ticket": {
    "id": "string",
    "subject": "Booking modification request",
    "description": "I need to change the pickup time",
    "category": "booking",
    "priority": "medium",
    "status": "open",
    "createdAt": "2024-01-15T10:00:00Z",
    "attachments": ["https://example.com/file1.pdf"],
    "booking": {
      "id": "string",
      "code": "SV077353305",
      "status": "confirmed",
      "pickupAddress": "123 Main St, London",
      "dropoffAddress": "456 Oak Ave, Manchester",
      "preferredDate": "2024-01-15T10:00:00Z"
    },
    "messages": [
      {
        "id": "string",
        "content": "I need to change the pickup time",
        "isFromCustomer": true,
        "createdAt": "2024-01-15T10:00:00Z",
        "attachments": []
      },
      {
        "id": "string",
        "content": "We can help you with that. What time would you prefer?",
        "isFromCustomer": false,
        "createdAt": "2024-01-15T11:00:00Z",
        "attachments": []
      }
    ]
  }
}
```

#### Add Message to Support Ticket

**POST** `/api/portal/support/:id`

Adds a message to an existing support ticket.

**Request Body:**

```json
{
  "content": "I would prefer 2 PM if possible"
}
```

### 8. Settings Management

#### Notification Preferences

**GET** `/api/portal/settings/notifications`

Returns current notification preferences.

**Response:**

```json
{
  "preferences": {
    "id": "string",
    "userId": "string",
    "emailOn": true,
    "smsOn": true,
    "pushOn": true,
    "bookingUpdates": true,
    "paymentReminders": true,
    "promotionalOffers": false,
    "serviceUpdates": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**POST** `/api/portal/settings/notifications`

Updates notification preferences.

**Request Body:**

```json
{
  "emailOn": true,
  "smsOn": false,
  "pushOn": true,
  "bookingUpdates": true,
  "paymentReminders": true,
  "promotionalOffers": false,
  "serviceUpdates": true
}
```

#### Security Settings

**GET** `/api/portal/settings/security`

Returns security settings and active sessions.

**Response:**

```json
{
  "twoFactorEnabled": false,
  "lastPasswordChange": "2024-01-01T00:00:00Z",
  "lastLoginAt": "2024-01-15T09:00:00Z",
  "activeSessions": [
    {
      "id": "string",
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "192.168.1.1",
      "createdAt": "2024-01-15T09:00:00Z",
      "lastActivity": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**POST** `/api/portal/settings/security`

Changes password.

**Request Body:**

```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**PUT** `/api/portal/settings/security`

Manages 2FA settings.

**Request Body:**

```json
{
  "action": "enable",
  "code": "123456"
}
```

#### Privacy Settings

**GET** `/api/portal/settings/privacy`

Returns privacy settings and data export/deletion status.

**Response:**

```json
{
  "dataSummary": {
    "bookings": 15,
    "addresses": 3,
    "contacts": 2,
    "supportTickets": 5
  },
  "recentExports": [
    {
      "id": "string",
      "status": "completed",
      "format": "json",
      "createdAt": "2024-01-15T10:00:00Z",
      "completedAt": "2024-01-15T10:05:00Z",
      "downloadUrl": "https://example.com/export.json"
    }
  ],
  "recentDeletionRequests": [
    {
      "id": "string",
      "status": "pending",
      "reason": "No longer using the service",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**POST** `/api/portal/settings/privacy`

Requests data export.

**Request Body:**

```json
{
  "format": "json",
  "includeBookings": true,
  "includeAddresses": true,
  "includeContacts": true,
  "includeSupportTickets": true
}
```

**PUT** `/api/portal/settings/privacy`

Requests data deletion.

**Request Body:**

```json
{
  "reason": "No longer using the service",
  "confirmDeletion": true
}
```

## Error Handling

All APIs return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

Common HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (wrong role)
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

APIs are rate-limited to prevent abuse:

- Authentication endpoints: 5 requests per minute
- General endpoints: 100 requests per minute
- File uploads: 10 requests per minute

## Security

- All endpoints require authentication with customer role
- Input validation using Zod schemas
- SQL injection protection via Prisma ORM
- XSS protection via proper content types
- CSRF protection via session tokens

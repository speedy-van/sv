# Speedy Van B2B API Documentation

## Overview

The Speedy Van B2B API enables corporate clients to integrate delivery services directly into their systems. This RESTful API supports quote generation, booking management, invoice retrieval, and real-time tracking.

**Base URL:** `https://api.speedyvan.com/b2b/v1`

**API Version:** 1.0.0

---

## Authentication

All API requests require authentication using an API key. Include your API key in the request header:

```http
Authorization: Bearer sv_b2b_your_api_key_here
```

Or alternatively:

```http
X-API-Key: sv_b2b_your_api_key_here
```

### Obtaining API Keys

1. Log in to your B2B Dashboard
2. Navigate to **Settings > API Keys**
3. Click **Create New Key**
4. Select the required scopes
5. Copy and securely store your key (shown only once)

### API Key Scopes

| Scope | Description |
|-------|-------------|
| `bookings:read` | View booking details |
| `bookings:write` | Create and update bookings |
| `bookings:cancel` | Cancel bookings |
| `quotes:read` | View quotes |
| `quotes:write` | Create quotes |
| `quotes:accept` | Accept quotes and convert to bookings |
| `invoices:read` | View invoices |
| `invoices:download` | Download invoice PDFs |
| `company:read` | View company details |
| `tracking:read` | Track shipments in real-time |
| `webhooks:read` | View webhook configurations |
| `webhooks:write` | Manage webhook endpoints |

---

## Rate Limiting

API requests are rate-limited based on your subscription plan:

| Plan | Requests/Minute | Requests/Day |
|------|-----------------|--------------|
| Standard | 60 | 10,000 |
| Professional | 300 | 50,000 |
| Enterprise | 1,000 | Unlimited |

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067200
```

---

## Response Format

All responses follow a consistent JSON format:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "timestamp": "2024-01-06T12:00:00Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": { ... },
  "timestamp": "2024-01-06T12:00:00Z"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `RATE_LIMITED` | 429 | Too many requests |
| `CREDIT_EXCEEDED` | 402 | Credit limit exceeded |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Endpoints

### Quotes

#### Create Quote

Generate a price quote for a delivery.

```http
POST /quotes
```

**Request Body:**

```json
{
  "pickupAddress": "123 Pickup Street, London",
  "pickupPostcode": "SW1A 1AA",
  "deliveryAddress": "456 Delivery Road, Manchester",
  "deliveryPostcode": "M1 1AA",
  "vehicleType": "LARGE_VAN",
  "requestedDate": "2024-01-15T09:00:00Z",
  "requestedTimeSlot": "MORNING",
  "helpers": 1,
  "floorAccess": "LIFT",
  "floorNumber": 3,
  "itemDescription": "Office furniture - 5 desks, 10 chairs",
  "specialRequirements": "Fragile items, handle with care",
  "poNumber": "PO-2024-001",
  "reference": "Move-Jan-2024"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "qt_abc123def456",
    "quoteNumber": "Q-2024-00001",
    "status": "PENDING",
    "priceGBP": 28500,
    "priceBreakdown": {
      "basePrice": 22000,
      "distanceCharge": 4500,
      "helperCharge": 2000,
      "floorCharge": 0,
      "discounts": 0,
      "subtotal": 28500,
      "vat": 5700,
      "total": 34200
    },
    "validUntil": "2024-01-13T23:59:59Z",
    "estimatedDistance": 200,
    "estimatedDuration": 240,
    "createdAt": "2024-01-06T12:00:00Z"
  }
}
```

#### List Quotes

```http
GET /quotes?status=PENDING&page=1&limit=20
```

#### Get Quote

```http
GET /quotes/{quoteId}
```

#### Accept Quote

Convert a quote to a booking.

```http
POST /quotes/{quoteId}/accept
```

**Request Body:**

```json
{
  "poNumber": "PO-2024-001",
  "contactName": "John Smith",
  "contactPhone": "+44 7700 900000",
  "specialInstructions": "Call 30 minutes before arrival"
}
```

---

### Bookings

#### Create Booking

Create a booking directly (without a quote).

```http
POST /bookings
```

**Request Body:**

```json
{
  "pickupAddress": "123 Pickup Street, London",
  "pickupPostcode": "SW1A 1AA",
  "pickupContactName": "Jane Doe",
  "pickupContactPhone": "+44 7700 900001",
  "deliveryAddress": "456 Delivery Road, Manchester",
  "deliveryPostcode": "M1 1AA",
  "deliveryContactName": "Bob Wilson",
  "deliveryContactPhone": "+44 7700 900002",
  "vehicleType": "MEDIUM_VAN",
  "scheduledDate": "2024-01-15T10:00:00Z",
  "scheduledTimeSlot": "MORNING",
  "helpers": 0,
  "itemDescription": "10 boxes of documents",
  "poNumber": "PO-2024-002"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "bk_xyz789ghi012",
    "reference": "SV-2024-00001",
    "status": "CONFIRMED",
    "priceGBP": 15000,
    "scheduledDate": "2024-01-15T10:00:00Z",
    "trackingUrl": "https://track.speedyvan.com/SV-2024-00001",
    "createdAt": "2024-01-06T12:30:00Z"
  }
}
```

#### List Bookings

```http
GET /bookings?status=CONFIRMED&startDate=2024-01-01&endDate=2024-01-31&page=1&limit=20
```

#### Get Booking

```http
GET /bookings/{bookingId}
```

#### Cancel Booking

```http
DELETE /bookings/{bookingId}
```

**Request Body:**

```json
{
  "reason": "Customer requested cancellation"
}
```

---

### Tracking

#### Get Tracking Status

```http
GET /bookings/{bookingId}/tracking
```

**Response:**

```json
{
  "success": true,
  "data": {
    "bookingId": "bk_xyz789ghi012",
    "reference": "SV-2024-00001",
    "status": "IN_PROGRESS",
    "driver": {
      "name": "Mike Driver",
      "phone": "+44 7700 900999",
      "vehicleReg": "AB12 CDE"
    },
    "currentLocation": {
      "latitude": 52.4862,
      "longitude": -1.8904,
      "updatedAt": "2024-01-15T11:30:00Z"
    },
    "eta": "2024-01-15T14:00:00Z",
    "timeline": [
      {
        "status": "CONFIRMED",
        "timestamp": "2024-01-06T12:30:00Z"
      },
      {
        "status": "ASSIGNED",
        "timestamp": "2024-01-15T08:00:00Z"
      },
      {
        "status": "PICKED_UP",
        "timestamp": "2024-01-15T10:15:00Z"
      },
      {
        "status": "IN_TRANSIT",
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

### Invoices

#### List Invoices

```http
GET /invoices?status=SENT&overdueOnly=false&page=1&limit=20
```

#### Get Invoice

```http
GET /invoices/{invoiceId}
```

#### Download Invoice PDF

```http
GET /invoices/{invoiceId}/pdf
```

Returns the invoice as a PDF file.

---

### Company

#### Get Company Details

```http
GET /company
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "co_abc123",
    "name": "Acme Corporation",
    "creditLimitGBP": 1000000,
    "currentBalanceGBP": 250000,
    "availableCreditGBP": 750000,
    "paymentTermsDays": 30,
    "status": "ACTIVE"
  }
}
```

---

## Webhooks

Receive real-time notifications for events.

### Supported Events

| Event | Description |
|-------|-------------|
| `booking.created` | New booking created |
| `booking.confirmed` | Booking confirmed |
| `booking.assigned` | Driver assigned |
| `booking.started` | Pickup completed, in transit |
| `booking.completed` | Delivery completed |
| `booking.cancelled` | Booking cancelled |
| `quote.created` | New quote generated |
| `quote.accepted` | Quote accepted |
| `quote.expired` | Quote expired |
| `invoice.created` | New invoice generated |
| `invoice.sent` | Invoice sent |
| `invoice.paid` | Invoice marked as paid |
| `invoice.overdue` | Invoice is overdue |

### Webhook Payload

```json
{
  "id": "evt_abc123",
  "type": "booking.completed",
  "timestamp": "2024-01-15T14:30:00Z",
  "data": {
    "bookingId": "bk_xyz789ghi012",
    "reference": "SV-2024-00001",
    "status": "COMPLETED",
    "completedAt": "2024-01-15T14:30:00Z"
  }
}
```

### Webhook Signature

Verify webhook authenticity using the signature header:

```http
X-Webhook-Signature: sha256=abc123...
```

Verification code (Node.js):

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expected}`)
  );
}
```

### Managing Webhooks

#### Create Webhook

```http
POST /webhooks
```

```json
{
  "url": "https://your-server.com/webhooks/speedyvan",
  "events": ["booking.completed", "invoice.created"],
  "description": "Production webhook"
}
```

#### List Webhooks

```http
GET /webhooks
```

#### Delete Webhook

```http
DELETE /webhooks/{webhookId}
```

---

## Vehicle Types

| Type | Description | Max Weight | Max Volume |
|------|-------------|------------|------------|
| `SMALL_VAN` | Small van | 500kg | 3m³ |
| `MEDIUM_VAN` | Medium van | 800kg | 6m³ |
| `LARGE_VAN` | Large van | 1,200kg | 10m³ |
| `LUTON` | Luton van | 1,500kg | 15m³ |
| `XLWB` | Extra long wheelbase | 1,200kg | 12m³ |

---

## Time Slots

| Slot | Time Range |
|------|------------|
| `MORNING` | 08:00 - 12:00 |
| `AFTERNOON` | 12:00 - 17:00 |
| `EVENING` | 17:00 - 21:00 |
| `ANYTIME` | 08:00 - 21:00 |

---

## SDK & Libraries

### Official SDKs

- **Node.js:** `npm install @speedyvan/b2b-sdk`
- **Python:** `pip install speedyvan-b2b`
- **PHP:** `composer require speedyvan/b2b-sdk`

### Example: Node.js

```javascript
const SpeedyVan = require('@speedyvan/b2b-sdk');

const client = new SpeedyVan({
  apiKey: 'sv_b2b_your_api_key'
});

// Create a quote
const quote = await client.quotes.create({
  pickupPostcode: 'SW1A 1AA',
  deliveryPostcode: 'M1 1AA',
  vehicleType: 'LARGE_VAN',
  requestedDate: new Date('2024-01-15')
});

console.log(`Quote: £${quote.priceGBP / 100}`);

// Accept quote and create booking
const booking = await client.quotes.accept(quote.id, {
  contactName: 'John Smith',
  contactPhone: '+44 7700 900000'
});

console.log(`Booking Reference: ${booking.reference}`);
```

---

## Support

- **Email:** api-support@speedyvan.com
- **Documentation:** https://docs.speedyvan.com/b2b
- **Status Page:** https://status.speedyvan.com

---

## Changelog

### v1.0.0 (January 2024)

- Initial release
- Quote and booking management
- Invoice retrieval
- Real-time tracking
- Webhook support

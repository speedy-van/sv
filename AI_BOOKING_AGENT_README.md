# Speedy AI Chatbot - Full Booking Agent

## Overview

The Speedy AI chatbot has been upgraded to a **fully capable booking agent** that can handle the entire booking process from initial inquiry to payment confirmation, without requiring users to switch to the standard UI.

## Features

### 1. **Complete Booking Flow**
- ✅ Collects pickup and drop-off addresses
- ✅ Gathers item/room information
- ✅ Calculates real-time pricing with 3 service tiers (Economy, Standard, Priority)
- ✅ Collects customer details (name, email, phone)
- ✅ Creates booking in database
- ✅ Redirects to Stripe for secure payment
- ✅ Sends confirmation email with order number and tracking link

### 2. **AI Intelligence**
- Natural language understanding
- Context-aware conversations
- Item recognition from UK Removal Dataset
- Smart data extraction (addresses, dates, items)
- Prevents repetitive questions

### 3. **Payment Integration**
- Stripe Checkout integration
- Secure payment redirect
- Success and cancellation page handling
- Automatic booking creation
- Payment confirmation webhooks

## Architecture

```
User Chat → AI API → Booking Creation → Stripe Payment → Email Confirmation
```

### Key Components

#### 1. **SpeedyAIBot Component** (`/src/components/site/SpeedyAIBot.tsx`)
- Chat interface with microphone and file upload
- Displays pricing tiers and payment button
- Handles quote calculation and booking creation
- Redirects to Stripe payment

#### 2. **AI Chat API** (`/src/app/api/ai/chat/route.ts`)
- Enhanced system prompt with booking logic
- Extracts customer data from conversation
- Determines quote readiness and payment readiness
- RAG (Retrieval-Augmented Generation) for item suggestions

#### 3. **Create Booking API** (`/src/app/api/ai/create-booking/route.ts`)
- Creates complete booking in database
- Links addresses, properties, and items
- Generates Stripe Checkout session
- Returns payment URL

#### 4. **Success/Cancellation Pages**
- `/booking/success` - Shows booking details and tracking link
- `/booking/cancelled` - Handles payment cancellation

## User Flow

### Step 1: Information Gathering
```
User: "I need to move from SW1A 1AA to W1A 1AA"
AI: "Great! What items are you moving?"
User: "A 3-seater sofa and 10 boxes"
AI: "When would you like to move?"
User: "Next Friday"
```

### Step 2: Quote Calculation
```
AI: "Perfect! Here's your instant quote:
    💰 Total: £180.00
    🚚 Vehicle: Medium Van
    ⏱️ Duration: 2-3 hours
    
    Three service options:
    - Economy: £150
    - Standard: £180 (Recommended)
    - Priority: £220"
```

### Step 3: Customer Details
```
AI: "To complete your booking, I need your contact details.
     What's your name?"
User: "John Smith"
AI: "And your email?"
User: "john@example.com"
AI: "Finally, your phone number?"
User: "+44 7700 900000"
```

### Step 4: Payment
```
AI: "Perfect! I have all your details. I'll create your booking now
     and redirect you to secure payment. Your booking number will be
     sent to your email."
     
[Proceed to Payment Button]
```

### Step 5: Confirmation
- User redirected to Stripe
- Payment completed
- Booking confirmed
- Email sent with:
  - Booking number (e.g., SV-AI-1234567890-ABC123)
  - Tracking link
  - Pickup/dropoff details
  - Service summary

## API Endpoints

### `/api/ai/chat` (POST)
**Request:**
```json
{
  "message": "I need to move a sofa",
  "conversationHistory": [...],
  "extractedData": {
    "pickupAddress": "...",
    "dropoffAddress": "...",
    "specialItems": ["sofa"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "AI response text",
  "extractedData": { ... },
  "shouldCalculateQuote": true,
  "isReadyForPayment": false
}
```

### `/api/ai/create-booking` (POST)
**Request:**
```json
{
  "customerDetails": {
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@example.com",
    "phone": "+44 7700 900000"
  },
  "pickupAddress": {
    "full": "123 Street, London SW1A 1AA",
    "postcode": "SW1A 1AA",
    "coordinates": { "lat": 51.5, "lng": -0.1 }
  },
  "dropoffAddress": { ... },
  "items": [
    { "id": "...", "name": "Sofa 3-seater", "quantity": 1 }
  ],
  "serviceType": "standard",
  "pickupDate": "2025-12-01",
  "pricing": {
    "subtotal": 150,
    "vat": 30,
    "total": 180,
    "distance": 10
  }
}
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "clx...",
    "bookingNumber": "SV-AI-1234567890-ABC123",
    "status": "DRAFT"
  },
  "payment": {
    "sessionId": "cs_...",
    "url": "https://checkout.stripe.com/..."
  }
}
```

### `/api/bookings/[id]` (GET)
Returns booking details including tracking link.

## Database Schema

### Booking
- Links to: `BookingAddress`, `PropertyDetails`, `BookingItem`, `Payment`
- Status: `DRAFT` → `PENDING` → `CONFIRMED` → ...
- Stores customer info, addresses, pricing, service details

### BookingAddress
- Simple structure: `label`, `postcode`, `lat`, `lng`

### PropertyDetails
- `propertyType`: HOUSE | APARTMENT | OFFICE
- `accessType`: GROUND_FLOOR | WITH_LIFT | WITHOUT_LIFT
- `floors`: Number

### BookingItem
- `name`, `quantity`, `volumeM3`, `category`
- Linked to booking via `bookingId`

### Payment
- Stripe integration
- `provider`: "stripe"
- `intentId`: Stripe Payment Intent ID
- `status`: unpaid | paid | refunded | cancelled

## Configuration

### Environment Variables
```env
# Groq AI (for chatbot)
GROQ_API_KEY_CUSTOMER=gsk_...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...

# Database
DATABASE_URL=postgresql://...

# App
NEXT_PUBLIC_BASE_URL=https://speedy-van.co.uk
```

## Stripe Webhook Setup

1. Create webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
2. Listen for: `checkout.session.completed`
3. Update booking status to `CONFIRMED`
4. Send confirmation email

## Email Template

After successful payment, customer receives:

```
Subject: Booking Confirmed - SV-AI-1234567890-ABC123

Hi John,

Your booking has been confirmed!

Booking Number: SV-AI-1234567890-ABC123
Service: STANDARD
Date: Friday, 1 December 2025

Pickup: 123 Street, London SW1A 1AA
Drop-off: 456 Avenue, London W1A 1AA

Total Paid: £180.00

Track your booking: https://speedy-van.co.uk/track/SV-AI-1234567890-ABC123

Need help? support@speedy-van.co.uk | 01202129764
```

## Testing

### Test Conversation Flow
```javascript
// 1. Start chat
POST /api/ai/chat
{ "message": "I need to move" }

// 2. Provide details
POST /api/ai/chat
{ "message": "From SW1A 1AA to W1A 1AA, 2 bedroom flat" }

// 3. Get customer details
POST /api/ai/chat
{ "message": "John Smith, john@test.com, 07700900000" }

// 4. Create booking
POST /api/ai/create-booking
{ ... full booking data ... }

// 5. Complete payment on Stripe test mode
// Use card: 4242 4242 4242 4242
```

## Future Enhancements

- [ ] Multi-language support (Arabic, Polish, etc.)
- [ ] Voice-only booking (fully conversational)
- [ ] Image recognition for item identification
- [ ] Real-time driver availability
- [ ] Dynamic pricing based on demand
- [ ] SMS confirmations
- [ ] WhatsApp integration
- [ ] Calendar sync (Google Calendar, iCal)

## Support

For technical issues:
- **Developer**: Mr Ahmad Alwakai (Lead Developer)
- **Email**: support@speedy-van.co.uk
- **Phone**: 01202129764

---

**Note**: This system is production-ready and fully integrated with booking-luxury pricing engine, UK Removal Dataset, and Stripe payments.

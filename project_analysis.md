# Speedy Van Project Analysis

## Current System Overview

The Speedy Van project is a comprehensive moving and delivery service platform with the following key components:

### Architecture
- **Frontend**: Next.js application
- **Backend**: Node.js API
- **Database**: PostgreSQL (Neon for production)
- **Payment**: Stripe integration
- **Maps**: Mapbox integration
- **SMS**: TheSMSWorks
- **Email**: ZeptoMail
- **Real-time**: Pusher

### Current Booking Flow
The system currently has a **2-step booking process**:

**Step 1: Where & What (Comprehensive Details)**
- Pickup address with autocomplete
- Delivery address with autocomplete
- Property details for both locations
- Item categories and quantity selection
- Service type selection
- Date & time scheduling
- Real-time pricing calculation

**Step 2: Customer Details & Payment (Auto-Confirmation)**
- Customer information
- Contact verification
- Payment method selection (Stripe)
- Terms & privacy acceptance
- Special instructions
- Payment processing
- Automatic confirmation upon payment success

### Key Features
- Address autocomplete with Google Places API (primary) and Mapbox (fallback)
- Real-time pricing engine
- SMS and email confirmations
- Driver portal and management
- Admin dashboard
- Order lifecycle tracking
- Customer portal

### Luxury Booking Requirements
Based on the related knowledge, the system needs:
- Premium address autocomplete (Google Places primary, Mapbox fallback)
- UK-only results with structured address components
- Postcode-driven accuracy
- Debounced input (250-300ms)
- Map preview functionality
- Error handling and validation

## Next Steps
Need to research competitor workflows and design enhanced luxury booking experience.

# Invoice System Implementation

## Overview

This document outlines the comprehensive invoice system implemented for the Speedy Van platform, which automatically generates invoices after successful payment and provides access to invoices for both customers and administrators.

## Features

### 1. Automatic Invoice Generation

- **Trigger**: Invoices are automatically created when a Stripe webhook confirms payment success
- **Data Source**: Complete booking information including pricing breakdown, addresses, and customer details
- **Invoice Number**: Uses the unified booking ID format (e.g., "INV-SV2025011500001")

### 2. Customer Invoice Access

- **Dashboard Integration**: New "Invoices" tab in customer dashboard
- **Invoice List**: Shows all invoices with key details (amount, addresses, dates)
- **PDF Download**: Direct download of professional PDF invoices
- **Detailed View**: Expandable cards showing full invoice breakdown

### 3. Admin Invoice Management

- **Finance Dashboard**: Enhanced admin finance section with invoice management
- **Invoice List**: Comprehensive view of all system invoices
- **Search & Filtering**: By status, date range, customer, or invoice number
- **PDF Access**: Admin can download any invoice PDF
- **Statistics**: Revenue and invoice count summaries

## Database Schema

### New Invoice Model

```prisma
model Invoice {
  id                    String   @id @default(cuid())
  invoiceNumber         String   @unique // e.g., "INV-SV2025011500001"
  bookingId             String   @unique
  booking               Booking  @relation(fields: [bookingId], references: [id])

  // Customer information
  customerName          String
  customerEmail         String
  customerPhone         String

  // Service details
  pickupAddress         String
  dropoffAddress        String
  scheduledAt           DateTime
  crewSize              String

  // Pricing breakdown
  baseDistanceMiles     Float
  distanceCostGBP       Int
  accessSurchargeGBP    Int
  weatherSurchargeGBP   Int
  itemsSurchargeGBP     Int
  crewMultiplierPercent Int
  availabilityMultiplierPercent Int
  totalGBP              Int

  // Payment information
  stripePaymentIntentId String?
  paidAt                DateTime

  // Invoice metadata
  status                String   @default("paid")
  generatedAt           DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // PDF storage (optional)
  pdfUrl                String?

  @@index([customerEmail])
  @@index([paidAt])
  @@index([status])
  @@index([generatedAt])
}
```

### Updated Booking Model

```prisma
model Booking {
  // ... existing fields ...
  Invoice    Invoice?  // New relation
}
```

## API Endpoints

### 1. Customer Invoice APIs

- **GET** `/api/customer/invoices` - Fetch customer's invoices
- **GET** `/api/customer/invoices/[id]/pdf` - Download invoice PDF

### 2. Admin Invoice APIs

- **GET** `/api/admin/finance/invoices` - Fetch all invoices with filtering
- **GET** `/api/admin/invoices/[id]/pdf` - Download any invoice PDF

### 3. Invoice Generation

- **POST** `/api/invoice/generate` - Legacy endpoint (kept for compatibility)

## Service Layer

### Invoice Service (`/lib/invoices.ts`)

```typescript
// Core functions
- createInvoiceForBooking() - Creates invoice after payment
- getCustomerInvoices() - Fetches invoices for a customer
- getAdminInvoices() - Fetches invoices for admin with filtering
- getInvoiceById() - Gets specific invoice details
- generateInvoicePDF() - Generates PDF using existing PDF library
```

### Key Features

- **Automatic Creation**: Triggered by Stripe webhook
- **Data Validation**: Ensures booking is confirmed before invoice creation
- **Address Formatting**: Converts address objects to readable strings
- **PDF Generation**: Uses existing PDFKit infrastructure
- **Error Handling**: Graceful fallback if invoice creation fails

## Frontend Integration

### 1. Customer Dashboard

- **New Tab**: "Invoices" tab with badge showing count
- **Invoice Cards**: Expandable cards showing invoice details
- **Download Button**: Direct PDF download functionality
- **Responsive Design**: Works on all device sizes

### 2. Admin Finance Dashboard

- **Enhanced List**: Uses new invoice service for better performance
- **Filtering**: Search by invoice number, customer, or date range
- **Statistics**: Revenue and invoice count summaries
- **PDF Access**: Download any invoice for administrative purposes

### 3. Payment Success Flow

- **Automatic Generation**: Invoice created immediately after payment
- **Customer Access**: Available in dashboard immediately
- **Admin Notification**: Admin can see invoice in finance section

## PDF Generation

### Invoice PDF Features

- **Professional Layout**: Company branding and contact information
- **Complete Details**: All booking information and pricing breakdown
- **Address Information**: Formatted pickup and dropoff addresses
- **Price Breakdown**: Detailed cost analysis including surcharges
- **Payment Status**: Clear indication of payment completion

### Technical Implementation

- **PDFKit Integration**: Uses existing PDF generation library
- **Template System**: Consistent invoice formatting
- **Dynamic Content**: Populated with actual booking data
- **Download Handling**: Proper HTTP headers for file download

## Data Flow

### 1. Payment Success

```
Stripe Webhook → Booking Confirmation → Invoice Creation → Database Storage
```

### 2. Customer Access

```
Customer Login → Dashboard → Invoices Tab → Invoice List → PDF Download
```

### 3. Admin Access

```
Admin Login → Finance Dashboard → Invoices → Search/Filter → PDF Download
```

## Security & Access Control

### Customer Access

- **Authentication Required**: Must be logged in as customer
- **Ownership Verification**: Can only access own invoices
- **Email Matching**: Invoice email must match customer account

### Admin Access

- **Role Verification**: Must have admin role
- **Full Access**: Can view and download any invoice
- **Audit Trail**: All admin actions are logged

## Error Handling

### Invoice Creation Failures

- **Non-blocking**: Webhook continues even if invoice creation fails
- **Logging**: Detailed error logging for debugging
- **Fallback**: System continues to function without invoice

### PDF Generation Issues

- **Graceful Degradation**: Returns error response if PDF fails
- **User Feedback**: Clear error messages for users
- **Retry Logic**: Can be retried by refreshing

## Performance Considerations

### Database Optimization

- **Indexed Fields**: Fast queries on common search fields
- **Efficient Joins**: Optimized relationships with booking data
- **Pagination**: Large invoice lists are paginated

### PDF Generation

- **On-Demand**: PDFs generated when requested, not stored
- **Caching**: Future enhancement for frequently accessed invoices
- **Async Processing**: Non-blocking PDF generation

## Future Enhancements

### 1. Invoice Templates

- **Customizable**: Different templates for different service types
- **Branding**: Company logo and styling options
- **Multi-language**: Support for different languages

### 2. Advanced Features

- **Email Delivery**: Automatic invoice email to customers
- **Digital Signatures**: Electronic signature capabilities
- **Payment Integration**: Direct payment from invoice PDF

### 3. Analytics

- **Invoice Metrics**: Revenue tracking and analysis
- **Customer Insights**: Payment patterns and preferences
- **Business Intelligence**: Financial reporting and forecasting

## Testing

### Test Scenarios

- **Payment Success**: Verify invoice creation after payment
- **Customer Access**: Ensure customers can view and download invoices
- **Admin Access**: Verify admin can access all invoices
- **PDF Generation**: Test PDF creation and download
- **Error Handling**: Test various failure scenarios

### Test Data

- **Sample Bookings**: Various booking types and amounts
- **Customer Accounts**: Multiple customer profiles
- **Admin Users**: Different admin roles and permissions

## Deployment

### Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes (development)
npx prisma db push

# Create migration (production)
npx prisma migrate dev --name add_invoice_model
```

### Environment Variables

```env
# Ensure these are set for PDF generation
DATABASE_URL=your_database_url
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

## Monitoring & Maintenance

### Health Checks

- **Invoice Creation**: Monitor success/failure rates
- **PDF Generation**: Track generation times and errors
- **Database Performance**: Monitor query performance

### Maintenance Tasks

- **Invoice Cleanup**: Archive old invoices if needed
- **PDF Storage**: Manage PDF file storage if implemented
- **Performance Tuning**: Optimize database queries

## Conclusion

The invoice system provides a comprehensive solution for automatic invoice generation and management, ensuring that customers have easy access to their invoices while giving administrators full control over the financial documentation. The system is designed to be robust, scalable, and user-friendly, with proper error handling and security measures in place.

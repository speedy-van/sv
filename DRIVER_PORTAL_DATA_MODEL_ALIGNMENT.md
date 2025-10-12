# Driver Portal Data Model Alignment

This document shows how the current Prisma schema aligns with the minimal data model specified in `cursor_tasks.md`.

## Minimal Data Model Requirements vs Current Implementation

### ✅ **Fully Implemented Models**

| Cursor Tasks Model                                                   | Current Schema Model       | Status      | Notes                                                        |
| -------------------------------------------------------------------- | -------------------------- | ----------- | ------------------------------------------------------------ |
| `Driver(id, userId, status, reviewStatus, rating, vehicleType)`      | `Driver` model             | ✅ Complete | Added `rating` field in latest migration                     |
| `DriverProfile(driverId, phone, address, dob)`                       | `DriverProfile` model      | ✅ Complete | Added in latest migration                                    |
| `Vehicle(driverId, type, capacity, plate)`                           | `DriverVehicle` model      | ✅ Complete | More comprehensive than minimal model                        |
| `Document(id, driverId, type, url, expiresAt, status)`               | `Document` model           | ✅ Complete | More comprehensive with categories and verification          |
| `JobAssignment(jobId, driverId, state, claimedAt)`                   | `Assignment` model         | ✅ Complete | Added `claimedAt` and proper status enum in latest migration |
| `JobEvent(id, jobId, driverId, step, payload, createdAt)`            | `JobEvent` model           | ✅ Complete | Links to Assignment instead of Job directly                  |
| `DriverStatus(driverId, availability, lastSeenAt, lastLat, lastLng)` | `DriverAvailability` model | ✅ Complete | More comprehensive with location consent                     |
| `Payout(id, driverId, amount, status, createdAt)`                    | `DriverPayout` model       | ✅ Complete | More comprehensive with Stripe integration                   |

### 🔄 **Enhanced Beyond Minimal Requirements**

| Current Schema Model | Additional Features                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `Driver`             | - `onboardingStatus` enum<br>- `basePostcode`<br>- `rightToWorkType`<br>- `approvedAt`<br>- Comprehensive relations         |
| `DriverVehicle`      | - `make`, `model`, `reg`<br>- `weightClass`, `motExpiry`<br>- `photos` JSON field                                           |
| `Document`           | - `category` enum (rtw, licence, insurance, etc.)<br>- `hash`, `uploadedAt`, `verifiedAt`<br>- `verifiedBy` for audit trail |
| `Assignment`         | - `round`, `score`, `expiresAt`<br>- Comprehensive relations to events, earnings, tips, ratings                             |
| `JobEvent`           | - `mediaUrls` array<br>- `notes` field<br>- `JobStep` enum with detailed steps                                              |
| `DriverAvailability` | - `locationConsent` boolean<br>- Proper indexing                                                                            |
| `DriverPayout`       | - `stripeTransferId`, `bankAccountId`<br>- `processedAt`, `failedAt`, `failureReason`<br>- Relations to earnings            |

### 📋 **Job Model Design Decision**

**Cursor Tasks Minimal Model:**

```
Job(id, status, pickup, dropoff, scheduledAt, payout)
```

**Current Implementation:**

- Uses `Booking` model as the job entity
- `Booking` contains all required fields:
  - `id` ✅
  - `status` ✅
  - `pickup` → `pickupAddress` ✅
  - `dropoff` → `dropoffAddress` ✅
  - `scheduledAt` → `preferredDate` ✅
  - `payout` → `amountPence` ✅

**Rationale:** The current design is semantically superior because:

1. `Booking` represents the customer's booking request
2. `Assignment` represents the driver's assignment to that booking
3. This separation allows for better tracking of the booking lifecycle

### 🎯 **Additional Models Beyond Minimal Requirements**

The current schema includes several additional models that enhance the driver portal functionality:

- `DriverChecks` - Comprehensive background check tracking
- `DriverShift` - Shift scheduling and recurring availability
- `DriverEarnings` - Detailed earnings breakdown per assignment
- `DriverTip` - Tip tracking and reconciliation
- `DriverPayoutSettings` - Bank account and payout preferences
- `DriverRating` - Customer ratings and reviews
- `DriverIncident` - Incident reporting and tracking
- `DriverPerformance` - Calculated performance metrics
- `PushSubscription` - Push notification subscriptions
- `DriverNotification` - In-app notifications
- `DriverNotificationPreferences` - Notification preferences
- `TrackingPing` - Real-time location tracking
- `PricingConfig` - Dynamic pricing configuration
- `QuoteSnapshot` - Immutable quote snapshots
- `AuditLog` - Comprehensive audit trail
- `ConsentLog` - Privacy consent tracking
- `AccountDeletionRequest` - GDPR compliance

### ✅ **Migration Status**

The latest migration `20250815110256_add_driver_profile_and_assignment_improvements` successfully added:

1. **DriverProfile model** with fields:
   - `id`, `driverId`, `phone`, `address`, `dob`
   - Proper indexing and foreign key constraints

2. **Enhanced Assignment model** with:
   - `claimedAt` field for tracking when jobs are claimed
   - `AssignmentStatus` enum with proper values: `invited`, `claimed`, `accepted`, `declined`, `completed`, `cancelled`

3. **Enhanced Driver model** with:
   - `rating` field for storing driver ratings

### 🚀 **Next Steps**

The data model is now fully aligned with the cursor_tasks minimal requirements and ready for implementing the driver portal features. The schema provides a solid foundation for:

1. **Foundations & Access Control** (Step 1)
2. **Authentication & Onboarding** (Step 2)
3. **Profile & Compliance** (Step 3)
4. **Driver Dashboard** (Step 4)
5. **Availability, Shifts & Location** (Step 5)
6. **Job Feed & Claiming** (Step 6)
7. **Active Job Lifecycle** (Step 7)
8. **Navigation & Live Tracking** (Step 8)
9. **Earnings, Payouts & Tips** (Step 9)
10. **Schedule & Calendar** (Step 10)
11. **Documents & Expiry Alerts** (Step 11)
12. **Ratings, Incidents & Performance** (Step 12)
13. **Notifications & Realtime** (Step 13)
14. **Settings** (Step 14)
15. **Offline & Edge Cases** (Step 15)
16. **QA, Telemetry & Release** (Step 16)

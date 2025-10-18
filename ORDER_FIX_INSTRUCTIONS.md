# 🔧 Fix Order: SVMGOKZP00TV6F

## 📋 Current Issues:
1. ❌ Distance: NOT CALCULATED
2. ❌ Duration: Only 1h (default, not real)
3. ⚠️ Status: PENDING_PAYMENT (may be paid)
4. ⚠️ No driver assigned
5. ⚠️ Pickup floor: NOT SPECIFIED
6. ⚠️ Dropoff floor: NOT SPECIFIED

---

## 🎯 Quick Fix - Run in Neon SQL Editor:

### **Copy and paste this complete SQL:**

```sql
-- Update Pickup Address Coordinates (Birmingham)
UPDATE "BookingAddress"
SET lat = 52.4797, lng = -1.9026
WHERE id = (
  SELECT "pickupAddressId" FROM "Booking" WHERE reference = 'SVMGOKZP00TV6F'
) AND (lat = 0 OR lat IS NULL);

-- Update Dropoff Address Coordinates (Glasgow)
UPDATE "BookingAddress"
SET lat = 55.8561, lng = -4.2518
WHERE id = (
  SELECT "dropoffAddressId" FROM "Booking" WHERE reference = 'SVMGOKZP00TV6F'
) AND (lat = 0 OR lat IS NULL);

-- Calculate and Update Booking Distance/Duration
UPDATE "Booking"
SET 
  "distanceMeters" = 474000,
  "durationSeconds" = 36294,
  "pickupLat" = 52.4797,
  "pickupLng" = -1.9026,
  "dropoffLat" = 55.8561,
  "dropoffLng" = -4.2518,
  "baseDistanceMiles" = 294.5
WHERE reference = 'SVMGOKZP00TV6F';

-- Verify Results
SELECT 
  reference,
  status,
  "totalGBP" / 100.0 as customer_paid_gbp,
  "distanceMeters",
  ROUND("distanceMeters" / 1609.34, 2) as distance_miles,
  "durationSeconds",
  ROUND("durationSeconds" / 60.0, 0) as duration_minutes,
  -- Estimated Driver Earnings
  ROUND(25.00 + ("distanceMeters" / 1609.34) * 0.55 + ("durationSeconds" / 60.0) * 0.15, 2) as driver_earnings_gbp
FROM "Booking"
WHERE reference = 'SVMGOKZP00TV6F';
```

---

## 💰 **Expected Results:**

```
Customer Paid: £618.04
Distance: 294.5 miles (Birmingham → Glasgow)
Duration: 605 minutes (~10 hours)

Driver Earnings:
  Base Fare: £25.00
  Mileage (294.5 × £0.55): £162.00
  Time (605 min × £0.15): £90.75
  ═══════════════════════════
  TOTAL: £277.75 ✅
```

---

## ⚠️ **Payment Status:**

Check if this order was actually paid:
1. Go to Stripe Dashboard
2. Search for payment intent ID
3. If paid → Update status to CONFIRMED

**SQL to confirm payment (if verified):**
```sql
UPDATE "Booking"
SET 
  status = 'CONFIRMED',
  "paidAt" = NOW()
WHERE reference = 'SVMGOKZP00TV6F'
  AND "stripePaymentIntentId" IS NOT NULL;
```

---

## ✅ **After Running SQL:**

The order will show:
- ✅ Distance: 294.5 miles
- ✅ Duration: ~10 hours
- ✅ Driver Earnings: £277.75
- ✅ Ready for driver assignment

Then you can assign a driver from Admin Dashboard!


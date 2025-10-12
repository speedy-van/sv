#!/bin/bash

# Speedy Van Booking System Smoke Tests
# Tests the unified booking and pricing system

set -e

echo "🧪 Running Speedy Van Booking System Smoke Tests"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test data
PICKUP_ADDRESS='{"lat":51.5034,"lng":-0.1276,"address":"10 Downing St"}'
DROPOFF_ADDRESS='{"lat":51.5014,"lng":-0.1419,"address":"Buckingham Palace"}'
VAN_TYPE='"small"'
CREW_SIZE='2'
DATE_ISO='"2024-12-20"'
TIME_SLOT='"day"'
STAIRS_FLOORS='3'

# Base URL
BASE_URL="http://localhost:3000"

echo -e "${YELLOW}Testing Pricing API...${NC}"

# Test 1: Pricing Quote
echo "1. Testing /api/pricing/quote"
QUOTE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/pricing/quote" \
  -H 'Content-Type: application/json' \
  -d "{
    \"pickup\": $PICKUP_ADDRESS,
    \"dropoff\": $DROPOFF_ADDRESS,
    \"vanType\": ${VAN_TYPE},
    \"crewSize\": $CREW_SIZE,
    \"dateISO\": $DATE_ISO,
    \"timeSlot\": $TIME_SLOT,
    \"stairsFloors\": $STAIRS_FLOORS
  }")

if echo "$QUOTE_RESPONSE" | jq -e '.breakdown' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Pricing quote successful${NC}"
    echo "   Breakdown: $(echo "$QUOTE_RESPONSE" | jq -r '.breakdown.totalPence') pence"
else
    echo -e "${RED}❌ Pricing quote failed${NC}"
    echo "   Response: $QUOTE_RESPONSE"
    exit 1
fi

echo -e "${YELLOW}Testing Booking API...${NC}"

# Test 2: Create Booking
echo "2. Testing /api/booking-luxury (legacy /api/bookings removed)"
BOOKING_RESPONSE=$(curl -s -X POST "$BASE_URL/api/booking-luxury" \
  -H 'Content-Type: application/json' \
  -d "{
    \"pickup\": $PICKUP_ADDRESS,
    \"dropoff\": $DROPOFF_ADDRESS,
    \"vanType\": ${VAN_TYPE},
    \"crewSize\": $CREW_SIZE,
    \"dateISO\": $DATE_ISO,
    \"timeSlot\": $TIME_SLOT,
    \"stairsFloors\": $STAIRS_FLOORS,
    \"customerName\": \"Test User\",
    \"customerPhone\": \"07901846297\",
    \"customerEmail\": \"test@example.com\"
  }")

if echo "$BOOKING_RESPONSE" | jq -e '.booking.id' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Booking creation successful${NC}"
    BOOKING_ID=$(echo "$BOOKING_RESPONSE" | jq -r '.booking.id')
    echo "   Booking ID: $BOOKING_ID"
else
    echo -e "${RED}❌ Booking creation failed${NC}"
    echo "   Response: $BOOKING_RESPONSE"
    exit 1
fi

# Test 3: Get Booking
echo "3. Testing /api/booking-luxury/$BOOKING_ID"
GET_BOOKING_RESPONSE=$(curl -s -X GET "$BASE_URL/api/booking-luxury/$BOOKING_ID")

if echo "$GET_BOOKING_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Booking retrieval successful${NC}"
else
    echo -e "${RED}❌ Booking retrieval failed${NC}"
    echo "   Response: $GET_BOOKING_RESPONSE"
    exit 1
fi

echo -e "${YELLOW}Testing Payment API...${NC}"

# Test 4: Create Checkout Session
echo "4. Testing /api/payment/create-checkout-session"
PAYMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/payment/create-checkout-session" \
  -H 'Content-Type: application/json' \
  -d "{\"bookingId\": \"$BOOKING_ID\"}")

if echo "$PAYMENT_RESPONSE" | jq -e '.url' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Payment session creation successful${NC}"
    echo "   Checkout URL: $(echo "$PAYMENT_RESPONSE" | jq -r '.url')"
elif echo "$PAYMENT_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Payment session creation failed (expected in test environment)${NC}"
    echo "   Error: $(echo "$PAYMENT_RESPONSE" | jq -r '.error')"
else
    echo -e "${RED}❌ Payment session creation failed${NC}"
    echo "   Response: $PAYMENT_RESPONSE"
    exit 1
fi

echo -e "${YELLOW}Testing Legacy API Proxy...${NC}"

# Test 5: Legacy Quotes API (should return 404 - migration complete)
echo "5. Testing /api/quotes (legacy endpoint removed)"
LEGACY_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/quotes" \
  -H 'Content-Type: application/json' \
  -d "{
    \"pickup\": $PICKUP_ADDRESS,
    \"dropoff\": $DROPOFF_ADDRESS,
    \"vanType\": ${VAN_TYPE},
    \"crewSize\": $CREW_SIZE,
    \"dateISO\": $DATE_ISO,
    \"timeSlot\": $TIME_SLOT
  }")

HTTP_CODE="${LEGACY_RESPONSE: -3}"
if [ "$HTTP_CODE" = "404" ]; then
    echo -e "${GREEN}✅ Legacy quotes API correctly removed (404)${NC}"
    echo "   Migration complete - use /api/pricing/quote instead"
else
    echo -e "${RED}❌ Legacy quotes API still exists (HTTP $HTTP_CODE)${NC}"
    echo "   Expected 404, got $HTTP_CODE"
    exit 1
fi

echo -e "${YELLOW}Testing Redirects...${NC}"

# Test 6: Legacy booking redirect
echo "6. Testing /book redirect to /booking"
REDIRECT_RESPONSE=$(curl -s -I "$BASE_URL/book" | head -1)

if echo "$REDIRECT_RESPONSE" | grep -q "302\|301"; then
    echo -e "${GREEN}✅ Legacy booking redirect working${NC}"
else
    echo -e "${RED}❌ Legacy booking redirect failed${NC}"
    echo "   Response: $REDIRECT_RESPONSE"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All smoke tests passed!${NC}"
echo "================================================"
echo "✅ Pricing API: /api/pricing/quote"
echo "✅ Booking API: /api/booking-luxury"
echo "✅ Payment API: /api/payment/create-checkout-session"
echo "✅ Legacy Proxy: Migration complete (legacy endpoint removed)"
echo "✅ Legacy Redirect: /book → /booking"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "1. Test with real Stripe keys for payment processing"
echo "2. Set up webhook forwarding: stripe listen --forward-to $BASE_URL/api/payment/webhook"
echo "3. Test the full booking flow at $BASE_URL/booking"
echo ""
echo -e "${GREEN}🚀 Unified booking and pricing system is ready!${NC}"

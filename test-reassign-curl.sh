#!/bin/bash
# Test Route Reassignment API using curl
# Usage: ./test-reassign-curl.sh <route-id> <driver-id>

ROUTE_ID=${1:-"RT1A2B3C4D"}
DRIVER_ID=${2:-"your-driver-id"}
REASON=${3:-"Testing reassignment fix"}
BASE_URL=${4:-"http://localhost:3000"}

echo "🔄 Testing Route Reassignment..."
echo "URL: $BASE_URL/api/admin/routes/$ROUTE_ID/reassign"
echo ""

curl -X POST "$BASE_URL/api/admin/routes/$ROUTE_ID/reassign" \
  -H "Content-Type: application/json" \
  -d "{
    \"driverId\": \"$DRIVER_ID\",
    \"reason\": \"$REASON\"
  }" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || cat

echo ""
echo "✅ Test completed"







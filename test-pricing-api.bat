@echo off
echo Testing pricing API...

curl -X POST http://localhost:3000/api/pricing/quote ^
  -H "Content-Type: application/json" ^
  -H "X-Correlation-ID: test-$(date +%%s)" ^
  -d "{\"items\":[{\"id\":\"full-house-1bed\",\"name\":\"1 Bedroom House Package\",\"category\":\"full-house\",\"quantity\":1,\"weight\":1500,\"volume\":15.0,\"fragile\":false,\"oversize\":true,\"disassemblyRequired\":false,\"specialHandling\":[]}],\"pickupAddress\":{\"address\":\"123 Test Street, London, SW1A 1AA\",\"postcode\":\"SW1A 1AA\",\"coordinates\":{\"lat\":51.5074,\"lng\":-0.1278}},\"dropoffAddress\":{\"address\":\"456 Test Avenue, Manchester, M1 1AA\",\"postcode\":\"M1 1AA\",\"coordinates\":{\"lat\":53.483959,\"lng\":-2.244644}},\"pickupProperty\":{\"type\":\"house\",\"floors\":0,\"hasLift\":false,\"hasParking\":true,\"accessNotes\":null,\"requiresPermit\":false},\"dropoffProperty\":{\"type\":\"house\",\"floors\":0,\"hasLift\":false,\"hasParking\":true,\"accessNotes\":null,\"requiresPermit\":false},\"serviceType\":\"standard\",\"pickupDate\":\"2025-10-03\",\"pickupTimeSlot\":\"flexible\",\"urgency\":\"scheduled\",\"distance\":0,\"estimatedDuration\":0,\"pricing\":{\"baseFee\":0,\"distanceFee\":0,\"volumeFee\":0,\"serviceFee\":0,\"urgencyFee\":0,\"vat\":0,\"total\":0,\"distance\":0}}"

echo.
echo Test completed.
pause

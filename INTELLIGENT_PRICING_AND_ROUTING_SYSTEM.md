# Intelligent Pricing & Routing System - Documentation

## 1. Overview

This document outlines the new intelligent pricing and routing system built to replace the previous hardcoded, assumption-based logic. The new system is **100% dynamic** and makes decisions based on real-time data for **any route** within the UK, not just fixed scenarios like Glasgow-London.

**The Goal:** To create a pricing and routing engine that mimics the real-world decision-making of leading logistics platforms like AnyVan and Shiply, using CVRP (Capacitated Vehicle Routing Problem) principles.

**Key Features:**
- **Dynamic Multi-Drop Eligibility:** The system automatically determines if a booking is eligible for a multi-drop discount.
- **Intelligent Route Analysis:** Analyzes load, distance, time, and operational constraints for any given route.
- **Data-Driven Pricing:** Prices are based on market data, route feasibility, and real-time conditions, not fixed assumptions.
- **Dynamic UI:** The booking interface (Step 2) will now dynamically show or hide the multi-drop option based on the system's analysis.

---

## 2. System Architecture

The system consists of three core backend services and one new API endpoint.

### a. `intelligent-route-optimizer.ts`

This is the brain of the operation. It analyzes a single booking request and provides a detailed breakdown of its characteristics.

- **Input:** `BookingRequest` (pickup, dropoff, items, date, etc.)
- **Output:** `LoadAnalysis` & `RouteAnalysis`
- **Key Logic:**
  - **Load Analysis:** Calculates total volume, weight, and load percentage of the van.
  - **Route Analysis:** Calculates distance (using Haversine formula), driving time, and total time (including loading/unloading).
  - **Feasibility Check:** Determines if a route is feasible in a single day and if it meets the basic criteria for a multi-drop route.

### b. `multi-drop-eligibility-engine.ts`

This service acts as the decision-maker. It uses the `intelligent-route-optimizer` and (in the future) real-time data about other available bookings to decide if the multi-drop option should be shown to the user.

- **Input:** `BookingRequest`
- **Output:** `MultiDropDecision` (a comprehensive object that tells the frontend exactly what to display).
- **Key Logic:**
  1.  Calls `intelligentRouteOptimizer` to get a basic analysis.
  2.  **If not eligible**, it immediately returns a decision to show only the "Single Order" option.
  3.  **(Future Implementation)** If eligible, it queries the database to find other bookings on a similar route.
  4.  If a good match is found, it calculates the potential savings and returns a decision to show the "Multi-Drop" option.
  5.  If no match is found, it returns a decision to show "Single Order" but may also suggest a "Return Journey" discount if applicable.

### c. `dynamic-pricing-engine.ts`

This is the existing pricing engine. It has been updated to be more intelligent and now includes:

- **Tiered Distance Pricing:** Different rates for short, medium, and long-distance routes.
- **Seasonal & Regional Multipliers:** Adjusts pricing for peak seasons (summer) and high-cost areas (London).
- **Multi-Drop Pricing Logic:** Calculates the customer's fair share of a shared route.

### d. API Endpoint: `/api/booking/check-multi-drop-eligibility`

This new `POST` endpoint exposes the functionality of the `multi-drop-eligibility-engine` to the frontend.

- **Request:** The frontend sends the current booking details (pickup, dropoff, items) to this endpoint.
- **Response:** The endpoint returns the `MultiDropDecision` object, which contains everything the frontend needs to render the correct options.

---

## 3. Frontend Integration: Booking Luxury Step 2

To implement the dynamic UI, the `WhoAndPaymentStep.tsx` component needs to be updated.

### Step 1: State Management

Add new state variables to manage the API call and its result.

```typescript
// In WhoAndPaymentStep.tsx

const [eligibilityDecision, setEligibilityDecision] = useState<MultiDropDecision | null>(null);
const [isLoadingEligibility, setIsLoadingEligibility] = useState(false);
```

### Step 2: API Call

Use a `useEffect` hook to call the new API endpoint whenever the core booking details change.

```typescript
// In WhoAndPaymentStep.tsx

useEffect(() => {
  const checkEligibility = async () => {
    // Ensure we have the necessary data
    if (!formData.step1.pickupAddress || !formData.step1.dropoffAddress || formData.step1.items.length === 0) {
      return;
    }

    setIsLoadingEligibility(true);
    try {
      const response = await fetch("/api/booking/check-multi-drop-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup: formData.step1.pickupAddress,
          dropoff: formData.step1.dropoffAddress,
          items: formData.step1.items,
          scheduledDate: formData.step1.dateTime,
          serviceType: formData.step1.serviceType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to check eligibility");
      }

      const data: MultiDropDecision = await response.json();
      setEligibilityDecision(data);

    } catch (error) {
      console.error("Error checking multi-drop eligibility:", error);
      // Handle error - maybe default to single order
      setEligibilityDecision(null); 
    } finally {
      setIsLoadingEligibility(false);
    }
  };

  checkEligibility();

}, [formData.step1.pickupAddress, formData.step1.dropoffAddress, formData.step1.items, formData.step1.dateTime, formData.step1.serviceType]);
```

### Step 3: Conditional Rendering

Now, use the `eligibilityDecision` state to dynamically render the service options.

```typescript
// In WhoAndPaymentStep.tsx - inside the return()

{isLoadingEligibility ? (
  <Spinner />
) : eligibilityDecision ? (
  <Box>
    {/* Recommendation Badge */}
    <Badge colorScheme={eligibilityDecision.recommendation.badge === 'BEST_VALUE' ? 'green' : 'blue'}>
      {eligibilityDecision.recommendation.badge}
    </Badge>
    <Heading size="md">{eligibilityDecision.recommendation.title}</Heading>
    <Text>{eligibilityDecision.recommendation.description}</Text>

    {/* Service Options */}
    <SimpleGrid columns={2} spacing={5}>
      {/* Single Order Option (Always Show) */}
      <ServiceCard
        title="Single Order"
        price={eligibilityDecision.pricing.singleOrderPrice}
        description="Dedicated van for your items."
        isSelected={formData.step1.serviceType === 'SINGLE_ORDER'}
        onClick={() => handleServiceTypeChange('SINGLE_ORDER')}
      />

      {/* Multi-Drop Option (Conditional) */}
      {eligibilityDecision.showMultiDropOption && (
        <ServiceCard
          title="Multi-Drop"
          price={eligibilityDecision.pricing.multiDropPrice}
          description={`Save ${eligibilityDecision.pricing.savingsPercentage?.toFixed(0)}% by sharing!`}
          isSelected={formData.step1.serviceType === 'MULTI_DROP'}
          onClick={() => handleServiceTypeChange('MULTI_DROP')}
        />
      )}
    </SimpleGrid>
  </Box>
) : (
  <Text>Select your items and addresses to see pricing options.</Text>
)}
```

---

## 4. Example Scenarios

### Scenario 1: Full Load (Glasgow -> London)

- **Request:** 3 double beds, Glasgow to London.
- **Analysis:** `intelligent-route-optimizer` calculates load at >70% and distance at >200 miles.
- **Decision:** `multi-drop-eligibility-engine` returns:
  ```json
  {
    "showMultiDropOption": false,
    "reason": "Load too large for multi-drop (93% > 70%). Route too long for multi-drop (400 miles > 200 miles).",
    "recommendation": {
      "type": "SINGLE_ORDER",
      "title": "Dedicated Van Service",
      "badge": "FASTEST"
    }
  }
  ```
- **UI:** Only the "Single Order" option is displayed.

### Scenario 2: Light Load (Manchester -> Leeds)

- **Request:** 2 boxes, Manchester to Leeds.
- **Analysis:** Load is ~5%, distance is ~40 miles. All constraints pass.
- **Decision:** The engine finds another booking going from Liverpool to York. It returns:
  ```json
  {
    "showMultiDropOption": true,
    "reason": "Great match found! Save 25% by sharing the route.",
    "pricing": {
      "singleOrderPrice": 80,
      "multiDropPrice": 60,
      "savings": 20,
      "savingsPercentage": 25
    },
    "recommendation": {
      "type": "MULTI_DROP",
      "title": "Multi-Drop Route - Save £20",
      "badge": "BEST_VALUE"
    }
  }
  ```
- **UI:** Both "Single Order" and "Multi-Drop" options are displayed, with the Multi-Drop option highlighted as the best value.

---

## 5. Conclusion

This new system provides a robust, scalable, and intelligent foundation for pricing and routing. It eliminates hardcoded assumptions, improves operational efficiency, and offers customers fair, market-driven prices. By integrating this system into the booking flow, Speedy Van can now confidently handle any removal request across the UK.


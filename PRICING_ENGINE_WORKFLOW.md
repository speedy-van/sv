# Speedy Van - Pricing Engine Workflow

## Overview
This document outlines the complete pricing engine workflow for Speedy Van, covering all pricing calculations, dynamic factors, rules engine, and pricing strategies from quote generation to final billing.

---

## 1. Pricing Engine Architecture

### 1.1 Core Components
```
Pricing System Architecture:
    ↓
Main Pricing Engine:
    - PricingCalculator (packages/pricing)
    - PricingEngine (apps/web/src/lib/pricing)
    - FairPricingSystem (fair distribution)
    - PricingRulesEngine (dynamic rules)
    ↓
Supporting Systems:
    - Item Catalog (volume/weight data)
    - Distance Calculator (Mapbox integration)
    - Weather API (pricing adjustments)
    - Traffic API (congestion factors)
    - Demand Analyzer (real-time pricing)
    ↓
Output Systems:
    - Quote Generation
    - Pricing Breakdown
    - Driver Payout Calculation
    - Invoice Generation
```

### 1.2 Pricing Data Flow
```
Quote Request Flow:
    ↓
Input Validation:
    - Location coordinates
    - Item list validation
    - Service type verification
    - Date/time validation
    ↓
Base Calculation:
    - Distance calculation
    - Vehicle type determination
    - Service type selection
    - Base pricing application
    ↓
Dynamic Adjustments:
    - Weather multipliers
    - Traffic conditions
    - Seasonal adjustments
    - Demand-based pricing
    ↓
Rules Engine:
    - Promotional codes
    - Special discounts
    - Minimum order values
    - Maximum price caps
    ↓
Final Processing:
    - VAT calculation
    - Rounding rules
    - Breakdown generation
    - Quote response
```

---

## 2. Base Pricing Calculation

### 2.1 Service Type Pricing
```
Service Categories:
    ↓
Man & Van Service:
    - Base Price: £45.00
    - Price Per Mile: £1.50
    - Price Per Hour: £35.00
    - Crew Size: 2 (driver + helper)
    - Max Volume: 15m³
    - Max Weight: 1000kg
    - Included: Loading/unloading, basic packing materials
    ↓
Van Only Service:
    - Base Price: £35.00
    - Price Per Mile: £1.20
    - Crew Size: 0 (customer drives)
    - Max Volume: 12m³
    - Max Weight: 800kg
    - Included: Van rental, basic insurance, fuel
    ↓
Large Van Service:
    - Base Price: £65.00
    - Price Per Mile: £2.00
    - Price Per Hour: £45.00
    - Crew Size: 2
    - Max Volume: 25m³
    - Max Weight: 1500kg
    - Included: 2-person crew, furniture protection
    ↓
Premium Service:
    - Base Price: £85.00
    - Price Per Mile: £2.50
    - Price Per Hour: £60.00
    - Crew Size: 3
    - Max Volume: 30m³
    - Max Weight: 2000kg
    - Included: Full packing, premium insurance, white-glove
    ↓
Multiple Trips Service:
    - Base Price: £55.00
    - Price Per Mile: £1.75
    - Price Per Hour: £40.00
    - Crew Size: 2
    - Max Volume: 50m³ (across trips)
    - Max Weight: 3000kg
    - Included: Coordination, flexible scheduling
```

### 2.2 Vehicle Capacity Matrix
```
Vehicle Type Specifications:
    ↓
Pickup Truck:
    - Max Weight: 500kg
    - Max Volume: 5m³
    - Max Items: 25
    - Base Price: £30
    - Price Per KM: £2.00
    - Price Per Minute: £0.80
    ↓
Transit Van:
    - Max Weight: 1000kg
    - Max Volume: 10m³
    - Max Items: 50
    - Base Price: £50
    - Price Per KM: £2.50
    - Price Per Minute: £1.00
    ↓
Large Truck:
    - Max Weight: 3000kg
    - Max Volume: 25m³
    - Max Items: 100
    - Base Price: £100
    - Price Per KM: £4.00
    - Price Per Minute: £1.50
```

---

## 3. Distance & Location Pricing

### 3.1 Distance Calculation Workflow
```
Distance Pricing Process:
    ↓
Route Calculation:
    - Mapbox Directions API
    - Real-time traffic data
    - Optimal route selection
    - Alternative route analysis
    ↓
Distance Components:
    - Free Distance: 5 miles (no charge)
    - Standard Rate: £1.50 per mile (5-50 miles)
    - Long Distance Surcharge: +£0.25 per mile (>50 miles)
    - Long Distance Threshold: 50 miles
    ↓
Traffic Adjustments:
    - Low Traffic: 1.00x multiplier
    - Medium Traffic: 1.15x multiplier
    - High Traffic: 1.25x multiplier
    - Very High Traffic: 1.35x multiplier (max 20% cap)
    ↓
ULEZ Zone Pricing:
    - ULEZ Detection: Automatic zone checking
    - ULEZ Fee: £12.50 flat rate
    - Applied: When pickup or dropoff in ULEZ zone
```

### 3.2 Location-Based Factors
```
Location Adjustments:
    ↓
Property Type Multipliers:
    - House: 1.0x (base rate)
    - Flat/Apartment: 1.1x
    - Office: 1.15x
    - Storage Unit: 0.9x
    - Commercial: 1.2x
    ↓
Access Difficulty:
    - Normal Access: £0
    - Narrow Access: +£20
    - Long Carry (>50m): +£25
    - Restricted Parking: +£15
    - Time Restrictions: +£10
    ↓
Floor-Based Pricing:
    - Ground Floor: £0
    - With Lift: +£15 per floor
    - Without Lift: +£35 per floor
    - Basement: +£25 (additional)
    - Top Floor (>5): +£10 extra
```

---

## 4. Item-Based Pricing

### 4.1 Item Category Multipliers
```
Item Pricing Categories:
    ↓
Standard Items:
    - Boxes: 1.0x multiplier
    - Base Price: £5 per item
    - Volume Rate: £8 per m³
    ↓
Furniture Items:
    - Furniture: 1.5x multiplier
    - Special Handling: Required
    - Disassembly: +£15 per item
    - Assembly: +£20 per item
    ↓
Appliances:
    - Appliances: 1.8x multiplier
    - Disconnection: +£25 per item
    - Reconnection: +£35 per item
    - Warranty Protection: +£15
    ↓
Fragile Items:
    - Fragile: 2.0x multiplier
    - Special Packaging: +£15 per item
    - Insurance Premium: +£10
    - Careful Handling: Required
    ↓
Other Items:
    - General: 1.2x multiplier
    - Assessment Required: Manual pricing
```

### 4.2 Special Item Surcharges
```
High-Value Items:
    ↓
Piano Surcharge:
    - Upright Piano: +£50
    - Grand Piano: +£100
    - Special Equipment: Required
    - Extra Crew: +1 person
    ↓
Antique Surcharge:
    - Antique Items: +£25 per item
    - Valuation Required: >£1000
    - Special Insurance: +£20
    - White Glove Service: Recommended
    ↓
Artwork Surcharge:
    - Artwork: +£30 per piece
    - Custom Crating: +£40
    - Climate Control: +£25
    - Insurance: Based on value
    ↓
Heavy Item Surcharge:
    - Items >50kg: +£10 per item
    - Items >100kg: +£25 per item
    - Special Equipment: Required
    - Extra Crew: May be needed
    ↓
Valuable Item Surcharge:
    - High Value (>£500): +£20 per item
    - Security Transport: +£35
    - Chain of Custody: Required
    - Photo Documentation: Included
```

### 4.3 Volume Calculation System
```
Volume-Based Pricing:
    ↓
Volume Calculation Methods:
    - Catalog Lookup: Predefined item volumes
    - Dimension Input: L × W × H calculation
    - Category Estimation: Average volumes
    - Manual Override: Admin adjustment
    ↓
Volume Pricing Tiers:
    - Small Load (0-5m³): Standard rate
    - Medium Load (5-15m³): Standard rate
    - Large Load (15-25m³): 5% discount
    - Bulk Load (>25m³): 10% discount
    ↓
Volume Discount Rules:
    - Threshold: 10m³
    - Discount Rate: 10%
    - Maximum Discount: £100
    - Applied: After base calculations
```

---

## 5. Time-Based Pricing

### 5.1 Duration Calculation
```
Time Pricing Components:
    ↓
Estimated Duration:
    - Base Loading Time: 30 minutes
    - Travel Time: Distance-based calculation
    - Unloading Time: 30 minutes
    - Item Complexity: Additional time per item
    ↓
Minimum Duration:
    - Minimum Booking: 2 hours
    - Minimum Charge: Applied regardless of actual time
    - Short Job Surcharge: For <1 hour jobs
    ↓
Hourly Rates:
    - Standard Rate: £35/hour
    - Overtime Rate: £52.50/hour (1.5x after 8 hours)
    - Weekend Rate: £42/hour (1.2x)
    - Holiday Rate: £70/hour (2.0x)
    ↓
Time Slot Multipliers:
    - Early Morning (6-8 AM): 1.1x
    - Standard Hours (8 AM-6 PM): 1.0x
    - Evening (6-9 PM): 1.15x
    - Late Evening (9 PM-11 PM): 1.3x
    - Night Time (11 PM-6 AM): 1.5x
```

### 5.2 Scheduling Factors
```
Date/Time Adjustments:
    ↓
Day of Week Multipliers:
    - Monday-Thursday: 1.0x
    - Friday: 1.05x
    - Saturday: 1.2x
    - Sunday: 1.3x
    - Bank Holidays: 1.5x
    ↓
Seasonal Multipliers:
    - Winter (Dec-Feb): 1.0x (normal)
    - Spring (Mar-May): 1.1x (high)
    - Summer (Jun-Aug): 1.2x (peak)
    - Autumn (Sep-Nov): 1.1x (high)
    - Christmas Period: 1.5x (premium)
    ↓
Advance Booking Discounts:
    - Same Day: 1.2x surcharge
    - 1-2 Days: 1.1x surcharge
    - 3-7 Days: 1.0x (standard)
    - 1-2 Weeks: 0.95x discount
    - >2 Weeks: 0.9x discount
```

---

## 6. Dynamic Pricing Factors

### 6.1 Weather-Based Pricing
```
Weather Impact Calculation:
    ↓
Weather Conditions:
    - Normal Weather: 0% surcharge
    - Light Rain: +2% surcharge
    - Medium Rain: +5% surcharge
    - Heavy Rain: +10% surcharge
    - Strong Wind: +10% surcharge
    - Snow/Ice: +15% surcharge
    - Storm Warning: +20% surcharge (maximum)
    ↓
Weather Data Sources:
    - Weather API Integration
    - Real-time conditions
    - Forecast-based adjustments
    - Location-specific data
    ↓
Weather Safety Rules:
    - Maximum Weather Surcharge: 20%
    - Severe Weather: Service suspension
    - Safety Priority: Over profit
    - Customer Notification: Weather delays
```

### 6.2 Demand-Based Pricing
```
Demand Multipliers:
    ↓
Demand Levels:
    - Low Demand: 0.95x multiplier
    - Medium Demand: 1.0x multiplier
    - High Demand: 1.15x multiplier
    - Very High Demand: 1.3x multiplier (maximum)
    ↓
Demand Calculation Factors:
    - Driver Availability: Real-time tracking
    - Booking Volume: Historical patterns
    - Seasonal Trends: Predictive analysis
    - Local Events: Manual adjustments
    ↓
Demand Response Rules:
    - Update Frequency: Every 15 minutes
    - Maximum Surge: 30% above base
    - Gradual Increases: 5% increments
    - Customer Notification: Surge pricing alerts
```

### 6.3 Traffic-Based Adjustments
```
Traffic Impact Pricing:
    ↓
Traffic Levels:
    - Free Flow: 1.0x multiplier
    - Light Traffic: 1.05x multiplier
    - Moderate Traffic: 1.15x multiplier
    - Heavy Traffic: 1.25x multiplier
    - Severe Congestion: 1.35x multiplier (max 20% cap)
    ↓
Traffic Data Integration:
    - Real-time Traffic APIs
    - Route optimization
    - Alternative route pricing
    - Historical traffic patterns
    ↓
Traffic Pricing Rules:
    - Maximum Traffic Surcharge: 20%
    - Route Optimization: Automatic
    - Customer Choice: Multiple route options
    - Time Estimates: Updated in real-time
```

---

## 7. Pricing Rules Engine

### 7.1 Rule-Based Pricing System
```
Rules Engine Architecture:
    ↓
Rule Types:
    - Percentage Adjustments: Multiply by percentage
    - Fixed Adjustments: Add/subtract fixed amounts
    - Conditional Rules: If-then logic
    - Time-based Rules: Date/time conditions
    - Volume-based Rules: Quantity thresholds
    ↓
Default Pricing Rules:
    - Weekend Surcharge: +20% on Sat/Sun
    - Bulk Discount: -10% for >20 items
    - Long Distance Surcharge: +£25 for >45 min trips
    - Minimum Order: Ensure £30 minimum
    - Fragile Items: +£15 handling fee
    ↓
Rule Execution Order:
    - Priority-based execution (highest first)
    - Condition evaluation
    - Action application
    - Result validation
    - Next rule processing
```

### 7.2 Promotional Code System
```
Promo Code Types:
    ↓
Percentage Discounts:
    - FIRST20: 20% off first booking (max £50)
    - SAVE15: 15% off orders >£100 (max £75)
    - STUDENT10: 10% student discount (max £30)
    ↓
Fixed Amount Discounts:
    - SAVE25: £25 off orders >£150
    - WELCOME10: £10 off first booking
    ↓
Service-Based Discounts:
    - FREEPACKING: Free packing materials (£25 value)
    - FREEINSURANCE: Free premium insurance
    ↓
Promo Code Validation:
    - Code Existence: Valid code check
    - Usage Limits: Maximum uses per code
    - Expiry Dates: Time-based validity
    - Conditions: Minimum order, first-time customer
    - Service Restrictions: Applicable services only
```

---

## 8. Fair Pricing Distribution

### 8.1 Revenue Sharing Model
```
Fair Pricing Breakdown:
    ↓
Driver Payout (70%):
    - Base service amount
    - Distance charges
    - Time charges
    - Special item handling
    - Access difficulty fees
    ↓
Platform Fee (30%):
    - Technology costs
    - Customer support
    - Insurance coverage
    - Marketing expenses
    - System maintenance
    ↓
Transparent Distribution:
    - Driver sees full breakdown
    - Customer sees total cost
    - Clear percentage splits
    - No hidden fees
```

### 8.2 Driver Earnings Calculation
```
Driver Payout Process:
    ↓
Base Earnings:
    - Service base rate × 70%
    - Distance charges × 70%
    - Time charges × 70%
    ↓
Performance Bonuses:
    - High Rating Bonus: +£5 per job (4.8+ rating)
    - Completion Bonus: +£3 per completed job
    - Peak Time Bonus: +£10 during high demand
    - Weekly Target Bonus: +£50 for 20+ jobs
    ↓
Deductions:
    - Fuel Allowance: Already included
    - Vehicle Maintenance: Driver responsibility
    - Insurance: Platform covers
    - Taxes: Driver responsibility
    ↓
Payment Schedule:
    - Weekly Payments: Every Friday
    - Instant Cashout: Available for fee
    - Payment Methods: Bank transfer, digital wallet
```

---

## 9. Price Calculation Workflow

### 9.1 Step-by-Step Calculation
```
Pricing Calculation Process:
    ↓
Step 1: Input Validation
    - Validate coordinates
    - Check item list
    - Verify service type
    - Validate date/time
    ↓
Step 2: Base Price Calculation
    - Service type base price
    - Vehicle type determination
    - Minimum fare application
    ↓
Step 3: Distance Pricing
    - Calculate route distance
    - Apply distance rates
    - Add long-distance surcharges
    - Factor in traffic conditions
    ↓
Step 4: Item Pricing
    - Calculate total volume
    - Apply category multipliers
    - Add special item surcharges
    - Apply volume discounts
    ↓
Step 5: Time Pricing
    - Calculate estimated duration
    - Apply hourly rates
    - Add time slot multipliers
    - Factor in seasonal adjustments
    ↓
Step 6: Dynamic Adjustments
    - Weather multipliers
    - Demand multipliers
    - Traffic adjustments
    - ULEZ zone fees
    ↓
Step 7: Rules Engine
    - Apply pricing rules
    - Process promotional codes
    - Validate minimum/maximum prices
    ↓
Step 8: Final Calculations
    - Calculate subtotal
    - Apply VAT (if applicable)
    - Round to nearest penny
    - Generate breakdown
```

### 9.2 Price Validation & Limits
```
Price Validation Rules:
    ↓
Minimum Pricing:
    - Absolute Minimum: £25
    - Service Minimums: Vary by type
    - Distance Minimums: Based on mileage
    ↓
Maximum Pricing:
    - Absolute Maximum: £500 per job
    - Surge Pricing Cap: +30% maximum
    - Weather Surcharge Cap: +20% maximum
    - Traffic Surcharge Cap: +20% maximum
    ↓
Reasonableness Checks:
    - Price per mile validation
    - Price per hour validation
    - Total vs. components validation
    - Historical price comparison
    ↓
Error Handling:
    - Invalid inputs: Clear error messages
    - Calculation errors: Fallback pricing
    - API failures: Cached rates
    - Edge cases: Manual review
```

---

## 10. Quote Generation & Management

### 10.1 Quote Creation Process
```
Quote Generation Workflow:
    ↓
Quote Request:
    - Customer input collection
    - Service type selection
    - Item list compilation
    - Location verification
    ↓
Price Calculation:
    - Run pricing engine
    - Apply all factors
    - Generate breakdown
    - Validate results
    ↓
Quote Formatting:
    - Customer-friendly breakdown
    - Terms and conditions
    - Validity period (24 hours)
    - Booking instructions
    ↓
Quote Delivery:
    - Instant web display
    - Email confirmation
    - SMS notification
    - PDF generation
```

### 10.2 Quote Management
```
Quote Lifecycle:
    ↓
Quote States:
    - Generated: Initial creation
    - Viewed: Customer accessed
    - Modified: Customer changes
    - Accepted: Customer books
    - Expired: Past validity period
    - Cancelled: Customer declined
    ↓
Quote Updates:
    - Price changes: New calculation required
    - Service changes: Re-quote needed
    - Item changes: Volume recalculation
    - Date changes: Time-based repricing
    ↓
Quote Tracking:
    - Generation timestamp
    - Customer interactions
    - Modification history
    - Conversion tracking
    - Abandonment analysis
```

---

## 11. Integration Points

### 11.1 External API Integrations
```
Pricing System Integrations:
    ↓
Mapbox Integration:
    - Distance calculation
    - Route optimization
    - Traffic data
    - Geocoding services
    ↓
Weather API:
    - Current conditions
    - Forecast data
    - Severe weather alerts
    - Location-specific data
    ↓
Traffic APIs:
    - Real-time traffic
    - Historical patterns
    - Route alternatives
    - Congestion predictions
    ↓
Payment Integration (Stripe):
    - Price validation
    - Currency handling
    - Tax calculation
    - Payment processing
```

### 11.2 Internal System Integration
```
System Connections:
    ↓
Booking System:
    - Quote to booking conversion
    - Price lock mechanisms
    - Service confirmation
    - Customer notifications
    ↓
Driver System:
    - Earnings calculation
    - Job assignment
    - Performance tracking
    - Payout processing
    ↓
Customer System:
    - Price history
    - Discount eligibility
    - Loyalty programs
    - Billing records
    ↓
Admin System:
    - Price monitoring
    - Rule management
    - Performance analytics
    - Manual overrides
```

---

## 12. Pricing Analytics & Optimization

### 12.1 Performance Monitoring
```
Pricing Analytics:
    ↓
Key Metrics:
    - Average order value
    - Price acceptance rate
    - Quote-to-booking conversion
    - Customer price sensitivity
    - Driver earnings satisfaction
    ↓
Performance Tracking:
    - Calculation speed
    - API response times
    - Error rates
    - Cache hit rates
    - System availability
    ↓
Business Intelligence:
    - Revenue optimization
    - Demand forecasting
    - Competitive analysis
    - Profit margin tracking
    - Market positioning
```

### 12.2 Continuous Optimization
```
Pricing Optimization Process:
    ↓
A/B Testing:
    - Price point testing
    - Discount effectiveness
    - Surge pricing impact
    - Service tier performance
    ↓
Machine Learning:
    - Demand prediction
    - Price optimization
    - Customer behavior analysis
    - Dynamic pricing models
    ↓
Market Analysis:
    - Competitor pricing
    - Market positioning
    - Customer feedback
    - Industry benchmarks
    ↓
Optimization Actions:
    - Rate adjustments
    - Rule modifications
    - Service tier changes
    - Promotional strategies
```

---

## 13. Error Handling & Fallbacks

### 13.1 Error Management
```
Error Handling Strategy:
    ↓
Input Validation Errors:
    - Clear error messages
    - Field-specific validation
    - Helpful suggestions
    - Retry mechanisms
    ↓
Calculation Errors:
    - Fallback pricing models
    - Default rate application
    - Manual review flags
    - Customer notifications
    ↓
API Integration Errors:
    - Cached data usage
    - Estimated calculations
    - Service degradation
    - Error logging
    ↓
System Errors:
    - Graceful degradation
    - Basic pricing mode
    - Admin notifications
    - Recovery procedures
```

### 13.2 Fallback Mechanisms
```
Fallback Pricing:
    ↓
Distance API Failure:
    - Straight-line distance
    - Historical averages
    - Manual input option
    - Conservative estimates
    ↓
Weather API Failure:
    - No weather surcharge
    - Seasonal defaults
    - Historical patterns
    - Manual overrides
    ↓
Traffic API Failure:
    - Time-of-day defaults
    - Historical traffic patterns
    - Conservative estimates
    - Route optimization disabled
    ↓
Complete System Failure:
    - Basic rate card
    - Manual pricing
    - Admin intervention
    - Customer communication
```

---

## 14. Pricing Administration

### 14.1 Admin Controls
```
Admin Pricing Management:
    ↓
Rate Management:
    - Base rate adjustments
    - Service type pricing
    - Multiplier modifications
    - Surcharge updates
    ↓
Rule Management:
    - Add/remove rules
    - Modify conditions
    - Update actions
    - Rule priority changes
    ↓
Promotional Management:
    - Create promo codes
    - Set usage limits
    - Define conditions
    - Track performance
    ↓
Override Capabilities:
    - Manual price adjustments
    - Customer-specific pricing
    - Emergency rate changes
    - Bulk price updates
```

### 14.2 Monitoring & Alerts
```
System Monitoring:
    ↓
Price Monitoring:
    - Unusual price alerts
    - Rate change notifications
    - Competitive price tracking
    - Customer complaints
    ↓
Performance Alerts:
    - High error rates
    - Slow response times
    - API failures
    - System downtime
    ↓
Business Alerts:
    - Low conversion rates
    - High abandonment
    - Driver complaints
    - Revenue anomalies
    ↓
Response Procedures:
    - Alert escalation
    - Issue investigation
    - Resolution tracking
    - Post-incident review
```

---

This comprehensive pricing engine workflow ensures accurate, fair, and competitive pricing while maintaining system reliability and business profitability. The system balances multiple factors to provide transparent pricing for customers and fair compensation for drivers while supporting sustainable business operations.

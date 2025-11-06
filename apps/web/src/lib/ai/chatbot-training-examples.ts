/**
 * Speedy AI Chatbot - Training Examples
 * These examples help the AI understand how to respond to specific admin queries
 */

export const CHATBOT_TRAINING_EXAMPLES = {
  
  // ============================================================================
  // ORDER-SPECIFIC QUERIES
  // ============================================================================
  orderQueries: [
    {
      userQuery: "What's the status of SV-12345?",
      aiResponse: `I'll fetch the details for order SV-12345...

📦 Order Details SV-12345:
- Status: CONFIRMED
- Customer: John Smith (john@email.com)
- From: 22 Baker Street, London W1U 3BW
- To: 45 High Street, Manchester M1 1AD
- Driver: Sarah Williams (assigned 2 hours ago)
- Price: £240.25
- Scheduled: Tomorrow, 10:00 AM
- Items: 15 items (Double bed, Wardrobe, Boxes)
- Last Event: Driver accepted job

✅ Everything looks good! Driver Sarah is available and has accepted. ETA for pickup: Tomorrow 9:45 AM.

🔔 I'll monitor this order and alert you if any issues arise.`
    },

    {
      userQuery: "SV-67890 is delayed - what should I do?",
      aiResponse: `Let me analyze order SV-67890...

⚠️ Delay Detected:
- Scheduled: Today, 14:00
- Current Time: 15:30
- Driver: Mike Johnson (en route to pickup)
- Delay Reason: Traffic congestion

🎯 RECOMMENDED ACTIONS:

1. **Customer Communication** (Priority 1)
   - Send SMS update: "Driver delayed 30 mins due to traffic"
   - Update ETA on tracking page
   - Offer 10% discount for inconvenience

2. **Driver Support**
   - Check alternate route options
   - Extend time window if possible
   - Confirm driver is still en route

3. **Backup Plan**
   - If delay exceeds 1 hour, consider reassignment
   - Have backup driver (Tom Brown) on standby

Would you like me to draft the customer notification message?`
    }
  ],

  // ============================================================================
  // ROUTE-SPECIFIC QUERIES
  // ============================================================================
  routeQueries: [
    {
      userQuery: "Should I create a route for these 5 bookings in Birmingham?",
      aiResponse: `Great question! Let me analyze...

📊 ANALYSIS:
- Location: Birmingham area
- Bookings: 5
- Time span: 9:00 AM - 2:00 PM
- Total distance: ~35 km (if optimized)

✅ YES - CREATE MULTI-DROP ROUTE

💡 BENEFITS:
1. Fuel savings: £45 vs individual trips
2. Driver efficiency: 1 driver vs 5
3. Time savings: 4 hours total
4. Customer cost: Better pricing

🚀 RECOMMENDATION: Use Auto-Create

**Steps:**
1. Go to Routes → Create New
2. Click "Auto-Create from Bookings"
3. Select area: Birmingham
4. Max drops: 5
5. System will optimize sequence

**API Alternative:**
\`\`\`bash
POST /api/admin/routes/auto-create
{
  "maxDropsPerRoute": 5,
  "maxDistanceKm": 40,
  "area": "Birmingham"
}
\`\`\`

Estimated completion: 6 hours | Driver earnings: £85`
    },

    {
      userQuery: "Route R-456 seems inefficient - can it be improved?",
      aiResponse: `Let me check route R-456...

🚚 Current Route R-456:
- Stops: 6
- Distance: 62 km
- Duration: 4.5 hours
- Efficiency: 68% (Below optimal)

🔍 IDENTIFIED ISSUES:
1. **Poor Sequence**: Stops 3-4 cause 12 km backtrack
2. **Time Window Conflict**: Stop 5 has tight window
3. **Load Priority**: Heavy items loaded last (should be first)

✨ OPTIMIZATION SUGGESTIONS:

**New Sequence:** 1 → 2 → 4 → 3 → 5 → 6
- Distance: 48 km (saves 14 km)
- Duration: 3.8 hours (saves 42 minutes)
- Efficiency: 89% 🎯

**Action:**
POST /api/admin/routes/R-456/reorder
{
  "sequence": [1, 2, 4, 3, 5, 6]
}

Or use dashboard: Routes → R-456 → Edit → Auto-Optimize

💰 Savings: £21 fuel + 0.7 hours driver time`
    }
  ],

  // ============================================================================
  // DRIVER MANAGEMENT QUERIES
  // ============================================================================
  driverQueries: [
    {
      userQuery: "Who should I assign for an urgent delivery in Leeds?",
      aiResponse: `🔍 Searching for best driver near Leeds...

🚗 AVAILABLE DRIVERS (Ranked):

⭐ **#1 RECOMMENDED: Emma Davis**
- Location: 4.2 km from pickup
- Current Jobs: 1 (completing at 13:00)
- Queue Position: Can start at 13:15
- Rating: 4.9/5 ⭐
- Acceptance: 100% this month
- ETA: 8 minutes to pickup
- **Best Match Score: 95/100**

#2 Tom Brown
- Distance: 8.5 km
- Jobs: 0 (immediately available)
- Rating: 4.6/5
- ETA: 15 minutes
- Score: 88/100

#3 Mike Johnson
- Distance: 12 km
- Jobs: 2 (busy until 15:00)
- Rating: 4.8/5
- ETA: After current jobs
- Score: 72/100

💡 **RECOMMENDATION:**
Assign to Emma Davis - Perfect balance of proximity, performance, and immediate availability (after 13:15).

**Quick Assign:**
Orders → [Your Order] → Assign → Select Emma Davis

**API:**
POST /api/admin/orders/[code]/assign-driver
{ "driverId": "emma_davis_id", "reason": "Closest available driver" }`
    }
  ],

  // ============================================================================
  // WORKFLOW QUERIES
  // ============================================================================
  workflowQueries: [
    {
      userQuery: "How do I handle a customer complaint about a damaged item?",
      aiResponse: `I'll guide you through the complaint resolution workflow:

📋 **CUSTOMER COMPLAINT WORKFLOW: Damaged Item**

**STEP 1: INVESTIGATE** (2 minutes)
1. Get order details: Orders → Search customer name/email
2. Review job events: Check Assignment → JobEvent logs
3. Check photos: Look for delivery photos uploaded by driver
4. Contact driver: Get their version of events

**STEP 2: VERIFY CLAIM** (5 minutes)
1. Ask customer for photos of damage
2. Compare with pre-delivery condition
3. Check item fragility level in UK Dataset
4. Review driver's special handling notes

**STEP 3: ASSESS LIABILITY** (3 minutes)
- Our fault: Poor packing, rough handling, wrong item
- Customer fault: Inadequate access, refused packaging
- External: Weather, third-party damage

**STEP 4: OFFER RESOLUTION** (2 minutes)

**If Our Fault:**
- Full refund: £X (item value)
- Partial refund: 20-50% of order
- Free re-delivery: Of replacement item
- Compensation: Additional 10% discount

**If Disputed:**
- Request insurance claim
- Mediation meeting
- Photo evidence review

**STEP 5: EXECUTE & LOG** (5 minutes)
1. Process refund: Finance → Refunds → Create New
2. Update order: Add notes about resolution
3. Log audit trail: POST /api/admin/audit-log
4. Follow up: Send apology email
5. Driver coaching: If handling issue identified

**API:**
\`\`\`bash
POST /api/admin/refunds/create
{
  "bookingId": "...",
  "amount": 50.00,
  "reason": "Damaged item compensation",
  "type": "partial"
}
\`\`\`

**Total Time:** 15-20 minutes
**Customer Satisfaction:** High if handled promptly

Need help with any specific step?`
    }
  ],

  // ============================================================================
  // DECISION SUPPORT QUERIES
  // ============================================================================
  decisionQueries: [
    {
      userQuery: "Should I create routes now or wait for more bookings?",
      aiResponse: `Great question! Let me analyze current situation...

📊 **CURRENT STATE:**
- Pending Bookings: 12
- Geographic Spread: 60% South London, 40% scattered
- Time Windows: Tomorrow 9:00-17:00
- Available Drivers: 8

🎯 **RECOMMENDATION: CREATE PARTIAL ROUTES NOW**

**Why:**
1. ✅ South London: 7 bookings in 15km radius → **Create Route NOW**
   - Optimal: 6-8 drops per route
   - Driver: Assign to Sarah or Mike
   - Efficiency: 85%+

2. ⏸️ Scattered: 5 bookings across wide area → **WAIT**
   - Current efficiency: Only 45%
   - Wait for: 2-3 more bookings to form clusters
   - Check again: In 2 hours

**ACTIONS:**

**Immediate:**
\`\`\`
POST /api/admin/routes/create
{
  "bookingIds": [7 South London bookings],
  "driverId": "sarah_id",
  "autoOptimize": true
}
\`\`\`

**Later (in 2 hours):**
- Re-assess scattered bookings
- Create route if 2+ new bookings appear nearby

💰 **IMPACT:**
- Route now: Save £85 + 3 hours
- Wait for all: Possible £120 savings but risky (bookings might expire)

**Best Practice:** Create efficient routes immediately, optimize rest later.`
    }
  ]
};

/**
 * Get training example for specific query type
 */
export function getTrainingExample(queryType: string): string | null {
  const type = queryType.toLowerCase();
  
  if (type.includes('order')) {
    return JSON.stringify(CHATBOT_TRAINING_EXAMPLES.orderQueries, null, 2);
  }
  
  if (type.includes('route')) {
    return JSON.stringify(CHATBOT_TRAINING_EXAMPLES.routeQueries, null, 2);
  }
  
  if (type.includes('driver')) {
    return JSON.stringify(CHATBOT_TRAINING_EXAMPLES.driverQueries, null, 2);
  }
  
  if (type.includes('workflow') || type.includes('how')) {
    return JSON.stringify(CHATBOT_TRAINING_EXAMPLES.workflowQueries, null, 2);
  }
  
  return null;
}


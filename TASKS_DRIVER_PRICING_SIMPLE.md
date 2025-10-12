# TASKS DRIVER PRICING

## implementation_checklist.md

### ✅ Core System Requirements

#### Database Schema
- [ ] `Booking` table with customer payment tracking (`totalGBP` in pence)
- [ ] `Assignment` table linking drivers to routes
- [ ] `DriverEarnings` table with daily cap tracking
- [ ] `DriverPaySnapshot` table for audit trail
- [ ] `BonusRequest` table for admin approval workflow
- [ ] `JobEvent` table for tracking all job activities

#### Route Optimization Service
- [ ] Geographic clustering algorithm (DBSCAN or similar)
- [ ] TSP solver for path optimization
- [ ] Constraint validation (13-hour shift, 1000-mile, 15m³ capacity)
- [ ] LIFO loading sequence generation
- [ ] Route scoring and selection algorithm

#### Pricing & Earnings Engine
- [ ] Multi-component earnings calculation
- [ ] Daily cap enforcement (£500 = 50,000 pence)
- [ ] **CRITICAL: All bonuses require admin pre-approval**
- [ ] Platform fee deduction
- [ ] SLA penalty calculation
- [ ] Expense reimbursement processing

### ✅ Admin Approval Controls

#### Bonus Management
- [ ] **No automatic bonus application without admin approval**
- [ ] Bonus request queue in admin dashboard
- [ ] Admin approval/rejection workflow
- [ ] Audit trail for all bonus decisions
- [ ] Driver notification ONLY after admin approval

#### Daily Cap Management
- [ ] Automatic cap detection and enforcement
- [ ] Admin review queue for cap breaches
- [ ] Manual override capability with justification
- [ ] Real-time cap tracking per driver

### ✅ Driver App Features

#### Job Management
- [ ] Available jobs dashboard with earnings preview
- [ ] Route acceptance with cap warnings
- [ ] Smart loading manifest with LIFO sequence
- [ ] Real-time status updates
- [ ] Expense logging with receipt upload

#### Notification System
- [ ] **Two-stage notification process:**
  - [ ] Initial: "Route complete! Payment processing in progress."
  - [ ] Final: "Route payment confirmed! You earned £X." (only after all approvals)
- [ ] **No bonus notifications until admin approved**
- [ ] Clear messaging for cap-related delays

### ✅ API Endpoints

#### Driver Endpoints
- [ ] `GET /driver/jobs/available`
- [ ] `POST /driver/jobs/{route_id}/accept`
- [ ] `POST /driver/jobs/{assignment_id}/update-status`
- [ ] `POST /driver/jobs/{assignment_id}/complete`

#### Admin Endpoints
- [ ] `GET /admin/jobs/pending-approval`
- [ ] `POST /admin/jobs/{assignment_id}/approve-payment`
- [ ] `GET /admin/bonuses/pending-approval`
- [ ] `POST /admin/bonuses/{bonus_request_id}/approve`
- [ ] `POST /admin/bonuses/request`

#### Core Services
- [ ] `POST /routes/optimize`
- [ ] `POST /pricing/calculate`

### ✅ Business Rules Validation

#### Shift Constraints
- [ ] 11-13 hour shift duration enforcement
- [ ] 1000-mile distance limit
- [ ] Luton van capacity limits (15m³, 1000kg)
- [ ] Mandatory break scheduling per UK regulations

#### Financial Controls
- [ ] **£500 daily cap is HARD LIMIT**
- [ ] **All bonuses require admin pre-approval**
- [ ] Platform fee calculation and deduction
- [ ] Expense validation and approval
- [ ] SLA penalty enforcement

#### Loading & Logistics
- [ ] LIFO loading sequence enforcement
- [ ] Heavy items first, fragile items last
- [ ] Worker allocation logic (1 vs 2 workers)
- [ ] Capacity utilization bonuses/penalties

### ✅ Security & Compliance

#### Authentication & Authorization
- [ ] JWT token authentication
- [ ] Role-based access control (Driver, Admin, System)
- [ ] API rate limiting
- [ ] Secure file upload for receipts/signatures

#### Data Protection
- [ ] Driver earnings data encryption
- [ ] Customer signature secure storage
- [ ] Receipt image secure storage
- [ ] Audit logging for all financial transactions

### ✅ Testing Requirements

#### Unit Tests
- [ ] Route optimization algorithm
- [ ] Earnings calculation engine
- [ ] Daily cap enforcement
- [ ] Bonus approval workflow

#### Integration Tests
- [ ] End-to-end job lifecycle
- [ ] Admin approval workflows
- [ ] Driver notification system
- [ ] Payment processing pipeline

#### Load Testing
- [ ] Multiple concurrent route optimizations
- [ ] High-volume driver status updates
- [ ] Admin dashboard under load
- [ ] Database performance with large datasets

### ✅ Deployment Checklist

#### Environment Setup
- [ ] Production database with proper indexing
- [ ] Redis cache for real-time data
- [ ] Message queue for async processing
- [ ] File storage for receipts/signatures

#### Monitoring & Alerts
- [ ] Daily cap breach alerts
- [ ] Failed payment processing alerts
- [ ] Route optimization performance monitoring
- [ ] Driver app error tracking

#### Documentation
- [ ] API documentation complete
- [ ] Driver app user guide
- [ ] Admin dashboard manual
- [ ] Troubleshooting guide

### ✅ Go-Live Validation

#### Critical Path Testing
- [ ] Complete job from booking to payment
- [ ] Daily cap enforcement working
- [ ] **Bonus approval workflow functioning**
- [ ] Admin override capabilities tested
- [ ] Driver notifications working correctly

#### Business Continuity
- [ ] Backup and recovery procedures
- [ ] Rollback plan if issues arise
- [ ] Support team trained on new system
- [ ] Emergency contact procedures

### 🚨 CRITICAL REMINDERS
1. **NO BONUSES WITHOUT ADMIN APPROVAL** - This is a hard business rule
2. **£500 DAILY CAP IS ABSOLUTE** - No exceptions without explicit admin override
3. **TWO-STAGE DRIVER NOTIFICATIONS** - Never notify drivers of bonuses until approved
4. **AUDIT EVERYTHING** - All financial decisions must be traceable

## speedy_van_workflow.md

### 3. The Job Lifecycle Workflow

#### Step 1: Booking Ingestion & Validation
1.  **Customer Request**: A new job is created via the Customer Booking API. The request includes all necessary details: pickup location(s), drop-off location(s), item dimensions/weights, and service level (e.g., Standard, Express).
2.  **Initial Validation**: The system performs a preliminary check to ensure the data is complete. The job is saved to the `Booking` database with a `Pending_Optimization` status.
3.  **Data Storage**: The total amount paid by the customer (`totalGBP`) is stored in pence for precision.

#### Step 2: Route Optimization & Pricing Preview
1.  **Route Calculation**: The **Route Optimization Service** continuously scans for pending jobs. It bundles multiple bookings into optimized multi-drop routes, considering:
    *   **Geographic Proximity**: Grouping jobs in similar areas.
    *   **Time Constraints**: Ensuring the total estimated route time is within the 11-13 hour shift limit.
    *   **Distance Limit**: Keeping the total route distance under the 1000-mile cap.
    *   **Van Capacity**: Verifying that the total volume and weight of all items do not exceed the Luton van's legal limits (approx. 15m³ and payload capacity).
    *   **Smart Loading (LIFO)**: Sequencing drops so that the items for the last drop are loaded first.
2.  **Earnings Calculation (Preview)**: For each potential route, the system calls the **Pricing & Earnings Engine** to generate a `pricingPreview`. This is a proactive calculation of the driver's potential earnings based on the proposed route.
3.  **Driver Notification**: The proposed route, along with the detailed earnings preview, is pushed to the Driver Mobile App. The preview clearly breaks down the earnings:
    *   Base rate (distance-based).
    *   Bonus for each drop-off.
    *   Capacity utilization bonus.
    *   Estimated time-based earnings.
    *   **Net Earnings Estimate (after platform fee)**.

#### Step 3: Job Acceptance & Assignment
1.  **Driver Review**: The driver reviews the proposed route, including all drop-off points, estimated duration, and the earnings preview.
2.  **Acceptance**: Upon acceptance, the system creates an `Assignment` record, linking the driver to the specific route and its associated bookings. The job status is updated to `Assigned`.
3.  **Admin Approval Flag**: If the driver's potential earnings for the day (including the new job) would exceed the £500 cap, the job is flagged. The driver sees a message: *"This job will push daily earnings over the £500 cap and requires admin approval upon completion."*

#### Step 4: Job Execution & Real-Time Tracking
1.  **Loading**: The driver follows a smart loading guide in the app, which specifies the order in which to load items based on the drop-off sequence (Last-In, First-Out).
2.  **Execution**: The driver proceeds with the route, updating their status at each key event (e.g., `Arrived_at_Pickup`, `Loading_Complete`, `En_Route_to_Drop_1`, `Unloading_Complete`).
3.  **Proof of Delivery**: The driver captures necessary `jobEvent` data, such as photos of items, customer signatures, and notes on any delays or issues.
4.  **Expense Logging**: The driver can log job-related expenses, such as tolls or parking fees, by uploading receipts through the app.

#### Step 5: Completion & Final Earnings Calculation
1.  **End of Route**: Once the final drop is complete, the driver submits a completion form via the app.
2.  **Final Data Aggregation**: The **Completion & Finalization API** gathers all data for the route:
    *   Actual travel times and distances.
    *   Actual loading, unloading, and waiting times.
    *   Any logged expenses or admin-approved bonuses.
    *   SLA delay metrics.
3.  **Final Earnings Calculation**: The data is sent to the **Pricing & Earnings Engine** for the final, definitive calculation. The engine re-runs the entire calculation with the actual data.
4.  **Cap Enforcement**: The system checks the driver's total earnings for the day. The final net pay for the current job is capped to ensure the driver's total for the day does not exceed £500. The formula is: `capped_net_earnings = min(raw_net_earnings, 50000 - earned_so_far_today)`.
5.  **Payment Record Creation**:
    *   **If Cap is NOT Breached AND No Bonuses Required**: A `DriverEarnings` record is created, and a `DriverPaySnapshot` is stored with a complete breakdown of the calculation.
    *   **If Cap IS Breached OR Bonuses Require Approval**: The system returns a `403 Forbidden` response. No earnings record is created automatically. The job is flagged in the **Admin Dashboard** with either `Pending_Cap_Approval` or `Pending_Bonus_Approval` status. An administrator must manually review and approve the payment, at which point the records are created.
    *   **Bonus Approval Process**: Any bonuses (performance, exceptional service, etc.) must be pre-approved by an admin before being included in the final calculation. The system will not automatically apply any bonuses without explicit admin authorization.

#### Step 6: Payment & Notification
1.  **Initial Driver Notification**: The driver receives a basic completion notification: *"Route XYZ complete. Payment processing in progress."*
2.  **Admin Review Process**: If bonuses are pending approval, the job enters admin review queue. **Drivers are NOT notified of potential bonuses until admin approval is complete.**
3.  **Final Driver Notification**: Only after all approvals are complete, the driver receives the final notification: *"Route XYZ payment confirmed. You have earned £[final_approved_amount]."* If bonuses were approved, they are included in this final amount.
4.  **Payroll Integration**: The finalized `DriverEarnings` record is passed to the **Driver Payroll System** for processing in the next payment cycle.
5.  **Admin Notification**: The operations team receives a real-time event notification (e.g., via Pusher) summarizing the completed job, the final earnings, and whether the cap was applied or requires review.

### 4. Route Optimization Algorithm: The Smart Logistics Engine

#### Step 1: Geographic Clustering
- The algorithm first groups pending jobs based on the proximity of their pickup locations. This is done using a density-based clustering method (like DBSCAN) to identify dense pockets of work, minimizing travel time between initial pickups.

#### Step 2: Initial Path Generation (TSP Solver)
- For each cluster, the algorithm treats all pickup and drop-off locations as nodes in a graph.
- It uses a **Traveling Salesperson Problem (TSP)** solver to determine the most efficient path to connect all nodes. This provides a baseline route that minimizes distance.

#### Step 3: Iterative Constraint Validation
- The generated path is rigorously checked against the core constraints.
- **Capacity Check**: The algorithm simulates the loading process. It continuously sums the volume and weight of items as they are picked up. If the van's capacity is exceeded at any point, the route is immediately invalidated.
- **Time Check**: It calculates the total route duration by summing:
    - Estimated driving time (from Google Maps API or similar).
    - Estimated loading/unloading time (based on item count and type from our dataset).
    - A built-in buffer (e.g., 15%) for traffic and unforeseen delays.
  If the total exceeds 13 hours, the route is invalidated.
- **Distance Check**: The total mileage is summed and checked against the 1000-mile limit.

#### Step 4: Enforce LIFO Loading Sequence (The Smart Loading Manifest)
- This is a critical step for multi-drop efficiency. Once a route is validated, the algorithm re-sequences the pickups to ensure a **Last-In, First-Out (LIFO)** unloading process.
- **Logic**: The items for the *last* drop-off on the route must be loaded into the van *first*.
- **Output**: The algorithm generates a clear, numbered loading manifest for the driver in the mobile app.

#### Step 5: Scoring and Selection
- Multiple valid routes may be generated from the job pool. Each route is assigned an **Efficiency Score**.
- `Score = (Total Revenue of Jobs) / (Total Estimated Hours)`
- The route with the highest score is prioritized and proposed to the most suitable available driver (based on location and current status).

### 5. Pricing & Earnings Engine: Fair, Transparent, and Capped

#### Gross Earnings = (Base Distance Rate) + (Multi-Drop Bonus) + (Capacity Bonus) + (Time-Based Pay) + (Expenses) + (Admin Bonuses) - (Penalties)

#### Net Earnings = (Gross Earnings) - (Platform Fee)

#### Final Payout = min(Net Earnings, 50000 - Previously Earned Today)

### Component Breakdown

| Component | Description & Calculation Logic |
| :--- | :--- |
| **Base Distance Rate** | A tiered rate based on the total mileage of the route. For example: <br> - 0-30 miles: £1.50/mile <br> - 31-100 miles: £1.20/mile <br> - 101+ miles: £1.00/mile |
| **Multi-Drop Bonus** | A bonus that increases with the number of drop-offs to incentivize complex routes. <br> - 2-3 Drops: +£15 <br> - 4-6 Drops: +£30 <br> - 7+ Drops: +£50 |
| **Capacity Bonus** | Rewards efficient use of the van's space. <br> - >70% volume utilization: +10% on base rate <br> - <30% volume utilization: -10% on base rate |
| **Time-Based Pay** | Compensates for time spent on non-driving activities. <br> - Calculated per minute for loading, unloading, and waiting, based on predefined SLA times. |
| **Expenses** | Direct reimbursement for approved, job-related costs (e.g., road tolls, parking fees) upon receipt submission. |
| **Admin Bonuses** | **ALL bonuses must be pre-approved by admin before being applied to driver earnings.** Manual bonuses added by the operations team for exceptional service or handling unforeseen challenges. Requires an `admin_approval_id` and cannot be applied automatically. |
| **Penalties** | Deductions for significant delays caused by the driver. <br> - e.g., -£10 for any delay exceeding 20 minutes beyond the SLA. |
| **Platform Fee** | A fixed percentage (e.g., 20%) deducted from the Gross Earnings to cover Speedy Van's operational costs. |

### 6. Load Management & Capacity Optimization

1.  **Volume Summation**: The algorithm sums the cubic meter volume of every single item assigned to the route.
2.  **Weight Summation**: It concurrently sums the weight of all items.
3.  **Constraint Check**: The totals are compared against the Luton van's limits (15m³ and 1,000 kg).
4.  **Validation/Rejection**: If *either* the total volume or the total weight exceeds the limit, the route is immediately invalidated, and the optimizer attempts to build a new, smaller route.

### 7. Time Management & Shift Optimization

1.  **Data Aggregation**: The algorithm gathers the time estimates for every block:
    *   `Total Driving Time` from the mapping service.
    *   `Total Loading Time` by summing the estimated time for each item in the load.
    *   `Total Unloading Time` similarly summed for all drops.
    *   `Scheduled Break Time` based on the total driving duration.
2.  **Total Shift Calculation**:
    `Total Estimated Shift = (Driving) + (Loading) + (Unloading) + (Breaks) + (Buffer)`
3.  **Constraint Check**: The `Total Estimated Shift` is checked against the hard limit:
    *   If `Total Estimated Shift` > **13 hours**, the route is **invalidated** and recalculated.
    *   If `Total Estimated Shift` < **11 hours**, the system may attempt to add another small, nearby job to the route to maximize efficiency.
    *   If **11 <= `Total Estimated Shift` <= 13 hours**, the route is considered **valid** and can be proposed to a driver.

## large_orders_workflow.md

### Large Order Processing Workflow

#### 1. Order Analysis and Splitting
1. **Volume Calculation**: The system calculates the total cubic meter volume of all items in the order
2. **Van Requirement Determination**:
   - Single Luton van capacity = 15m³ maximum
   - If order volume = 42m³, system determines 3 vans required
3. **Intelligent Item Distribution**: Items are logically grouped by room or category
4. **Route Generation**: Each van receives an independent, optimized route

#### 2. Smart Order Division Strategy
- **Synchronized Operations**:
  - **Coordinated Timing**: All vans arrive simultaneously at pickup location
  - **Organized Loading**: System prevents congestion with staggered loading schedules
  - **Sequential Unloading**: Each van knows its unloading priority at destination
- **Route Optimization**:
  - **Common Starting Point**: All vans begin from the same depot location
  - **Shared Destination**: All vans deliver to the same customer address
  - **Traffic-Aware Routing**: System accounts for traffic patterns and road conditions
- **Emergency Management**:
  - **Backup Van Protocol**: Standby vehicle available for breakdowns
  - **Dynamic Reallocation**: System can redistribute items if a van becomes unavailable
  - **Real-Time Tracking**: Operations team monitors all vans simultaneously

#### 3. Financial Breakdown Summary
- Driver 1: £45.00
- Driver 2: £45.00
- Driver 3: £43.50
- **Total Driver Payments**: £133.50 (3.3% of customer payment)

#### 4. Advanced Multi-Van Coordination
- **Backup Protocols**: Standby vehicle available for breakdowns
- **Dynamic Reallocation**: System can redistribute items if a van becomes unavailable
- **Real-Time Tracking**: Operations team monitors all vans simultaneously

### 6. Alternative Scenarios

#### Scenario A: Multi-Location Pickup Order
- **Driver 1** (2 pickup locations):
  - Multi-Drop Bonus: +£15 (2 drops)
  - **Net Earnings**: £65.00
- **Driver 2** (1 pickup location):
  - Multi-Drop Bonus: £0
  - **Net Earnings**: £45.00

#### Scenario B: Long-Distance Large Order
- Base Distance Rate: (30×£1.50) + (100×£1.20) + (70×£1.00) = £235.00
- Capacity Bonus: £23.50
- **Net Earnings**: £206.80 per driver

## speedy_van_api_spec.md

### 1. Route Optimization Service
- `POST /routes/optimize`

### 2. Pricing & Earnings Engine
- `POST /pricing/calculate`

### 3. Driver Job Management
- `GET /driver/jobs/available`
- `POST /driver/jobs/{route_id}/accept`
- `POST /driver/jobs/{assignment_id}/update-status`
- `POST /driver/jobs/{assignment_id}/complete`

### 4. Admin Dashboard
- `GET /admin/jobs/pending-approval`
- `POST /admin/jobs/{assignment_id}/approve-payment`
- `GET /admin/bonuses/pending-approval`
- `POST /admin/bonuses/{bonus_request_id}/approve`
- `POST /admin/bonuses/request`

### 5. Multi-Van Operations
- `POST /routes/split-large-order`
- `GET /driver/jobs/team-operations/{route_id}`
- `POST /admin/large-orders/monitor`

### Error Handling
- `200 OK`
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `500 Internal Server Error`
``
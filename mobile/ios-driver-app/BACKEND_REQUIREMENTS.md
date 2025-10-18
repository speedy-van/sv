# Backend Requirements for iOS Driver App Hotfix

**Date:** October 18, 2025  
**Priority:** CRITICAL  
**Deadline:** Today (End of Day)

---

## Overview

The iOS driver app hotfix requires the following backend changes to support:
1. Push notification telemetry logging
2. Idempotent job/route acceptance
3. State transition validation
4. Correlation ID tracing

---

## 1. New Endpoint: Notification Telemetry

### POST /api/driver/notifications/log

**Purpose:** Log notification events for analytics and debugging

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer <driver_jwt_token>
Content-Type: application/json
X-Correlation-ID: <uuid>
```

**Request Body:**
```json
{
  "notificationId": "notif-uuid-12345",
  "type": "new_job",
  "entityId": "job-abc-123",
  "event": "received",
  "timestamp": "2025-10-18T12:34:56.789Z",
  "metadata": {
    "title": "New Job Available",
    "message": "From London to Manchester • 45.2 mi • £85.50"
  }
}
```

**Field Definitions:**
- `notificationId` (string, required) - Unique ID for this notification
- `type` (string, required) - One of: `new_job`, `job_update`, `new_route`, `route_update`
- `entityId` (string, required) - Job ID or Route ID
- `event` (string, required) - One of: `received`, `action_view_now`, `action_accept`, `action_dismiss`
- `timestamp` (ISO8601, required) - When the event occurred
- `metadata` (object, optional) - Additional context

**Response (Success - 200):**
```json
{
  "success": true
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "error": "Invalid notification type"
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Database Schema (Suggested):**
```sql
CREATE TABLE notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  notification_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  event VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  metadata JSONB,
  correlation_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_events_driver ON notification_events(driver_id);
CREATE INDEX idx_notification_events_entity ON notification_events(entity_id);
CREATE INDEX idx_notification_events_correlation ON notification_events(correlation_id);
```

---

## 2. Update Endpoint: Idempotent Job Accept

### POST /api/driver/jobs/:id/accept

**Changes Required:**
1. Accept `Idempotency-Key` header
2. Store idempotency keys with TTL (24-48 hours)
3. Return same response for duplicate keys
4. Prevent duplicate job assignments

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer <driver_jwt_token>
Content-Type: application/json
Idempotency-Key: accept_job-abc-123_notif-xyz-789
X-Correlation-ID: <uuid>
```

**Request Body:**
```json
{
  "idempotencyKey": "accept_job-abc-123_notif-xyz-789"
}
```

**Idempotency Logic:**

```typescript
// Pseudo-code
async function acceptJob(jobId: string, driverId: string, idempotencyKey: string) {
  // Check if this idempotency key was already processed
  const existingResponse = await getIdempotentResponse(idempotencyKey);
  if (existingResponse) {
    return existingResponse; // Return cached response
  }
  
  // Check if job is still available
  const job = await getJob(jobId);
  if (!job) {
    return { success: false, error: "Job not found" };
  }
  
  if (job.status !== "available" && job.status !== "assigned") {
    return { success: false, error: "Job is no longer available" };
  }
  
  // Check if already assigned to this driver
  if (job.assignedDriverId === driverId) {
    const response = { success: true, message: "Job already accepted" };
    await storeIdempotentResponse(idempotencyKey, response, 48 * 60 * 60); // 48h TTL
    return response;
  }
  
  // Check if already assigned to another driver
  if (job.assignedDriverId && job.assignedDriverId !== driverId) {
    return { success: false, error: "This job has already been accepted by another driver" };
  }
  
  // Assign job to driver
  await assignJobToDriver(jobId, driverId);
  
  // Store idempotent response
  const response = { success: true, message: "Job accepted successfully" };
  await storeIdempotentResponse(idempotencyKey, response, 48 * 60 * 60); // 48h TTL
  
  // Send notifications, update status, etc.
  await notifyJobAccepted(jobId, driverId);
  
  return response;
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Job accepted successfully"
}
```

**Response (Already Accepted by This Driver - 200):**
```json
{
  "success": true,
  "message": "Job already accepted"
}
```

**Response (Already Accepted by Another Driver - 409):**
```json
{
  "success": false,
  "error": "This job has already been accepted by another driver"
}
```

**Response (Job Not Available - 400):**
```json
{
  "success": false,
  "error": "Job is no longer available"
}
```

**Database Schema (Suggested):**
```sql
CREATE TABLE idempotency_keys (
  key VARCHAR(255) PRIMARY KEY,
  response JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);

-- Clean up expired keys periodically
DELETE FROM idempotency_keys WHERE expires_at < NOW();
```

---

## 3. Update Endpoint: Idempotent Route Accept

### POST /api/driver/routes/:id/accept

**Same as job accept, but for routes**

**Request Headers:**
```
Authorization: Bearer <driver_jwt_token>
Content-Type: application/json
Idempotency-Key: accept_route-abc-123_notif-xyz-789
X-Correlation-ID: <uuid>
```

**Request Body:**
```json
{
  "idempotencyKey": "accept_route-abc-123_notif-xyz-789"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Route accepted successfully"
}
```

**Same idempotency logic as job accept**

---

## 4. Update Endpoint: State Transition Validation

### PUT /api/driver/jobs/:id/progress

**Changes Required:**
1. Validate current job state
2. Validate requested state transition
3. Return 400 with error message if invalid

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer <driver_jwt_token>
Content-Type: application/json
X-Correlation-ID: <uuid>
```

**Request Body:**
```json
{
  "step": "arrived",
  "notes": "Arrived at pickup location",
  "latitude": 51.5074,
  "longitude": -0.1278
}
```

**State Transition Rules (MUST ENFORCE):**

```
available → assigned
assigned → accepted
accepted → en_route
en_route → arrived
arrived → loading
loading → in_transit
in_transit → unloading
unloading → completed
completed → [TERMINAL]
cancelled → [TERMINAL]
```

**Validation Logic:**

```typescript
const VALID_TRANSITIONS = {
  available: ["assigned"],
  assigned: ["accepted"],
  accepted: ["en_route"],
  en_route: ["arrived"],
  arrived: ["loading"],
  loading: ["in_transit"],
  in_transit: ["unloading"],
  unloading: ["completed"],
  completed: [],
  cancelled: []
};

function canTransition(currentState: string, nextState: string): boolean {
  const allowedStates = VALID_TRANSITIONS[currentState];
  return allowedStates && allowedStates.includes(nextState);
}

function getTransitionErrorMessage(currentState: string, nextState: string): string {
  if (currentState === "completed") {
    return "This job is already completed. No further actions are allowed.";
  }
  
  if (currentState === "cancelled") {
    return "This job has been cancelled. No further actions are allowed.";
  }
  
  const allowedStates = VALID_TRANSITIONS[currentState];
  if (!allowedStates || allowedStates.length === 0) {
    return `No further transitions are allowed from ${currentState}`;
  }
  
  return `Cannot transition from ${currentState} to ${nextState}. Allowed next states: ${allowedStates.join(", ")}`;
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Progress updated",
  "data": {
    "step": "arrived",
    "timestamp": "2025-10-18T12:34:56.789Z"
  }
}
```

**Response (Invalid Transition - 400):**
```json
{
  "success": false,
  "error": "Cannot transition from en_route to in_transit. Allowed next states: arrived"
}
```

**Response (Job Not Found - 404):**
```json
{
  "success": false,
  "error": "Job not found"
}
```

---

## 5. Correlation ID Tracing

**All endpoints MUST:**
1. Accept `X-Correlation-ID` header from requests
2. Log correlation ID with all database operations
3. Include correlation ID in all logs
4. Pass correlation ID to downstream services

**Example Logging:**

```typescript
logger.info({
  correlationId: req.headers['x-correlation-id'],
  driverId: driver.id,
  jobId: job.id,
  action: 'accept_job',
  status: 'success',
  timestamp: new Date().toISOString()
});
```

**Database Schema (Suggested):**
```sql
-- Add correlation_id to all relevant tables
ALTER TABLE job_assignments ADD COLUMN correlation_id UUID;
ALTER TABLE job_progress_history ADD COLUMN correlation_id UUID;
ALTER TABLE route_assignments ADD COLUMN correlation_id UUID;

CREATE INDEX idx_job_assignments_correlation ON job_assignments(correlation_id);
CREATE INDEX idx_job_progress_correlation ON job_progress_history(correlation_id);
```

---

## 6. Push Notification Payload Format

**iOS app expects the following payload format:**

### For New Job Notifications

```json
{
  "aps": {
    "alert": {
      "title": "🚚 New Job Available",
      "body": "From London to Manchester • 45.2 mi • £85.50"
    },
    "sound": "default",
    "badge": 1
  },
  "type": "new_job",
  "entityId": "job-abc-123",
  "jobId": "job-abc-123",
  "notificationId": "notif-uuid-12345",
  "title": "🚚 New Job Available",
  "message": "From London to Manchester • 45.2 mi • £85.50"
}
```

### For New Route Notifications

```json
{
  "aps": {
    "alert": {
      "title": "🗺️ Route Matched",
      "body": "5 stops • 45.2 mi • 2h 30m • £185.50"
    },
    "sound": "default",
    "badge": 1
  },
  "type": "new_route",
  "entityId": "route-xyz-789",
  "routeId": "route-xyz-789",
  "notificationId": "notif-uuid-67890",
  "title": "🗺️ Route Matched",
  "message": "5 stops • 45.2 mi • 2h 30m • £185.50"
}
```

**Required Fields:**
- `type` - One of: `new_job`, `job_update`, `new_route`, `route_update`
- `entityId` - Job ID or Route ID
- `notificationId` - Unique notification ID (for idempotency)
- `title` - Notification title
- `message` - Notification body

---

## 7. Error Response Format

**All endpoints MUST return consistent error format:**

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid input, invalid state transition)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (driver not allowed to access this resource)
- `404` - Not Found (job/route not found)
- `409` - Conflict (job already accepted by another driver)
- `500` - Internal Server Error
- `502` - Bad Gateway (retry)
- `503` - Service Unavailable (retry)
- `504` - Gateway Timeout (retry)

**iOS app will automatically retry on 502, 503, 504**

---

## 8. Testing Requirements

### Unit Tests
- [ ] Idempotency key storage and retrieval
- [ ] State transition validation logic
- [ ] Correlation ID propagation
- [ ] Error message generation

### Integration Tests
- [ ] Accept job with idempotency key (first time)
- [ ] Accept job with same idempotency key (second time) → same response
- [ ] Accept job already assigned to another driver → error
- [ ] Update job progress with valid transition → success
- [ ] Update job progress with invalid transition → error
- [ ] Log notification event → success

### Load Tests
- [ ] 1000 concurrent accept requests with different idempotency keys
- [ ] 1000 concurrent accept requests with same idempotency key
- [ ] 1000 concurrent progress updates
- [ ] Verify no duplicate job assignments

---

## 9. Deployment Checklist

### Pre-Deployment
- [ ] All endpoints implemented
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Load tests passing
- [ ] Database migrations applied
- [ ] Idempotency key cleanup job scheduled

### Deployment
- [ ] Deploy to staging
- [ ] Test with iOS app on staging
- [ ] Deploy to production with canary (10% traffic)
- [ ] Monitor error rate, latency
- [ ] Increase canary to 50%
- [ ] Monitor for 1 hour
- [ ] Roll out to 100%

### Post-Deployment
- [ ] Set up dashboards for:
  - Accept success rate
  - State transition errors
  - Idempotency key hit rate
  - Correlation ID coverage
- [ ] Set up alerts for:
  - Error rate > 1%
  - Latency > 5s
  - Failed transitions > 0.5%

---

## 10. Database Migrations

### Migration 1: Notification Events Table

```sql
CREATE TABLE notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  notification_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  event VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  metadata JSONB,
  correlation_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_events_driver ON notification_events(driver_id);
CREATE INDEX idx_notification_events_entity ON notification_events(entity_id);
CREATE INDEX idx_notification_events_correlation ON notification_events(correlation_id);
CREATE INDEX idx_notification_events_timestamp ON notification_events(timestamp);
```

### Migration 2: Idempotency Keys Table

```sql
CREATE TABLE idempotency_keys (
  key VARCHAR(255) PRIMARY KEY,
  response JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);
```

### Migration 3: Add Correlation IDs

```sql
ALTER TABLE job_assignments ADD COLUMN correlation_id UUID;
ALTER TABLE job_progress_history ADD COLUMN correlation_id UUID;
ALTER TABLE route_assignments ADD COLUMN correlation_id UUID;

CREATE INDEX idx_job_assignments_correlation ON job_assignments(correlation_id);
CREATE INDEX idx_job_progress_correlation ON job_progress_history(correlation_id);
CREATE INDEX idx_route_assignments_correlation ON route_assignments(correlation_id);
```

### Migration 4: Cleanup Job (Cron)

```sql
-- Run every hour to clean up expired idempotency keys
DELETE FROM idempotency_keys WHERE expires_at < NOW();
```

---

## 11. API Documentation

### Swagger/OpenAPI Spec

```yaml
/api/driver/notifications/log:
  post:
    summary: Log notification event
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - notificationId
              - type
              - entityId
              - event
              - timestamp
            properties:
              notificationId:
                type: string
              type:
                type: string
                enum: [new_job, job_update, new_route, route_update]
              entityId:
                type: string
              event:
                type: string
                enum: [received, action_view_now, action_accept, action_dismiss]
              timestamp:
                type: string
                format: date-time
              metadata:
                type: object
    responses:
      200:
        description: Success
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
      400:
        description: Bad Request
      401:
        description: Unauthorized

/api/driver/jobs/{id}/accept:
  post:
    summary: Accept job (idempotent)
    security:
      - bearerAuth: []
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
      - name: Idempotency-Key
        in: header
        required: true
        schema:
          type: string
      - name: X-Correlation-ID
        in: header
        required: false
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - idempotencyKey
            properties:
              idempotencyKey:
                type: string
    responses:
      200:
        description: Success
      400:
        description: Bad Request
      401:
        description: Unauthorized
      404:
        description: Not Found
      409:
        description: Conflict (already accepted by another driver)
```

---

## 12. Timeline

### Hour 0-1: Implementation
- [ ] Implement notification logging endpoint
- [ ] Add idempotency support to accept endpoints
- [ ] Add state transition validation
- [ ] Add correlation ID logging

### Hour 1-2: Testing
- [ ] Run unit tests
- [ ] Run integration tests
- [ ] Test with iOS app on staging

### Hour 2-3: Deployment
- [ ] Deploy to staging
- [ ] Deploy to production (canary)
- [ ] Monitor metrics

### Hour 3-6: Monitoring
- [ ] Monitor error rate
- [ ] Monitor latency
- [ ] Monitor success rate
- [ ] Fix any issues

---

## 13. Contact & Support

### Backend Lead
- Responsible for all backend changes
- On-call for backend issues
- Status updates every 2 hours

### Escalation
1. Check logs with correlation ID
2. Check database for state inconsistencies
3. Check idempotency key storage
4. Escalate to backend lead if unresolved

---

**Last Updated:** October 18, 2025  
**Status:** READY FOR IMPLEMENTATION  
**Deadline:** End of Day


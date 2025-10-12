# Speedy Van API Specification

**Version:** 1.0
**Date:** October 4, 2025
**Author:** Manus AI

## Overview

This document provides the complete API specification for the Speedy Van enterprise workflow system. All endpoints are RESTful and return JSON responses. Authentication is handled via JWT tokens.

## Base URL
```
https://api.speedyvan.com/v1
```

## Authentication
All API requests require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Core Endpoints

### 1. Route Optimization Service

#### POST /routes/optimize
Generates optimized multi-drop routes from pending bookings.

**Request Body:**
```json
{
  "pending_bookings": ["booking_id_1", "booking_id_2"],
  "max_shift_hours": 13,
  "max_distance_miles": 1000,
  "van_capacity_m3": 15,
  "van_payload_kg": 1000
}
```

**Response:**
```json
{
  "optimized_routes": [
    {
      "route_id": "route_12345",
      "total_distance_miles": 85,
      "estimated_duration_hours": 11.5,
      "capacity_utilization": 0.78,
      "drops": [
        {
          "drop_id": "drop_1",
          "address": "123 Main St, London",
          "items": ["item_1", "item_2"],
          "estimated_unload_minutes": 25
        }
      ],
      "loading_manifest": [
        {
          "step": 1,
          "instruction": "Load items for final drop (Windsor)",
          "items": ["king_bed", "nightstand"]
        }
      ]
    }
  ]
}
```

### 2. Pricing & Earnings Engine

#### POST /pricing/calculate
Calculates driver earnings for a proposed or completed route.

**Request Body:**
```json
{
  "route_id": "route_12345",
  "driver_id": "driver_789",
  "total_distance_miles": 85,
  "number_of_drops": 4,
  "capacity_utilization": 0.78,
  "actual_times": {
    "driving_minutes": 180,
    "loading_minutes": 45,
    "unloading_minutes": 60,
    "waiting_minutes": 15
  },
  "expenses": [
    {
      "type": "toll",
      "amount_pence": 500,
      "receipt_url": "https://..."
    }
  ],
  "admin_approved_bonus_pence": 0,
  "pending_bonus_requests": [
    {
      "type": "exceptional_service",
      "requested_amount_pence": 2000,
      "reason": "Handled difficult access situation"
    }
  ],
  "sla_delay_minutes": 0
}
```

**Response:**
```json
{
  "status": "approved",
  "gross_earnings_pence": 18500,
  "platform_fee_pence": 3700,
  "raw_net_earnings_pence": 14800,
  "capped_net_earnings_pence": 14800,
  "daily_cap_validation": {
    "requires_admin_approval": false,
    "cap_applied_pence": 0,
    "total_earned_today_pence": 42000
  },
  "breakdown": {
    "base_distance_rate_pence": 12750,
    "multi_drop_bonus_pence": 3000,
    "capacity_bonus_pence": 1275,
    "time_based_pay_pence": 1475,
    "expenses_pence": 500,
    "penalties_pence": 0
  }
}
```

### 3. Driver Job Management

#### GET /driver/jobs/available
Returns available jobs for a specific driver.

**Query Parameters:**
- `driver_id` (required)
- `max_distance_from_current_location` (optional, default: 50 miles)

**Response:**
```json
{
  "available_jobs": [
    {
      "route_id": "route_12345",
      "summary": "5 Drops (London Area)",
      "estimated_duration_hours": 11.5,
      "estimated_distance_miles": 85,
      "estimated_net_earnings_pence": 18500,
      "requires_admin_approval": false,
      "pickup_locations": [
        {
          "address": "123 Main St, London",
          "postcode": "SW1A 1AA"
        }
      ],
      "drop_locations": [
        {
          "address": "456 Oak Ave, Windsor",
          "postcode": "SL4 1AA"
        }
      ]
    }
  ]
}
```

#### POST /driver/jobs/{route_id}/accept
Driver accepts a specific route.

**Response:**
```json
{
  "assignment_id": "assign_67890",
  "status": "assigned",
  "next_instruction": "Drive to first pickup: 123 Main St, London"
}
```

#### POST /driver/jobs/{assignment_id}/update-status
Updates the status of an active job.

**Request Body:**
```json
{
  "status": "arrived_at_pickup",
  "location": {
    "latitude": 51.5074,
    "longitude": -0.1278
  },
  "timestamp": "2025-10-04T10:30:00Z",
  "notes": "Customer ready for loading"
}
```

#### POST /driver/jobs/{assignment_id}/complete
Completes a job and triggers final earnings calculation.

**Request Body:**
```json
{
  "completion_timestamp": "2025-10-04T18:45:00Z",
  "actual_times": {
    "total_driving_minutes": 180,
    "total_loading_minutes": 45,
    "total_unloading_minutes": 60,
    "total_waiting_minutes": 15
  },
  "expenses": [
    {
      "type": "parking",
      "amount_pence": 300,
      "receipt_url": "https://receipts.speedyvan.com/12345.jpg"
    }
  ],
  "customer_signatures": [
    {
      "drop_id": "drop_1",
      "signature_url": "https://signatures.speedyvan.com/sig_1.png"
    }
  ]
}
```

**Response:**
```json
{
  "status": "completed",
  "payment_status": "processing",
  "message": "Route complete! Payment processing in progress.",
  "requires_admin_approval": true,
  "approval_reasons": ["daily_cap_exceeded", "bonus_pending"]
}
```

**Note:** Drivers receive initial completion confirmation immediately, but final payment notifications are only sent after all admin approvals are complete.

### 4. Admin Dashboard

#### GET /admin/jobs/pending-approval
Returns jobs requiring admin approval due to daily cap breach.

**Response:**
```json
{
  "pending_jobs": [
    {
      "assignment_id": "assign_67890",
      "driver_id": "driver_789",
      "driver_name": "John Smith",
      "route_summary": "3 Drops (Manchester)",
      "raw_net_earnings_pence": 9500,
      "capped_net_earnings_pence": 8000,
      "reason": "Daily cap exceeded",
      "completion_timestamp": "2025-10-04T18:45:00Z"
    }
  ]
}
```

#### POST /admin/jobs/{assignment_id}/approve-payment
Approves a capped payment.

**Request Body:**
```json
{
  "approved_amount_pence": 8000,
  "admin_notes": "Approved capped payment due to daily limit"
}
```

## Error Handling

All API endpoints return standard HTTP status codes:

- `200 OK` - Successful request
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Invalid or missing authentication
- `403 Forbidden` - Daily cap exceeded, requires admin approval
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Error responses include a detailed message:
```json
{
  "error": {
    "code": "DAILY_CAP_EXCEEDED",
    "message": "Driver has exceeded the £500 daily earnings cap",
    "details": {
      "current_earnings_pence": 48000,
      "attempted_earnings_pence": 9500,
      "cap_limit_pence": 50000
    }
  }
}
```


#### GET /admin/bonuses/pending-approval
Returns bonus requests requiring admin approval.

**Response:**
```json
{
  "pending_bonuses": [
    {
      "bonus_request_id": "bonus_12345",
      "assignment_id": "assign_67890",
      "driver_id": "driver_789",
      "driver_name": "John Smith",
      "bonus_type": "exceptional_service",
      "requested_amount_pence": 2000,
      "reason": "Handled difficult access situation with professionalism",
      "requested_by": "system_auto",
      "request_timestamp": "2025-10-04T18:45:00Z",
      "supporting_evidence": [
        {
          "type": "customer_feedback",
          "content": "Driver was extremely helpful with narrow staircase"
        }
      ]
    }
  ]
}
```

#### POST /admin/bonuses/{bonus_request_id}/approve
Approves or rejects a bonus request.

**Request Body:**
```json
{
  "action": "approve",
  "approved_amount_pence": 2000,
  "admin_notes": "Approved for exceptional customer service",
  "admin_id": "admin_123"
}
```

**Response:**
```json
{
  "status": "approved",
  "bonus_id": "bonus_approved_67890",
  "approved_amount_pence": 2000,
  "approval_timestamp": "2025-10-04T19:15:00Z"
}
```

#### POST /admin/bonuses/request
Allows admin to manually request a bonus for a driver.

**Request Body:**
```json
{
  "assignment_id": "assign_67890",
  "driver_id": "driver_789",
  "bonus_type": "manual_admin_bonus",
  "requested_amount_pence": 1500,
  "reason": "Went above and beyond during difficult delivery",
  "admin_id": "admin_123"
}
```

### 5. Multi-Van Operations

#### POST /routes/split-large-order
Analyzes a large order and splits it across multiple vans.

**Request Body:**
```json
{
  "booking_id": "booking_12345",
  "total_volume_m3": 42,
  "total_weight_kg": 2500,
  "items": [
    {
      "item_id": "item_1",
      "name": "King Size Bed",
      "volume_m3": 2.5,
      "weight_kg": 80,
      "room": "master_bedroom"
    }
  ],
  "pickup_address": "123 Main St, London",
  "delivery_address": "456 Oak Ave, Windsor"
}
```

**Response:**
```json
{
  "split_successful": true,
  "vans_required": 3,
  "coordinated_routes": [
    {
      "van_id": 1,
      "route_id": "route_12345_van1",
      "assigned_items": ["item_1", "item_2"],
      "volume_utilization": 1.0,
      "estimated_earnings_pence": 4500,
      "loading_time_slot": "09:00-09:30"
    },
    {
      "van_id": 2,
      "route_id": "route_12345_van2", 
      "assigned_items": ["item_3", "item_4"],
      "volume_utilization": 1.0,
      "estimated_earnings_pence": 4500,
      "loading_time_slot": "09:30-10:00"
    },
    {
      "van_id": 3,
      "route_id": "route_12345_van3",
      "assigned_items": ["item_5", "item_6"],
      "volume_utilization": 0.8,
      "estimated_earnings_pence": 4350,
      "loading_time_slot": "10:00-10:30"
    }
  ],
  "coordination_details": {
    "synchronized_arrival_time": "09:00",
    "estimated_completion_time": "14:30",
    "team_leader_van": 1
  }
}
```

#### GET /driver/jobs/team-operations/{route_id}
Returns coordination details for drivers participating in multi-van operations.

**Response:**
```json
{
  "team_operation": true,
  "total_vans": 3,
  "your_van_number": 1,
  "team_leader": true,
  "coordination_instructions": [
    "Arrive at pickup location by 09:00",
    "Begin loading during your assigned slot: 09:00-09:30",
    "Coordinate with Van 2 and Van 3 drivers via team chat",
    "Wait for all vans before departing to delivery location"
  ],
  "team_communication": {
    "chat_channel_id": "team_12345",
    "other_drivers": [
      {
        "van_number": 2,
        "driver_name": "John Smith",
        "phone_last_4": "1234"
      },
      {
        "van_number": 3,
        "driver_name": "Sarah Jones", 
        "phone_last_4": "5678"
      }
    ]
  },
  "backup_protocols": {
    "emergency_contact": "+44 20 1234 5678",
    "backup_van_available": true,
    "reallocation_possible": true
  }
}
```

#### POST /admin/large-orders/monitor
Real-time monitoring endpoint for operations team to track multi-van jobs.

**Response:**
```json
{
  "active_large_orders": [
    {
      "booking_id": "booking_12345",
      "customer_name": "Johnson Family",
      "total_vans": 3,
      "current_status": "loading_in_progress",
      "vans_status": [
        {
          "van_id": 1,
          "driver_name": "Mike Wilson",
          "status": "loading",
          "location": "123 Main St, London",
          "progress": "60%"
        },
        {
          "van_id": 2,
          "driver_name": "John Smith", 
          "status": "loading",
          "location": "123 Main St, London",
          "progress": "45%"
        },
        {
          "van_id": 3,
          "driver_name": "Sarah Jones",
          "status": "waiting",
          "location": "123 Main St, London", 
          "progress": "0%"
        }
      ],
      "estimated_completion": "14:30",
      "issues": [],
      "customer_payment": 400000,
      "total_driver_costs": 13350
    }
  ]
}
```

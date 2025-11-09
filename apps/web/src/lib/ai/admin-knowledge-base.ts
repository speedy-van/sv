/**
 * Admin Knowledge Base for Speedy AI Chatbot
 * Comprehensive information about all system features, APIs, and workflows
 */

export const ADMIN_KNOWLEDGE_BASE = {
  
  // ============================================================================
  // ORDER MANAGEMENT
  // ============================================================================
  orders: {
    lifecycle: [
      'DRAFT → Customer creating order',
      'PENDING_PAYMENT → Waiting for payment',
      'CONFIRMED → Paid, ready for assignment',
      'IN_PROGRESS → Driver working on it',
      'COMPLETED → Successfully delivered',
      'CANCELLED → Cancelled by customer/admin'
    ],
    
    apis: {
      list: 'GET /api/admin/orders - Filter by status, date, search',
      details: 'GET /api/admin/orders/[code] - Full order details',
      assign: 'POST /api/admin/orders/[code]/assign-driver - Assign to driver',
      cancel: 'POST /api/admin/orders/[code]/cancel - Cancel order',
      edit: 'PUT /api/admin/orders/[code] - Edit order details'
    },
    
    commonIssues: {
      unassigned: 'Check available drivers → POST /api/admin/orders/[code]/assign-driver',
      delayed: 'Notify customer → Contact driver → Consider reassignment',
      customerComplaint: 'Review → Offer refund/discount → Log in audit trail',
      paymentFailed: 'Contact customer → Request new payment → Extend deadline'
    }
  },

  // ============================================================================
  // MULTI-DROP ROUTES
  // ============================================================================
  routes: {
    types: {
      automatic: {
        api: 'POST /api/admin/routes/auto-create',
        description: 'System automatically creates optimized routes from pending drops',
        params: 'maxDropsPerRoute, maxDistanceKm, serviceTier',
        useWhen: 'High volume of pending bookings, want to save time'
      },
      semiAutomatic: {
        api: 'POST /api/admin/routes/create',
        description: 'Admin selects bookings, system optimizes sequence',
        params: 'bookingIds[], driverId, autoOptimize',
        useWhen: 'Want control over which bookings go together'
      },
      manual: {
        api: 'POST /api/admin/routes/multi-drop',
        description: 'Full manual control - admin chooses everything',
        params: 'drops[], driverId, startTime, notes',
        useWhen: 'Special cases, VIP customers, custom requirements'
      },
      ai: {
        api: 'POST /api/admin/routes/smart-generate',
        description: 'AI analyzes and creates optimal route with ML',
        params: 'bookingIds[], date, driverId (optional)',
        useWhen: 'Want best possible optimization using AI'
      }
    },

    optimization: {
      algorithm: 'Nearest Neighbor (greedy approach)',
      factors: ['Distance', 'Time windows', 'Vehicle capacity', 'Traffic patterns'],
      improvements: [
        'Reduce total distance by 15-30%',
        'Minimize backtracking',
        'Respect time windows',
        'Balance driver workload'
      ]
    },

    management: {
      assign: 'POST /api/admin/routes/[id]/assign - Assign to specific driver',
      reassign: 'POST /api/admin/routes/[id]/reassign - Move to different driver',
      unassign: 'POST /api/admin/routes/[id]/unassign - Remove driver assignment',
      addDrop: 'POST /api/admin/routes/[id]/drops - Add stop to route',
      removeDrop: 'DELETE /api/admin/routes/[id]/drops/[dropId] - Remove stop',
      reorder: 'PUT /api/admin/routes/[id]/reorder - Change stop sequence',
      cancel: 'POST /api/admin/routes/[id]/cancel - Cancel entire route'
    },

    statuses: [
      'planned → Route created, ready for assignment',
      'pending_assignment → Waiting for driver',
      'assigned → Driver assigned, not started',
      'in_progress → Driver actively working',
      'completed → All stops delivered',
      'cancelled → Route cancelled',
      'failed → Route failed (incident, breakdown)'
    ]
  },

  // ============================================================================
  // DRIVER MANAGEMENT
  // ============================================================================
  drivers: {
    onboarding: [
      '1. Driver applies → POST /api/careers/apply',
      '2. Admin reviews → GET /api/admin/careers',
      '3. Admin approves → POST /api/admin/careers/[id]/approve',
      '4. Contract sent via email',
      '5. Driver signs up → Driver app registration',
      '6. Admin activates → PUT /api/admin/drivers/[id]'
    ],

    assignment: {
      manual: 'Admin chooses driver → POST /api/admin/orders/[code]/assign-driver',
      automatic: 'System finds best match → POST /api/admin/auto-assignment',
      smart: 'AI recommends best driver → POST /api/admin/dispatch/smart-assign'
    },

    jobQueue: {
      description: 'Drivers can accept multiple jobs at once',
      behavior: [
        'Driver accepts Job 1 → Can start immediately',
        'Driver accepts Job 2 → Automatically queued (Position 2)',
        'Driver accepts Job 3 → Queued (Position 3)',
        'When Job 1 completes → Job 2 becomes active',
        'Jobs sorted by scheduledAt (earliest first)'
      ],
      apis: {
        accept: 'POST /api/driver/jobs/[id]/accept - Returns queueInfo',
        active: 'GET /api/driver/jobs/active - Current active job only',
        schedule: 'GET /api/driver/schedule - All queued jobs'
      }
    },

    performance: {
      metrics: ['Acceptance rate', 'On-time rate', 'Customer ratings', 'Total deliveries'],
      tracking: 'GET /api/admin/drivers/[id]/stats',
      bonuses: 'POST /api/admin/bonuses/approve - Approve bonus requests'
    }
  },

  // ============================================================================
  // PRICING SYSTEM
  // ============================================================================
  pricing: {
    engines: {
      comprehensive: {
        api: 'POST /api/pricing/comprehensive',
        features: [
          '22-field UK dataset items',
          'Distance-based pricing',
          'Time factor adjustments (rush hour, peak season)',
          'Multi-drop discounts',
          'Property access fees',
          'Service level multipliers'
        ]
      },
      quote: {
        api: 'POST /api/pricing/quote',
        use: 'Quick quotes without full validation'
      }
    },

    components: [
      'Base Fee: £37.50-75.00',
      'Distance Fee: £1.50/km',
      'Items Fee: Based on weight + volume',
      'Service Fee: Premium/White-glove extras',
      'Vehicle Fee: Van type surcharge',
      'Property Access Fee: Stairs, parking, etc.',
      'VAT: 20% on total'
    ]
  },

  // ============================================================================
  // SYSTEM FEATURES
  // ============================================================================
  features: {
    realTimeTracking: {
      driver: 'GPS location every 30 seconds',
      customer: 'Live map on /track/[reference]',
      admin: 'Real-time dashboard updates via Pusher'
    },

    notifications: {
      pusher: 'Real-time via Pusher (admin-notifications, driver-{id})',
      email: 'Via Resend (order confirmations, driver assignments)',
      sms: 'Critical alerts (delays, cancellations)'
    },

    analytics: {
      revenue: 'GET /api/admin/analytics/revenue',
      drivers: 'GET /api/admin/analytics/drivers',
      routes: 'GET /api/admin/analytics/routes',
      customers: 'GET /api/admin/analytics/customers'
    }
  },

  // ============================================================================
  // COMMON WORKFLOWS
  // ============================================================================
  workflows: {
    assignOrder: [
      '1. Find order: GET /api/admin/orders?search=[reference]',
      '2. Check available drivers: GET /api/admin/drivers?status=active',
      '3. Assign: POST /api/admin/orders/[code]/assign-driver { driverId }',
      '4. Verify: Check driver receives Pusher notification',
      '5. Monitor: Track in real-time dashboard'
    ],

    createRoute: [
      '1. View pending bookings: GET /api/admin/orders?status=CONFIRMED&driverId=null',
      '2. Select compatible bookings (same area/time)',
      '3. Create route: POST /api/admin/routes/create { bookingIds[], driverId }',
      '4. Review optimization',
      '5. Assign to driver',
      '6. Monitor progress'
    ],

    handleComplaint: [
      '1. Get order details: GET /api/admin/orders/[code]',
      '2. Review job events: Check Assignment.JobEvent[]',
      '3. Contact driver: Check driver.User.phone',
      '4. Offer solution: Refund, discount, or re-delivery',
      '5. Log in audit trail: POST /api/admin/audit-log'
    ]
  },

  // ============================================================================
  // TROUBLESHOOTING GUIDE
  // ============================================================================
  troubleshooting: {
    orderNotAssigned: {
      check: ['Driver availability', 'Order postcode coverage', 'Vehicle capacity'],
      fix: ['Use auto-assignment', 'Manually assign', 'Adjust order details']
    },

    driverNotAccepting: {
      check: ['Driver online status', 'Job queue full', 'Outside coverage area'],
      fix: ['Contact driver', 'Reassign to other driver', 'Adjust pricing']
    },

    routeInefficient: {
      check: ['Drop sequence', 'Distance calculation', 'Time windows'],
      fix: ['Use auto-optimize', 'Manually reorder', 'Split into multiple routes']
    },

    paymentFailed: {
      check: ['Payment method', 'Stripe logs', 'Customer notified'],
      fix: ['Request new payment', 'Manual payment link', 'Contact customer']
    }
  },

  // ============================================================================
  // QUICK ACTIONS
  // ============================================================================
  quickActions: {
    findOrder: '1. Admin panel → Orders → Search by reference/customer',
    assignDriver: '2. Select order → Actions → Assign Driver → Choose from list',
    createRoute: '3. Routes → Create New → Select bookings → Auto-optimize',
    viewAnalytics: '4. Dashboard → Analytics tab → Revenue/Performance metrics',
    approveDriver: '5. Drivers → Applications → Review → Approve',
    issueRefund: '6. Orders → [code] → Actions → Process Refund'
  },

  // ============================================================================
  // DECISION TREES
  // ============================================================================
  decisionTrees: {
    orderDelayed: {
      question: 'Why is order delayed?',
      options: {
        driverIssue: {
          action: 'Contact driver → If no response in 15min → Reassign',
          api: 'POST /api/admin/orders/[code]/remove-driver then assign-driver'
        },
        traffic: {
          action: 'Update ETA → Notify customer → Monitor progress',
          api: 'POST /api/admin/orders/[code]/send-notification'
        },
        customerUnavailable: {
          action: 'Attempt contact → Leave delivery note → Reschedule',
          api: 'PUT /api/admin/orders/[code] with new scheduledAt'
        }
      }
    },
    
    multipleUnassigned: {
      question: 'Many orders unassigned - what to do?',
      decision: [
        'IF <5 orders in same area → Manual assignment',
        'IF 5-15 orders → Use auto-routing (POST /api/admin/routes/auto-create)',
        'IF >15 orders → Review driver capacity, hire more drivers'
      ]
    },

    driverPerformance: {
      question: 'Driver has low rating - action?',
      thresholds: {
        rating_below_4: 'Send performance improvement plan',
        rating_below_3_5: 'Temporary suspension + mandatory training',
        rating_below_3: 'Consider termination'
      },
      api: 'PUT /api/admin/drivers/[id] with status'
    }
  },

  // ============================================================================
  // ADVANCED WORKFLOWS
  // ============================================================================
  advancedWorkflows: {
    bulkRouteCreation: {
      scenario: 'Create 10+ routes for tomorrow',
      steps: [
        '1. GET /api/admin/orders?status=CONFIRMED&scheduledDate=tomorrow',
        '2. Group by area (postcode prefix)',
        '3. For each group: POST /api/admin/routes/create',
        '4. Review all routes: GET /api/admin/routes?date=tomorrow',
        '5. Bulk assign drivers: POST /api/admin/routes/bulk',
        '6. Notify all drivers via Pusher'
      ],
      tips: 'Use auto-create for speed, but review manually for quality'
    },

    monthEndFinance: {
      scenario: 'Month-end financial close',
      steps: [
        '1. Generate revenue report: GET /api/admin/finance/ledger?month=current',
        '2. Review unpaid orders: GET /api/admin/orders?paymentStatus=pending',
        '3. Process driver payouts: GET /api/admin/finance/payouts',
        '4. Approve bonuses: GET /api/admin/bonuses/pending',
        '5. Export data for accounting: GET /api/admin/analytics/reports/export',
        '6. Archive old records: POST /api/admin/cleanup'
      ]
    },

    scaleDriverFleet: {
      scenario: 'Need to hire 20 drivers quickly',
      steps: [
        '1. Review applications: GET /api/admin/careers?status=pending',
        '2. Batch approve qualified: POST /api/admin/careers/bulk-approve',
        '3. Send contracts automatically',
        '4. Setup onboarding schedule',
        '5. Assign mentors from top performers',
        '6. Monitor first-week performance'
      ]
    }
  },

  // ============================================================================
  // PERFORMANCE BENCHMARKS
  // ============================================================================
  benchmarks: {
    orderAssignment: {
      excellent: '<5 minutes average',
      good: '5-15 minutes',
      poor: '>15 minutes',
      action: 'If poor, enable auto-assignment or hire more drivers'
    },
    driverUtilization: {
      excellent: '>75% active',
      good: '50-75% active',
      poor: '<50% active',
      action: 'If poor, review scheduling or reduce driver count'
    },
    customerSatisfaction: {
      excellent: '>4.5 stars',
      good: '4.0-4.5 stars',
      poor: '<4.0 stars',
      action: 'If poor, review driver quality and service process'
    }
  }
};

/**
 * ✅ ENHANCED: Get context-aware help based on query keywords
 */
export function getContextualHelp(query: string): string {
  const lower = query.toLowerCase();
  
  // Route creation queries
  if (lower.includes('route') && lower.includes('create')) {
    return JSON.stringify(ADMIN_KNOWLEDGE_BASE.routes.types, null, 2);
  }
  
  // Driver assignment queries
  if (lower.includes('assign') && lower.includes('driver')) {
    return JSON.stringify(ADMIN_KNOWLEDGE_BASE.drivers.assignment, null, 2);
  }
  
  // Pricing queries
  if (lower.includes('pricing') || lower.includes('quote')) {
    return JSON.stringify(ADMIN_KNOWLEDGE_BASE.pricing, null, 2);
  }
  
  // Workflow queries
  if (lower.includes('workflow')) {
    return JSON.stringify(ADMIN_KNOWLEDGE_BASE.workflows, null, 2);
  }
  
  // ✅ NEW: Decision tree queries
  if (lower.includes('delayed') || lower.includes('late')) {
    return JSON.stringify(ADMIN_KNOWLEDGE_BASE.decisionTrees.orderDelayed, null, 2);
  }
  
  if (lower.includes('unassigned') || lower.includes('pending assignment')) {
    return JSON.stringify(ADMIN_KNOWLEDGE_BASE.decisionTrees.multipleUnassigned, null, 2);
  }
  
  if (lower.includes('driver') && (lower.includes('rating') || lower.includes('performance'))) {
    return JSON.stringify(ADMIN_KNOWLEDGE_BASE.decisionTrees.driverPerformance, null, 2);
  }
  
  // ✅ NEW: Advanced workflow queries
  if (lower.includes('bulk') && lower.includes('route')) {
    return JSON.stringify(ADMIN_KNOWLEDGE_BASE.advancedWorkflows.bulkRouteCreation, null, 2);
  }
  
  if (lower.includes('month end') || lower.includes('finance') && lower.includes('close')) {
    return JSON.stringify(ADMIN_KNOWLEDGE_BASE.advancedWorkflows.monthEndFinance, null, 2);
  }
  
  if (lower.includes('hire') && lower.includes('driver')) {
    return JSON.stringify(ADMIN_KNOWLEDGE_BASE.advancedWorkflows.scaleDriverFleet, null, 2);
  }
  
  // ✅ NEW: Performance benchmark queries
  if (lower.includes('benchmark') || lower.includes('target') || lower.includes('kpi')) {
    return JSON.stringify(ADMIN_KNOWLEDGE_BASE.benchmarks, null, 2);
  }
  
  // ✅ NEW: Troubleshooting queries
  if (lower.includes('not') && lower.includes('assigned')) {
    return JSON.stringify(ADMIN_KNOWLEDGE_BASE.troubleshooting.orderNotAssigned, null, 2);
  }
  
  if (lower.includes('driver') && lower.includes('not accepting')) {
    return JSON.stringify(ADMIN_KNOWLEDGE_BASE.troubleshooting.driverNotAccepting, null, 2);
  }
  
  if (lower.includes('inefficient') || (lower.includes('route') && lower.includes('slow'))) {
    return JSON.stringify(ADMIN_KNOWLEDGE_BASE.troubleshooting.routeInefficient, null, 2);
  }
  
  if (lower.includes('payment') && lower.includes('failed')) {
    return JSON.stringify(ADMIN_KNOWLEDGE_BASE.troubleshooting.paymentFailed, null, 2);
  }
  
  return '';
}


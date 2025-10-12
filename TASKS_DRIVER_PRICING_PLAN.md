# Driver Pricing Workflow Execution Plan

_All tasks derived directly from the workflow assets in `c:/sv/deiver pricing`. Tasks are ordered by dependency: schema → engine/services → APIs → UI → compliance/testing._

## Schema & Data Layer

1. **Owner:** Backend Engineer  \
   **Path:** `packages/shared/prisma/schema.prisma`, `prisma/migrations`  \
   **Task:** Align database schema with workflow requirements (Booking totals in pence, Assignment linkage, DriverEarnings daily cap fields, DriverPaySnapshot audit, BonusRequest approvals, JobEvent tracking, driver_daily_caps, admin approvals).  \
   **Acceptance Criteria:** All tables and relations listed in `implementation_checklist.md` exist with minor-unit money fields, mileage columns use `_miles`, migrations generated and applied.

2. **Owner:** Backend Engineer  \
   **Path:** `packages/shared/prisma/schema.prisma`, `prisma/migrations`  \
   **Task:** Add structured address fields propagated from autocomplete (street, city, postcode, lat/lng) for bookings, drops, and routes.  \
   **Acceptance Criteria:** Pricing and routing data models store full structured addresses; migrations run without error.

3. **Owner:** Backend Engineer  \
   **Path:** `packages/shared/prisma/schema.prisma`, `prisma/migrations`  \
   **Task:** Introduce `driver_pay_rules`, `driver_daily_caps`, `admin_approvals`, and bonus request tables with audit metadata per workflow.  \
   **Acceptance Criteria:** Tables created with timestamps, admin user references, justification fields; Prisma client regenerated without type errors.

4. **Owner:** Backend Engineer  \
   **Path:** `packages/shared/prisma/schema.prisma`, `prisma/migrations`  \
   **Task:** Ensure all distance and duration fields referenced by pricing/route optimizer are stored in miles/minutes only (no km).  \
   **Acceptance Criteria:** Schema uses `_miles` naming; legacy km columns removed or migrated; data migration scripts provided.

## Pricing & Earnings Engine

5. **Owner:** Pricing Engineer  \
   **Path:** `apps/web/src/lib/pricing/enterprise-driver-pricing.ts`, `packages/pricing/**`  \
   **Task:** Implement multi-component earnings formula verbatim (base distance tiers, multi-drop bonuses, capacity bonuses, time-based pay, expenses, admin bonuses, penalties, platform fee).  \
   **Acceptance Criteria:** Unit-calibrated calculations in miles and pence; drop bonuses match workflow table; capacity bonus triggers ±10%; penalties apply for SLA delays.

6. **Owner:** Pricing Engineer  \
   **Path:** `apps/web/src/lib/pricing/enterprise-driver-pricing.ts`  \
   **Task:** Enforce £500 daily cap before confirmation; overflow returns pending admin review status.  \
   **Acceptance Criteria:** Function returns `pending_admin_review` with cap data when exceeding 50,000 pence; capped earnings recorded; 403 emitted by completion API when cap hit.

7. **Owner:** Pricing Engineer  \
   **Path:** `apps/web/src/lib/pricing/enterprise-driver-pricing.ts`  \
   **Task:** Require admin-approved bonus IDs; reject missing approvals; integrate expense reimbursement and SLA penalties.  \
   **Acceptance Criteria:** Bonus requests without `admin_approval_id` throw; breakdown includes expenses/penalties per workflow.

8. **Owner:** Pricing Engineer  \
   **Path:** `apps/web/src/lib/pricing/enterprise-driver-pricing.ts`  \
   **Task:** Produce parity report showing Enterprise Engine input/output types match driver-pay schema (miles, minor units, enums).  \
   **Acceptance Criteria:** Documented parity file committed; automated check or script verifying type alignment.

## Route Optimization & Multi-Van Logic

9. **Owner:** Routing Engineer  \
   **Path:** `apps/web/src/lib/capacity/**`, `apps/web/src/lib/routing/**`  \
   **Task:** Implement DBSCAN clustering, TSP solver, constraint validation (13h, 1000 miles, 15m³, 1000kg), LIFO manifest, route scoring.  \
   **Acceptance Criteria:** Route planner respects all limits; returns loading manifest; tests cover invalidation scenarios.

10. **Owner:** Routing Engineer  \
    **Path:** `apps/web/src/lib/capacity/multi-booking-route-optimizer.ts`, `apps/web/src/lib/routing/large-order/**`  \
    **Task:** Support multi-van splitting workflow with synchronized scheduling, load balancing, backup protocols.  \
    **Acceptance Criteria:** Large orders split per workflow examples; coordination data persisted; multi-van scenarios tested.

11. **Owner:** Routing Engineer  \
    **Path:** `apps/web/src/lib/capacity/**`  \
    **Task:** Ensure per-leg distances and times feed pricing request; unloading reduces load state; reuse capacity between legs.  \
    **Acceptance Criteria:** Pricing requests include `per_leg_distance_miles`, handling/waiting minutes, utilization metrics update after each drop.

## API Layer

12. **Owner:** Backend Engineer  \
    **Path:** `apps/web/src/app/api/driver/pricing/calculate/route.ts` (new or existing), `apps/web/src/app/api/driver/jobs/**`  \
    **Task:** Implement `/api/driver/pricing/calculate` endpoint per spec; validate miles-only inputs and structured addresses.  \
    **Acceptance Criteria:** Endpoint returns breakdown structure; rejects km units or missing address fields; integrated tests pass.

13. **Owner:** Backend Engineer  \
    **Path:** `apps/web/src/app/api/admin/driver-pay/approve/route.ts`, `apps/web/src/app/api/admin/bonuses/**`  \
    **Task:** Implement admin approval endpoints exactly as specification (pending queues, approve/deny, audit trail).  \
    **Acceptance Criteria:** Admin-only access enforced; approvals update `DriverEarnings`, `DriverPaySnapshot`, audit tables; returns status payloads.

14. **Owner:** Backend Engineer  \
    **Path:** `apps/web/src/app/api/driver/jobs/[id]/complete/route.ts`  \
    **Task:** Ensure completion API enforces cap before writing records, blocks until approvals, stores snapshots, triggers staged notifications.  \
    **Acceptance Criteria:** 403 returned on cap or pending bonus; notifications sent only after approval; snapshots persisted.

15. **Owner:** Backend Engineer  \
    **Path:** `apps/web/src/app/api/routes/**`  \
    **Task:** Align route optimization endpoints (`/routes/optimize`, `/routes/split-large-order`) with workflow fields (miles, capacity, coordination).  \
    **Acceptance Criteria:** Responses include manifest, coordination instructions, utilization; structured addresses present.

## Admin & Driver UI

16. **Owner:** Frontend Engineer (Admin)  \
    **Path:** `apps/web/src/app/admin/**`  \
    **Task:** Build admin dashboard views for pending approvals, bonus queue, cap indicators, audit logs, approval forms.  \
    **Acceptance Criteria:** UI lists pending jobs/bonuses with full breakdown; approve/deny updates backend; audit trail displayed.

17. **Owner:** Frontend Engineer (Admin)  \
    **Path:** `apps/web/src/app/admin/**`  \
    **Task:** Display multi-van monitoring per workflow (team status, progress, issues, payments).  \
    **Acceptance Criteria:** Real-time updates via Pusher/WebSockets showing vans, coordination instructions, financials.

18. **Owner:** Frontend Engineer (Driver)  \
    **Path:** `apps/web/src/app/driver/**`  \
    **Task:** Implement available jobs dashboard with earnings preview, cap warnings, smart loading manifest, expense logging UI.  \
    **Acceptance Criteria:** Drivers see per-drop earnings, LIFO checklist, two-stage notifications, cap alerts as specified.

19. **Owner:** Frontend Engineer (Driver)  \
    **Path:** `apps/web/src/app/driver/**`  \
    **Task:** Present final earnings history with `DriverPaySnapshot` breakdown and cap/bonus notes.  \
    **Acceptance Criteria:** History entries show gross/net, bonuses, cap adjustments; links to audit records.

## Compliance, Notifications, and Integrations

20. **Owner:** Backend Engineer  \
    **Path:** `apps/web/src/lib/notifications/**`, `apps/web/src/lib/pusher/**`  \
    **Task:** Enforce two-stage notification flow and suppress bonus notifications until admin approval.  \
    **Acceptance Criteria:** Initial completion message sent immediately; final message triggered post-approval; logs capture events.

21. **Owner:** Backend Engineer  \
    **Path:** `apps/web/src/lib/security/**`, `apps/web/src/middleware.ts`  \
    **Task:** Ensure JWT auth, role-based access, rate limiting applied to new endpoints.  \
    **Acceptance Criteria:** Protected routes require tokens; role checks for admin endpoints; rate limiter configured.

22. **Owner:** DevOps Engineer  \
    **Path:** `docs/`, `README.md`, service configs  \
    **Task:** Update environment setup for Redis, message queue, file storage; document monitoring/alerts.  \
    **Acceptance Criteria:** README and service docs list new dependencies, env vars; monitoring configuration deployed.

23. **Owner:** QA Engineer  \
    **Path:** `__tests__/`, `apps/web/src/__tests__/**`, Playwright suites  \
    **Task:** Implement unit, integration, and E2E tests per workflow (earnings calc, cap, bonus approval, multi-drop, multi-van).  \
    **Acceptance Criteria:** Tests cover scenarios from workflow; CI fails on km usage; green pipeline.

24. **Owner:** QA Engineer  \
    **Path:** `scripts/`, `docs/`  \
    **Task:** Provide logs demonstrating calculation with full address, per-leg miles, cap trigger, admin approval.  \
    **Acceptance Criteria:** Logged scenarios stored under `logs/driver-pricing/` with references in README.

25. **Owner:** Technical Writer  \
    **Path:** `docs/`, `README.md`, package READMEs  \
    **Task:** Update READMEs after each completed task describing changes and test instructions.  \
    **Acceptance Criteria:** Every touched package README documents modifications, testing steps, and workflow alignment.

26. **Owner:** DevOps Engineer  \
    **Path:** `scripts/duplication-scan.ts`, `package.json` scripts  \
    **Task:** Add duplication/conflict scan run post-task ensuring no duplicate pricing functions, km fields, or shadow endpoints.  \
    **Acceptance Criteria:** Script reports clean state; integrated into task completion checklist.

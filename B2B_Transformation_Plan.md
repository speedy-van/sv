# B2B Transformation: Gap Analysis and Implementation Plan

**Author:** Manus AI
**Date:** January 06, 2026
**Version:** 1.0

## 1. Executive Summary

This document provides a comprehensive analysis of the existing Speedy Van (`sv`) codebase and outlines a detailed implementation plan to deliver the requested B2B functionality. The goal is to transform the current consumer-focused platform into a robust, multi-tenant B2B system with a self-service API portal, advanced administration capabilities, and enterprise-grade features.

A thorough review of the GitHub repository and the provided plan has revealed significant gaps between the current implementation and the desired B2B features. The existing system is well-architected for its consumer use case but lacks the fundamental data models, authentication mechanisms, and business logic required for a corporate environment. 

This plan details a structured, phased approach to bridge these gaps. It is designed to be executed by a lead developer, ensuring a high-quality, scalable, and maintainable implementation. We will proceed with a full-stack implementation, touching everything from the database schema to the frontend administrative interfaces.

## 2. Gap Analysis: Current State vs. B2B Requirements

The following table summarizes the key discrepancies between the existing system and the B2B plan's requirements.

| Feature Area | B2B Requirement (From Plan) | Current System State (Code Analysis) | Gap & Impact |
| :--- | :--- | :--- | :--- |
| **Data Models** | `Company`, `CompanyUser`, `ApiKey`, `PricingRule`, `Invoice` with PO/Cost Center. | **Missing.** No concept of a `Company` entity. `User`, `Booking`, and `Quote` are all individual-centric. | **Critical.** The entire B2B foundation is absent. All B2B features depend on these models. |
| **Authentication** | API Key-based (`Bearer <token>`) with granular scopes. | **Session-based only.** Uses `next-auth` with a `CredentialsProvider` for web users. No API key handling exists. | **Critical.** The primary method for B2B integration is missing. A new authentication middleware is required. |
| **Authorization** | Multi-level roles: `Owner`, `Admin`, `Finance`, `Dispatcher` within a company. | **Basic roles.** `User.role` is a simple enum (`admin`, `driver`, `customer`). `AdminRole` exists but is not tied to a company structure. | **High.** The current system cannot enforce the required B2B permissions hierarchy. |
| **API Endpoints** | Full CRUD for Companies, Users, API Keys, B2B Quotes, Invoices. | **None.** All existing APIs are for the consumer flow or general admin. | **High.** A complete new set of API routes must be built to expose B2B functionality. |
| **Invoicing & Credit** | Net terms (7/14/30), credit limits, `authorize/capture` payment flow. | **Immediate payment.** Stripe integration uses `payment` mode. `Invoice` model is basic. | **High.** Requires significant changes to the payment and invoicing logic to support corporate billing cycles. |
| **API Key Management** | Secure portal for clients to issue, revoke, and rotate keys. | **Not Applicable.** No API keys are used. | **High.** A new secure UI and backend logic must be created from scratch. |
| **Pricing Engine** | Company-specific pricing rules, volume discounts. | **Consumer-focused.** The pricing engine is sophisticated but does not support per-company rules. | **Medium.** The engine's architecture is modular, but it needs to be extended to fetch and apply company-specific rules. |
| **Audit Trail** | Detailed logging for all sensitive B2B actions (role changes, key access, etc.). | **Foundation exists.** An `AuditLog` model is present in the schema. | **Medium.** The existing model is a good start, but implementation is required to ensure all specified B2B events are captured. |
| **Geofencing** | Exclude islands and apply surcharges for remote mainland areas. | **Partially implemented.** `remote-location-checker.ts` and `postcode-validation.ts` exist. | **Low.** The foundation is there. It needs to be integrated and hardened for B2B quoting and booking. |
| **Developer Portal** | Public-facing API documentation with examples and usage policies. | **Internal docs only.** A `docs` folder exists but is for internal development. | **Medium.** A new documentation site (or section) needs to be created for external developers. |

## 3. Detailed Implementation Plan

This plan will be executed sequentially. Each phase builds upon the last, ensuring a stable and logical development process.

### Phase 1: Database Schema Expansion (Prisma)

**Objective:** Establish the core data foundation for all B2B features.

1.  **Create `Company` and `CompanyUser` Models:**
    *   Add the `Company` and `CompanyUser` models to `packages/shared/prisma/schema.prisma` as defined in the user's plan.
    *   Establish relationships: A `Company` has many `CompanyUsers`, and a `User` can be part of multiple companies via `CompanyUser`.
    *   Add fields for status, credit limit, payment terms, VAT, etc.
2.  **Create `ApiKey` Model:**
    *   Add the `ApiKey` model, linked to a `Company`.
    *   Include fields for a hashed key, scopes (as a string array), an optional expiry date, and status.
3.  **Enhance `Booking`, `Quote`, and `Invoice` Models:**
    *   Add a `companyId` to each to associate them with a corporate account.
    *   Add `poNumber` and `costCenter` to the `Invoice` model.
4.  **Create `PricingRule` Model:**
    *   Add the `PricingRule` model, linked to a `Company`, to store custom pricing logic.
5.  **Generate and Apply Migration:**
    *   Run `prisma migrate dev` to apply the new schema to the database.

### Phase 2: B2B Service Layer & Authentication

**Objective:** Build the backend logic and secure the new B2B endpoints.

1.  **Create Company and API Key Services:**
    *   Develop service classes or modules (`company.service.ts`, `apiKey.service.ts`) to handle business logic for creating, managing, and auditing companies and their API keys.
    *   Implement secure key generation and hashing (using `bcrypt` or similar) for API keys. Keys should only be shown to the user once upon creation.
2.  **Implement API Key Authentication Middleware:**
    *   Create a new middleware for Next.js that inspects the `Authorization` header for a `Bearer` token.
    *   The middleware will validate the API key against the hashed keys in the database, check its status and expiry, and retrieve the associated `Company` and `scopes`.
    *   Attach the `company` and `scopes` to the request object for use in downstream API routes.
3.  **Update Authorization Logic:**
    *   Extend the `requireRole` function in `apps/web/src/lib/auth.ts` to create a new `requireScope` function that checks the permissions of the authenticated API key.

### Phase 3: API Route Implementation

**Objective:** Expose all B2B functionality through a well-defined set of RESTful APIs.

1.  **Company Management Endpoints:**
    *   `POST /api/admin/companies`: Create a new company.
    *   `GET /api/admin/companies`: List all companies.
    *   `GET /api/admin/companies/[id]`: Get company details.
    *   `PUT /api/admin/companies/[id]`: Update company details (credit limit, status, etc.).
2.  **API Key Management Endpoints (for Company Admins):**
    *   `POST /api/company/apikeys`: Create a new API key.
    *   `GET /api/company/apikeys`: List API keys for the company.
    *   `DELETE /api/company/apikeys/[keyId]`: Revoke an API key.
3.  **B2B Booking and Quoting Endpoints:**
    *   `POST /api/b2b/quotes`: Create a quote using an API key.
    *   `POST /api/b2b/bookings`: Create a booking from an accepted quote.
4.  **B2B Invoicing Endpoints:**
    *   `GET /api/b2b/invoices`: List invoices for a company.
    *   `GET /api/b2b/invoices/[id]`: Get invoice details.

### Phase 4: Admin Dashboard UI

**Objective:** Provide administrators with the tools to manage the entire B2B system.

1.  **Create Company Management View:**
    *   Develop a new section in the admin dashboard (`/admin/companies`).
    *   Build a table to list all companies with search and filter capabilities.
    *   Create a form to create and edit companies, including setting credit limits and payment terms.
2.  **Create Company Detail View:**
    *   Develop a page (`/admin/companies/[id]`) that shows a complete overview of a company, including its users, bookings, invoices, and API keys.
3.  **Create API Key Management Interface (for Company Admins):**
    *   Build a new section in the main user portal (for users with `Owner` or `Admin` roles in a company) to manage API keys.
    *   The interface will allow users to generate new keys, view their usage, and revoke them.

### Phase 5: Finalization and Documentation

**Objective:** Polish the implementation, add supporting features, and document the system.

1.  **Implement Audit Logging:**
    *   Integrate an `audit` service that uses the `AuditLog` model to record all critical B2B actions identified in the plan.
2.  **Create B2B Email Templates:**
    *   Develop new email templates for company user invitations, API key generation notifications, and credit limit warnings.
3.  **Update Stripe Integration:**
    *   Modify the Stripe payment flow to support the `authorize` and `capture` pattern for corporate clients with credit terms.
4.  **Create Zod Schemas:**
    *   Define Zod schemas for all new API request bodies to ensure type safety and validation.
5.  **Write Developer Documentation:**
    *   Create a new `docs/api` section with detailed documentation for all new B2B API endpoints, including request/response examples and authentication instructions.

This comprehensive plan ensures that all requirements from the user's document are met and integrated seamlessly into the existing application architecture. We will now proceed with the execution of this plan.

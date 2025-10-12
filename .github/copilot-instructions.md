# GitHub Copilot Instructions

## Core Development Guidelines

### Code Management
- **File Creation**: Do not create new files unless explicitly requested by the user
- **Scope**: Work only within the file currently being edited
- **Code Reuse**: Avoid duplicating code or functions - identify and reuse existing patterns

### TypeScript Standards
- Use TypeScript with strict typing enabled (`strict: true` in tsconfig)
- Always include explicit type annotations for function parameters and return types
- Utilize TypeScript's built-in utility types when appropriate

### Error Handling
- All error cases must be handled explicitly
- Use try/catch blocks for operations that may throw
- Return explicit error types rather than throwing where appropriate
- Example pattern:
  ```typescript
  type Result<T> = {
    success: true;
    data: T;
  } | {
    success: false;
    error: string;
  };
  ```

### Communication Style
- Always communicate in Arabic
- Write code in English
- When showing changes, display only the relevant diff or updated snippet
- Do not show the entire file content unless specifically requested
- Request clarification when requirements are ambiguous
- Provide clear explanations for suggested changes

### Booking System
- The only booking system allowed is `booking-luxury`
- No other booking systems are permitted
- Any old APIs, endpoints, or routes must be deleted
- Reference: `apps/web/src/app/booking-luxury/` for the 2-step booking flow with automatic confirmation

### Architecture Overview
- **Monorepo Structure**: Uses Turbo and pnpm with packages in `packages/` (shared, pricing, utils) and main app in `apps/web/`
- **Framework**: Next.js 14 with App Router, React 18, TypeScript
- **Database**: Prisma ORM with PostgreSQL (Neon cloud)
- **Styling**: Chakra UI with custom theme
- **Payments**: Stripe integration
- **Maps**: Mapbox for geocoding and routing
- **Real-time**: Pusher for notifications
- **Key Models**: User, Driver, Booking, Assignment, etc. in `packages/shared/prisma/schema.prisma`

### Developer Workflows
- **Package Manager**: pnpm with workspaces
- **Build**: `pnpm build` (Turbo orchestration)
- **Dev Server**: `pnpm dev` (parallel with Turbo)
- **Database**: `pnpm prisma:generate`, `pnpm prisma:migrate`, `pnpm prisma:studio`
- **Testing**: Jest for unit tests, Playwright for E2E tests
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Deployment**: Docker-based with docker-compose.yml

### Project-Specific Patterns
- **Path Aliases**: `@/*` for web app, `@speedy-van/*` for packages
- **API Routes**: RESTful endpoints in `apps/web/src/app/api/`
- **Components**: Reusable UI in `apps/web/src/components/`
- **Hooks**: Custom React hooks in `apps/web/src/hooks/`
- **Utils**: Shared utilities in `packages/utils/`
- **Pricing Engine**: Dynamic pricing logic in `packages/pricing/`
- **Error Handling**: Use Result<T> pattern for API responses
- **Authentication**: NextAuth.js with role-based access (customer, driver, admin)

### Best Practices
- Follow existing patterns in the codebase
- Maintain consistent error handling approaches
- Keep code modular and maintainable
- Ensure type safety across the codebase
- Use workspace packages for shared code
- Test critical paths with both unit and E2E tests
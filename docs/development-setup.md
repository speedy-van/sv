# Development Setup Guide

This guide will help you set up your development environment for the Speedy Van project.

## 🖥️ Prerequisites

### Required Software

- **Node.js**: Version 18.x or higher
- **pnpm**: Version 10.13.1 (will be installed automatically via Corepack)
- **Git**: Latest version
- **Database**: PostgreSQL (Neon cloud database is used in production)

### Recommended Software

- **VS Code**: With recommended extensions
- **Docker**: For local development services
- **Postman**: For API testing

## 🚀 Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/speedy-van.git
cd speedy-van
```

### 2. Enable Corepack (for pnpm)

```bash
corepack enable
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Environment Configuration

Copy the environment template and configure your local environment:

```bash
cp env.example .env.local
```

**Required Environment Variables:**

```bash
# Database
DATABASE_URL=your_local_or_test_database_url

# Authentication
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000

# External Services (get from team lead)
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
STRIPE_SECRET_KEY=your_stripe_test_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 5. Database Setup

```bash
# Generate Prisma client
pnpm --filter ./apps/web prisma generate

# Run migrations
pnpm --filter ./apps/web prisma migrate dev

# Seed database (if available)
pnpm --filter ./apps/web prisma db seed
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
# Start the web application
pnpm dev

# The app will be available at http://localhost:3000
```

### Building for Production

```bash
# Build all packages
pnpm build

# Start production server
pnpm start
```

## 🧪 Testing

### Run Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test:coverage

# Specific test file
pnpm --filter ./apps/web test path/to/test.spec.ts
```

### E2E Tests

```bash
# Run Playwright tests
pnpm --filter ./apps/web test:e2e

# Run specific E2E test
pnpm --filter ./apps/web test:e2e --grep "test name"
```

## 🔍 Code Quality

### Linting and Formatting

```bash
# Check code quality
pnpm lint

# Auto-fix issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check
```

### Type Checking

```bash
# Check TypeScript types
pnpm type-check
```

## 📁 Project Structure

```
speedy-van/
├── apps/
│   └── web/                 # Next.js web application
│       ├── src/             # Source code
│       ├── prisma/          # Database schema and migrations
│       ├── tests/           # Test files
│       └── public/          # Static assets
├── packages/
│   └── shared/              # Shared utilities and types
├── docs/                    # Documentation
├── scripts/                 # Build and utility scripts
└── .github/                 # GitHub Actions workflows
```

## 🛠️ Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Follow the [Coding Standards](./coding-standards.md)
- Write tests for new functionality
- Update documentation as needed

### 3. Pre-commit Checks

The project uses Git hooks to ensure code quality:

- ESLint checks
- Prettier formatting
- Type checking

### 4. Commit and Push

```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/your-feature-name
```

### 5. Create Pull Request

- Follow the [Pull Request Template](./.github/pull_request_template.md)
- Ensure all CI checks pass
- Request review from team members

## 🔧 Common Issues and Solutions

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Issues

- Verify your `DATABASE_URL` in `.env.local`
- Ensure the database is running and accessible
- Check firewall settings

### Build Errors

```bash
# Clean and reinstall
pnpm clean
pnpm install
pnpm build
```

### TypeScript Errors

```bash
# Regenerate Prisma client
pnpm --filter ./apps/web prisma generate

# Clear TypeScript cache
rm -rf apps/web/.next apps/web/tsconfig.tsbuildinfo
```

## 📚 Additional Resources

- [Coding Standards](./coding-standards.md)
- [Testing Strategy](./testing.md)
- [API Documentation](../architecture/api.md)
- [Component Library](../architecture/components.md)

## 🆘 Getting Help

- **Documentation**: Check the relevant docs first
- **Team Chat**: Ask in the development channel
- **Issues**: Create a GitHub issue for bugs
- **Discussions**: Use GitHub Discussions for questions

---

_Last updated: $(date)_

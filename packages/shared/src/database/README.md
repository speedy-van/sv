# 🔒 Protected Database Module

## Overview

This module provides a secure, environment-aware database connection layer that automatically validates environments and prevents accidental production database access during development.

## Files

### `db-protection.ts`

Core protection system that:
- Detects production vs development databases
- Validates environment configuration
- Blocks mismatched environment/database combinations
- Provides middleware for logging operations

### `index-protected.ts`

Protected Prisma client that:
- Automatically validates environment on import
- Applies protection middleware
- Provides connection utilities
- Enforces environment safety rules

### `index.ts` (legacy)

Original Prisma client without protection.
**Recommendation**: Migrate to `index-protected.ts` for all new code.

## Usage

### Recommended (Protected)

```typescript
import { prisma } from '@/packages/shared/src/database/index-protected';

// Automatically validates environment
// Blocks if production database in development
// Logs all operations for audit
```

### Legacy (Not Protected)

```typescript
import { prisma } from '@/packages/shared/src/database';

// No environment validation
// Not recommended for new code
```

## Environment Detection

The system automatically detects:

1. **Production Database**: 
   - Contains `ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech`
   - Database name contains `neondb`
   - Connection string contains production credentials

2. **Production Environment**:
   - `NODE_ENV=production`
   - `ENVIRONMENT_MODE=production`

## Protection Rules

| Scenario | Action | Reason |
|----------|--------|--------|
| Dev env + Dev DB | ✅ Allow | Safe |
| Prod env + Prod DB | ✅ Allow | Expected |
| Dev env + Prod DB | ❌ Block | Dangerous |
| Prod env + Dev DB | ⚠️ Allow with warning | Unusual but allowed |

## API

### Environment Validation

```typescript
import { validateDatabaseEnvironment } from './db-protection';

// Throws error if environment is misconfigured
validateDatabaseEnvironment();
```

### Environment Info

```typescript
import { getEnvironmentInfo } from './db-protection';

const info = getEnvironmentInfo();
console.log(info);
// {
//   nodeEnv: 'development',
//   environmentMode: 'development',
//   isProduction: false,
//   isDatabaseProduction: false,
//   migrationsAllowed: true,
//   seedingAllowed: true,
//   databaseUrl: 'postgresql://...'
// }
```

### Protection Checks

```typescript
import { 
  isProductionDatabase,
  isProductionEnvironment,
  areMigrationsAllowed,
  isSeedingAllowed 
} from './db-protection';

if (isProductionDatabase()) {
  console.log('Using production database');
}

if (areMigrationsAllowed()) {
  // Safe to run migrations
}

if (isSeedingAllowed()) {
  // Safe to seed data
}
```

### Protected Client Creation

```typescript
import { createProtectedPrismaClient } from './db-protection';

const prisma = createProtectedPrismaClient();
// Automatically validated
// Protection middleware applied
```

## Error Messages

### Production Database Blocked

```
╔════════════════════════════════════════════════════════════════╗
║                   🚨 DATABASE PROTECTION 🚨                    ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  CRITICAL ERROR: Production database detected in              ║
║  non-production environment!                                  ║
║                                                                ║
║  Current Environment: development                             ║
║  Database: PRODUCTION                                         ║
║                                                                ║
║  This is a safety mechanism to prevent accidental data        ║
║  modification or deletion in the production database.         ║
║                                                                ║
║  SOLUTION:                                                    ║
║  1. Update your .env.local with development database URL      ║
║  2. Set ENVIRONMENT_MODE=development                          ║
║  3. Never use production DATABASE_URL in development          ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

**Solution**: Update your `.env.local` with development database URL.

## Migration Guide

### From Old Client to Protected Client

**Before:**

```typescript
// apps/web/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

**After:**

```typescript
// Use the protected version
export { prisma } from '@/packages/shared/src/database/index-protected';
```

### Updating Imports

**Old:**
```typescript
import { prisma } from '@/lib/prisma';
import prisma from '@/packages/shared/src/database';
```

**New:**
```typescript
import { prisma } from '@/packages/shared/src/database/index-protected';
```

## Configuration

### Development (.env.local)

```bash
DATABASE_URL=postgresql://user:pass@host.neon.tech/speedyvan-dev?...
NODE_ENV=development
ENVIRONMENT_MODE=development
ALLOW_MIGRATIONS=true
ALLOW_DATA_SEEDING=true
```

### Production (.env.production)

```bash
DATABASE_URL=postgresql://user:pass@host.neon.tech/neondb?...
NODE_ENV=production
ENVIRONMENT_MODE=production
ALLOW_MIGRATIONS=false
ALLOW_DATA_SEEDING=false
```

## Testing the Protection

```bash
# Run the verification script
pnpm tsx scripts/verify-environment.ts

# Or use shell script
bash scripts/check-db-environment.sh
```

## Logging

The system logs:

1. **Startup**: Environment validation results
2. **Operations**: All destructive operations in production
3. **Connections**: Connection/disconnection events
4. **Errors**: Configuration mismatches

Example log:

```
🔒 Database Environment Check:
   Environment: DEVELOPMENT
   Database: DEVELOPMENT
   Status: ✅ VALID
```

## Best Practices

1. **Always use protected client** for new code
2. **Never commit** `.env.local` files
3. **Test migrations** in development first
4. **Review logs** before production deployments
5. **Run verification script** before starting development

## Troubleshooting

### Issue: App won't start

**Cause**: Environment/database mismatch

**Solution**: Run verification script to see exact issue
```bash
pnpm tsx scripts/verify-environment.ts
```

### Issue: "PRODUCTION_DATABASE_ACCESS_BLOCKED"

**Cause**: Using production DATABASE_URL in development

**Solution**: Update `.env.local` with development database URL

### Issue: Migrations not allowed

**Cause**: `ALLOW_MIGRATIONS` not set or in production

**Solution**: 
- Development: Set `ALLOW_MIGRATIONS=true` in `.env.local`
- Production: Use proper deployment process

## Related Documentation

- [Environment Separation Guide](../../../../ENVIRONMENT_SEPARATION_GUIDE.md)
- [Quick Setup Guide](../../../../QUICK_SETUP_DATABASE_SEPARATION.md)
- [Prisma Documentation](https://www.prisma.io/docs)

## Support

For issues or questions:
1. Check the logs for detailed error messages
2. Run verification script: `pnpm tsx scripts/verify-environment.ts`
3. Review environment variables
4. See troubleshooting guides above


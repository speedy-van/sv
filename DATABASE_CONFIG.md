# ======================================================
#  Neon Database Configuration Guide
# ======================================================
# 
# Last Updated: November 15, 2025
# Managed by: Neon Serverless PostgreSQL
#
# ⚠️ CRITICAL: Always use the correct environment!
#
# ======================================================

# ------------------------
# 🔴 PRODUCTION DATABASE
# ------------------------
# Project: speedy-van-prod (sweet-butterfly-55777414)
# Region: AWS US West 2 (Oregon)
# Version: PostgreSQL 17
# History Retention: 6 hours
# Compute: 1 ↔ 2 CU (auto-scaling)
#
# ⚠️ WARNING: NO RESET BUTTON - Deletion is IRREVERSIBLE!
# ⚠️ Always test changes on speedy-van-test first!
# ⚠️ Create manual snapshots before major deployments!
#
# Console: https://console.neon.tech/app/projects/sweet-butterfly-55777414
# ------------------------

DATABASE_URL_PRODUCTION="postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Production Database Components (for reference):
# Host: ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech
# Database: neondb
# User: neondb_owner
# Password: npg_qNFE0IHpk1vT
# Port: 5432 (default)

# ------------------------
# 🟢 TEST/DEVELOPMENT DATABASE
# ------------------------
# Project: speedy-van-test (dark-glitter-31729453)
# Region: AWS Europe West 2 (London)
# Version: PostgreSQL 17
# History Retention: 1 day
# Compute: 1 ↔ 8 CU (auto-scaling)
#
# ✅ SAFE: This database can be reset/recreated anytime
# ✅ Use for: Development, Testing, Staging, Experiments
# ✅ Create branches for isolated testing
#
# Console: https://console.neon.tech/app/projects/dark-glitter-31729453
# ------------------------

DATABASE_URL_TEST="postgresql://neondb_owner:npg_4VBzM9sJZQrk@ep-odd-rice-a0p6a3ay-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Test Database Components (for reference):
# Host: ep-odd-rice-a0p6a3ay-pooler.eu-west-2.aws.neon.tech
# Database: neondb
# User: neondb_owner
# Password: npg_4VBzM9sJZQrk
# Port: 5432 (default)

# ------------------------
# 🔵 CURRENT DEVELOPMENT DATABASE
# ------------------------
# This is currently pointing to a separate development instance
# Consider switching to speedy-van-test branches for better workflow
# ------------------------

DATABASE_URL="postgresql://neondb_owner:npg_kFhAEzKB6v7d@ep-round-morning-afkxnska-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# ------------------------
# 📝 BEST PRACTICES
# ------------------------
#
# 1. DEVELOPMENT WORKFLOW:
#    - Create a new branch in speedy-van-test for each feature
#    - Test schema migrations on the branch first
#    - Merge to main branch when stable
#    - Apply to production only after thorough testing
#
# 2. SCHEMA MIGRATIONS:
#    - Always run `pnpm prisma migrate dev` on TEST first
#    - Review the generated SQL carefully
#    - Create a manual snapshot of PRODUCTION before applying
#    - Run `pnpm prisma migrate deploy` on PRODUCTION
#
# 3. DATA OPERATIONS:
#    - Never run destructive queries on PRODUCTION without backup
#    - Use Neon's Point-in-Time Recovery (6 hours on prod, 1 day on test)
#    - Test data imports/exports on TEST database first
#
# 4. MONITORING:
#    - Set up alerts in Neon console for PRODUCTION
#    - Monitor query performance and slow queries
#    - Watch for connection pool exhaustion
#
# 5. BRANCHING STRATEGY:
#    - main/production: Stable, tested schema
#    - development: Active development branch
#    - feature/*: Individual feature branches
#    - migration/*: Schema migration testing branches
#
# ------------------------
# 🔗 USEFUL LINKS
# ------------------------
#
# Neon Console: https://console.neon.tech
# Neon Documentation: https://neon.tech/docs
# Production Project: https://console.neon.tech/app/projects/sweet-butterfly-55777414
# Test Project: https://console.neon.tech/app/projects/dark-glitter-31729453
#
# ------------------------
# 🆘 EMERGENCY PROCEDURES
# ------------------------
#
# If PRODUCTION database is corrupted or needs restore:
#
# 1. POINT-IN-TIME RECOVERY (Last 6 hours):
#    - Go to Backup & Restore in Neon console
#    - Select timestamp before the issue
#    - Restore to a new branch
#    - Verify data integrity
#    - Switch production connection to new branch
#
# 2. FULL RESTORE FROM BACKUP:
#    - Check if manual snapshots exist
#    - Create new branch from snapshot
#    - Verify data integrity
#    - Update DATABASE_URL_PRODUCTION
#
# 3. CONTACT SUPPORT:
#    - Neon Support: support@neon.tech
#    - Include Project ID: sweet-butterfly-55777414
#
# ------------------------
# 📊 RESOURCE LIMITS
# ------------------------
#
# Production (1-2 CU):
#   - CPU: 1-2 vCPU
#   - RAM: 4-8 GB
#   - Connections: ~100 (pooler)
#
# Test (1-8 CU):
#   - CPU: 1-8 vCPU
#   - RAM: 4-32 GB
#   - Connections: ~100 (pooler)
#
# Auto-scaling to zero: Inactive branches scale to 0 after 5 minutes
# Cold start time: ~500ms - 1s
#
# ------------------------
# 🔐 SECURITY NOTES
# ------------------------
#
# - All connections require SSL (sslmode=require)
# - Channel binding enabled for additional security
# - Credentials should be rotated every 90 days
# - Use connection pooler (-pooler) endpoints for web apps
# - Direct endpoints available for admin/migration tasks
#
# ------------------------

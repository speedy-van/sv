# Deployment Projects

## Active Vercel Projects

Platform team: `team_Q9vSLhjMkcmD3pFurpvBUc4R`

### Web / Admin — `speedy-van-web`

| Field | Value |
|---|---|
| Project ID | `prj_OkJrabaUpBmsMqNibYZc5cgnIqFg` |
| Vercel project | `speedy-van-web` |
| Git root directory | `apps/web` |
| Production URL | https://www.speedyvan.uk |
| CLI link file | `.vercel/project.json` (repository root) |

Deploy command (from repository root, after pre-flight check):

```bash
node scripts/verify-deployment-target.cjs web
vercel --prod --cwd apps/web
```

Or via npm:

```bash
pnpm deploy:check:web
# then, if verified, run vercel --prod --cwd apps/web
```

### API — `speedy-van-api`

| Field | Value |
|---|---|
| Project ID | `prj_QjawXiV1uA0WAOB0eb7x379ydY3f` |
| Vercel project | `speedy-van-api` |
| Git root directory | `apps/api` |
| Production URL | https://api.speedyvan.uk |
| CLI link file | `apps/api/.vercel/project.json` |

Deploy command:

```bash
node scripts/verify-deployment-target.cjs api
vercel --prod --cwd apps/api
```

Or via npm:

```bash
pnpm deploy:check:api
# then, if verified, run vercel --prod --cwd apps/api
```

## Retired Vercel Projects

The following projects were **permanently deleted on 2026-09-24** and must not be used as deployment targets. Their `.vercel.app` hostnames return HTTP 404 / `DEPLOYMENT_NOT_FOUND`.

| Retired name | Retired project ID | Deletion date |
|---|---|---|
| `speedy-van-co-uk-web` | `prj_03tJLYNkaGYRtFhEnl2rb0Rj7W4Q` | 2026-09-24 |
| `speedy-van-co-uk-web-v2` | `prj_TlgXZMFCOlvfryaZg7e2ASjTIipi` | 2026-09-24 |

`scripts/verify-deployment-target.cjs` rejects these IDs automatically.

## Deployment Pre-flight Check

Before any production deployment, run:

```bash
# Validate web target
node scripts/verify-deployment-target.cjs web

# Validate API target
node scripts/verify-deployment-target.cjs api
```

In CI, set `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` explicitly; the check validates them against the allowed targets without requiring a local `.vercel/project.json`.

### What the check validates

- Target is `web` or `api` (unknown targets rejected)
- Team ID matches `team_Q9vSLhjMkcmD3pFurpvBUc4R`
- Project ID matches the expected active project
- Neither retired ID appears in env vars or local link files
- No conflicting override between env vars and local link file

Manually bypassing repository scripts (e.g., calling `vercel --prod` directly without the check) is outside this safeguard.

## CI Mode

In CI pipelines set both env vars explicitly:

```yaml
env:
  VERCEL_ORG_ID: team_Q9vSLhjMkcmD3pFurpvBUc4R
  VERCEL_PROJECT_ID: prj_OkJrabaUpBmsMqNibYZc5cgnIqFg  # web
  # or for API:
  # VERCEL_PROJECT_ID: prj_QjawXiV1uA0WAOB0eb7x379ydY3f
```

The check accepts CI mode when both vars are set and rejects local link file conflicts.

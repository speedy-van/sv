# Production Domain Map

## Live Domains

| Domain | Vercel project | Notes |
|---|---|---|
| `www.speedyvan.uk` | `speedy-van-web` (`prj_OkJrabaUpBmsMqNibYZc5cgnIqFg`) | Primary canonical — indexable |
| `speedyvan.uk` | `speedy-van-web` | Apex → `www.speedyvan.uk` 301 |
| `api.speedyvan.uk` | `speedy-van-api` (`prj_QjawXiV1uA0WAOB0eb7x379ydY3f`) | REST API — not indexed |
| `speedy-van.co.uk` | `speedy-van-web` | Retained alias → `www.speedyvan.uk` |
| `www.speedy-van.co.uk` | `speedy-van-web` | Retained alias → `www.speedyvan.uk` |

The `.co.uk` aliases are retained domain redirects; do not remove them.

## Retired / Deleted Hosts

The following hostnames are permanently dead (HTTP 404 / `DEPLOYMENT_NOT_FOUND`) as of 2026-09-24:

| Host | Former Vercel project | Retired project ID | Deleted |
|---|---|---|---|
| `speedy-van-co-uk-web.vercel.app` | `speedy-van-co-uk-web` | `prj_03tJLYNkaGYRtFhEnl2rb0Rj7W4Q` | 2026-09-24 |
| `speedy-van-co-uk-web-v2.vercel.app` | `speedy-van-co-uk-web-v2` | `prj_TlgXZMFCOlvfryaZg7e2ASjTIipi` | 2026-09-24 |

No configuration, script, or environment variable should reference these hostnames as live targets.

## Indexability

- `www.speedyvan.uk` — indexable; primary canonical declared in app metadata and sitemap
- `api.speedyvan.uk` — not indexed (API endpoints only)
- `speedy-van.co.uk`, `www.speedy-van.co.uk` — redirect to canonical; treated as indexable after redirect
- All `.vercel.app` preview and staging URLs — `noindex` enforced by `apps/web/src/middleware.ts`
- Private pages (admin, driver, etc.) — `noindex` enforced by `apps/web/src/middleware.ts`

Sitemap origin: `https://www.speedyvan.uk`

## CORS Configuration

`apps/web` serves its API routes (`/api/*`) with CORS headers. The allowed cross-origin caller is controlled by the `WEB_V2_ORIGIN` environment variable. Set this in the Vercel project dashboard for `speedy-van-web`.

Default fallback (when `WEB_V2_ORIGIN` is unset): `https://www.speedyvan.uk`

The retired origin `https://speedy-van-co-uk-web-v2.vercel.app` was removed from the fallback on 2026-09-24.

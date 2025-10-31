# ESLint Remediation Plan (apps/web)

This ticket tracks incremental ESLint fixes for `apps/web` without blocking builds.

## Scope
- Run ESLint only on `apps/web/src` initially to avoid legacy root files.
- Use increased Node memory when needed.

## Commands
- Scoped lint: `pnpm --filter @speedy-van/app exec eslint src`
- Local scripts:
  - `pnpm run lint:web`
  - `pnpm run lint:web:fix`

## Config
- Add project-level `.eslintrc.json` with:
  - Disable `@next/next/no-html-link-for-pages` due to app router usage.

## Phases
1) Phase 1 (Low-risk): `src/utils/`, `src/types/`, `src/middleware/`
   - Fix: no-undef, no-duplicate-imports, simple unused imports/vars

2) Phase 2 (Core services): `src/lib/services/`
   - Fix: prefer-const, no-unused-vars, replace `require` with ESM imports

3) Phase 3 (Testing/scripts): `src/lib/testing/`, `scripts/`
   - Fix NodeJS types, `no-var-requires`

## CI
- Add non-blocking lint job on PRs (warning-level).
- Tighten to `--max-warnings=0` after Phase 3 completes.

## Notes
- Avoid refactors that change runtime logic in the early phases.
- Document any rule suppressions with justification.

## Completion Summary
- Phase 1 → `types/utils` done ✅
- Phase 2 → services stabilized (0 errors) ✅
- Phase 3 → testing/tax cleaned (0 errors) ✅
- CI guard enabled (`lint:ci`) and non-blocking workflow added ✅

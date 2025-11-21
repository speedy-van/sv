# ESLint Remediation Plan (apps/web)

This ticket tracks incremental ESLint fixes for `apps/web` without blocking builds.

## Scope
- Run ESLint only on `apps/web/src` initially to avoid legacy root files.
- Use increased Node memory when needed.

## Commands
- Scoped lint: `pnpm --filter @speedy-van/app exec eslint src`
- Local scripts:
  - `pnpm run lint:web`
    - استخدم `pnpm run lint:web:strict` عند الرغبة في فحص يدوي بدون تحذيرات.
  - `pnpm run lint:web:fix`
  - `pnpm run lint:baseline` (يُستخدم في CI للتأكد من عدم ظهور تحذيرات جديدة مقارنةً بملف baseline)

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
- Add non-blocking lint job على PRs لكنها تُشغِّل الآن `pnpm run lint:baseline`.
- ملف `eslint-baseline.json` يُجمّد التحذيرات الحالية؛ أي تحذير جديد أو خطأ يوقف المهمة.
- توليد baseline جديد يتم فقط بعد تنظيف مجموعة من الملفات ضمن الخطة الأسبوعية.

## Notes
- Avoid refactors that change runtime logic in the early phases.
- Document any rule suppressions with justification.

## Completion Summary
- Phase 1 → `types/utils` done ✅
- Phase 2 → services stabilized (0 errors) ✅
- Phase 3 → testing/tax cleaned (0 errors) ✅
- CI guard enabled (`lint:ci`) and non-blocking workflow added ✅

## Weekly cleanup cadence
1. اختر مجلداً محدداً (مثل `src/lib/services`) ونظّف 3‑5 ملفات بحد أقصى في الأسبوع.
2. بعد دمج الإصلاحات أعد تشغيل `pnpm run lint:web:strict` محلياً للتأكد من عدم ظهور تحذيرات جديدة.
3. حرّر baseline:
   - `pnpm --filter ./apps/web exec eslint . --format=json --output-file apps/web/eslint-baseline.json`
   - راجع diff وتأكد أن التحذيرات المتبقية فقط هي التي لم تُعالَج بعد.
4. كرّر العملية أسبوعياً حتى يختفي baseline بالكامل ويتم إزالة الحارس.

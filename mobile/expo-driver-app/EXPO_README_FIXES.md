Reinstall dependencies and restart Expo (fixes for React DevTools + @types/react mismatch)

1) From the monorepo root, remove node_modules and lockfile for a clean install (optional but recommended):

   pnpm -w install --frozen-lockfile=false

2) To explicitly refresh the mobile app dependencies only:

   pnpm --filter "./mobile/expo-driver-app" install

3) Start Expo with cache cleared (important):

   pnpm --filter "./mobile/expo-driver-app" exec expo start --lan -c

Notes:
- I removed workspace pnpm overrides for `@types/react` so the mobile app can use its `@types/react@19.1.17` declared in `mobile/expo-driver-app/package.json`.
- A polyfill was added to `index.js` to suppress DevTools "property is not writable" errors that cause crashes with React Native 0.81.4 + React 19.
- If you still see type warnings, run a full workspace reinstall:

   pnpm -w install --force

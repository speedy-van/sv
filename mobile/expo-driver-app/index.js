// Polyfill to fix React Native 0.81.4 + React 19 DevTools compatibility issue
// This prevents "property is not writable" errors during DevTools initialization
if (typeof global !== 'undefined') {
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj, prop, descriptor) {
    try {
      return originalDefineProperty(obj, prop, descriptor);
    } catch (error) {
      // Known React DevTools issue with some React Native / React combinations
      // Error messages vary between platforms/Node versions. Match common phrases.
      const msg = error && error.message ? error.message : '';
      const nonWritablePhrases = ['not writable', 'Cannot redefine property', 'read-only'];
      const matchesNonWritable = nonWritablePhrases.some(p => msg.includes(p));
      if (matchesNonWritable) {
        // Avoid noisy logs in production; only warn in dev.
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn(`[Polyfill] Skipping non-writable property: ${String(prop)} (${msg})`);
        }
        return obj;
      }
      throw error;
    }
  };
}

import { AppRegistry } from 'react-native';
import App from './App';

// Ensure Metro/Expo can resolve the app entry regardless of pnpm package layout
// and explicitly register the root component to avoid 'main' not registered errors.
// Expo expects the component to be registered as 'main'
AppRegistry.registerComponent('main', () => App);

// Also export App as default for usages that import the module directly
export default App;

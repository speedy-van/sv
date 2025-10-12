import { useMemo } from 'react';

// Attributes that commonly cause hydration mismatches
const PROBLEMATIC_ATTRIBUTES = [
  'fdprocessedid',
  'data-fdprocessedid',
  'data-form-id',
  'data-form-type',
  'data-form-version',
  'data-form-valid',
  'data-form-submitted',
  'data-form-errors',
  'data-form-warnings',
  'data-form-success',
  'data-form-loading',
  'data-form-disabled',
  'data-form-readonly',
  'data-form-required',
  'data-form-pattern',
  'data-form-minlength',
  'data-form-maxlength',
  'data-form-min',
  'data-form-max',
  'data-form-step',
  'data-form-multiple',
  'data-form-accept',
  'data-form-capture',
  'data-form-autocomplete',
  'data-form-autocorrect',
  'data-form-autocapitalize',
  'data-form-spellcheck',
  'data-form-inputmode',
  'data-form-enterkeyhint',
];

/**
 * Hook that filters out problematic attributes that can cause hydration warnings
 * @param props - The props object to filter
 * @returns A new props object with problematic attributes removed
 */
export function useSafeProps<T extends Record<string, any>>(props: T): T {
  return useMemo(() => {
    const safeProps = { ...props };

    // Filter out problematic attributes
    PROBLEMATIC_ATTRIBUTES.forEach(attr => {
      if (attr in safeProps) {
        delete (safeProps as any)[attr];
      }
    });

    // Also filter out any props that start with 'data-form-' or 'fdprocessedid'
    Object.keys(safeProps).forEach(key => {
      if (key.startsWith('data-form-') || key.includes('fdprocessedid')) {
        delete (safeProps as any)[key];
      }
    });

    return safeProps;
  }, [props]);
}

export default useSafeProps;

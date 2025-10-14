/**
 * FormData type augmentation for Node.js environment
 * Fixes TS2339: Property 'get' does not exist on type 'FormData'
 */

// Define FormDataEntryValue if not available
type FormDataEntryValue = string | File;

// Extend global FormData interface to include standard methods
declare global {
  interface FormData {
    get(name: string): FormDataEntryValue | null;
    getAll(name: string): FormDataEntryValue[];
    has(name: string): boolean;
    set(name: string, value: string | Blob, fileName?: string): void;
    delete(name: string): void;
    append(name: string, value: string | Blob, fileName?: string): void;
    entries(): IterableIterator<[string, FormDataEntryValue]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<FormDataEntryValue>;
    forEach(
      callbackfn: (value: FormDataEntryValue, key: string, parent: FormData) => void,
      thisArg?: any
    ): void;
  }
}

export {};

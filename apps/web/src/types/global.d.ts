// Global type declarations to resolve Node.js type conflicts
declare global {
  // Override problematic Buffer types
  interface Buffer extends Uint8Array {
    readonly buffer: ArrayBuffer;
    readonly byteLength: number;
    readonly byteOffset: number;
    readonly length: number;
    slice(start?: number, end?: number): Buffer;
    toString(encoding?: string, start?: number, end?: number): string;
    toJSON(): { type: 'Buffer'; data: number[] };
    equals(otherBuffer: Uint8Array): boolean;
    compare(
      otherBuffer: Uint8Array,
      targetStart?: number,
      targetEnd?: number,
      sourceStart?: number,
      sourceEnd?: number
    ): number;
    copy(
      targetBuffer: Uint8Array,
      targetStart?: number,
      sourceStart?: number,
      sourceEnd?: number
    ): number;
    fill(value: any, offset?: number, end?: number): this;
    indexOf(
      value: string | number | Uint8Array,
      byteOffset?: number,
      encoding?: string
    ): number;
    lastIndexOf(
      value: string | number | Uint8Array,
      byteOffset?: number,
      encoding?: string
    ): number;
    includes(
      value: string | number | Uint8Array,
      byteOffset?: number,
      encoding?: string
    ): boolean;
  }

  // Override ArrayBufferView constraint
  type ArrayBufferView =
    | Uint8Array
    | Uint8ClampedArray
    | Int8Array
    | Uint16Array
    | Int16Array
    | Uint32Array
    | Int32Array
    | Float32Array
    | Float64Array
    | DataView;
}

export {};

type Serialized<T> = T extends bigint
  ? number
  : T extends Date
    ? Date
    : T extends Array<infer U>
      ? Serialized<U>[]
      : T extends object
        ? { [K in keyof T]: Serialized<T[K]> }
        : T;

export function serializedReturn<T>(obj: T): Serialized<T> {
  if (typeof obj === 'bigint') {
    return convertBigIntToNumber(obj) as Serialized<T>;
  }
  if (Array.isArray(obj)) {
    return obj.map(serializedReturn) as Serialized<T>;
  }
  if (obj instanceof Date) {
    return obj as Serialized<T>;
  }
  if (obj !== null && typeof obj === 'object') {
    const result: { [K in keyof T]: Serialized<T[K]> } = {} as any; // 초기화
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        result[key] = serializedReturn(value);
      }
    }
    return result as Serialized<T>;
  }
  return obj as Serialized<T>;
}

export function convertBigIntToNumber(value: unknown): number | string {
  if (typeof value === 'bigint') {
    const abs = value < 0n ? -value : value;
    if (abs > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error(
        `BigInt value ${value} exceeds Number.MAX_SAFE_INTEGER and cannot be safely converted to number`,
      );
    }
    return Number(value);
  }
  throw new Error(`Expected bigint, got ${typeof value}`);
}

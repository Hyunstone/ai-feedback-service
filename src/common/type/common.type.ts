export interface BaseResponse<T = any> {
  result: 'success' | 'failed';
  message: string;
  data?: T;
}

export type Serialized<T> = T extends bigint
  ? number
  : T extends Date
    ? Date
    : T extends Array<infer U>
      ? Serialized<U>[]
      : T extends object
        ? { [K in keyof T]: Serialized<T[K]> }
        : T;

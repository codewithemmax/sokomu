declare module "bun:test" {
  export function describe(name: string, fn: () => void | Promise<void>): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export interface Matchers<T> {
    not: Matchers<T>;
    toBe(expected: T): void;
    toEqual(expected: unknown): void;
    toContain(expected: string): void;
    toThrow(expected?: string | RegExp): void;
    toBeDefined(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeGreaterThan(expected: number): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toBeLessThanOrEqual(expected: number): void;
  }
  export function expect<T>(actual: T): Matchers<T>;
}

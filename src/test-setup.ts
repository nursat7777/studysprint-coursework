import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Node versions with native Web Storage can shadow jsdom's globals. Use one
// deterministic Storage API for both global and window access in tests only.
// Keeping methods on the prototype also preserves quota-failure spy coverage.
class TestStorage implements Storage {
  private readonly entries = new Map<string, string>();

  get length(): number {
    return this.entries.size;
  }

  key(index: number): string | null {
    const position = Number(index) >>> 0;
    return Array.from(this.entries.keys())[position] ?? null;
  }

  getItem(key: string): string | null {
    return this.entries.get(String(key)) ?? null;
  }

  setItem(key: string, value: string): void {
    this.entries.set(String(key), String(value));
  }

  removeItem(key: string): void {
    this.entries.delete(String(key));
  }

  clear(): void {
    this.entries.clear();
  }
}

const testStorage = new TestStorage();
for (const target of [globalThis, window]) {
  Object.defineProperty(target, "Storage", {
    configurable: true,
    writable: true,
    value: TestStorage,
  });
  Object.defineProperty(target, "localStorage", {
    configurable: true,
    writable: true,
    value: testStorage,
  });
}

afterEach(cleanup);

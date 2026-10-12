import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("portable browser storage test environment", () => {
  it("shares storage between window and globals with the browser Storage API", () => {
    expect(globalThis.localStorage).toBe(window.localStorage);
    expect(globalThis.Storage).toBe(window.Storage);
    expect(localStorage).toBeInstanceOf(Storage);
    localStorage.setItem("one", "1");
    window.localStorage.setItem("two", "2");
    expect(localStorage.length).toBe(2);
    expect(localStorage.key(0)).toBe("one");
    expect(localStorage.key(2)).toBeNull();
    expect(localStorage.getItem("missing")).toBeNull();
    localStorage.removeItem("one");
    expect(localStorage.length).toBe(1);
    localStorage.clear();
    expect(localStorage.length).toBe(0);
  });

  it("allows existing quota-failure tests to intercept the actual storage instance", () => {
    localStorage.setItem("saved", "keep");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    expect(() => window.localStorage.setItem("new", "value")).toThrow(
      "Quota exceeded",
    );
    expect(localStorage.getItem("saved")).toBe("keep");
    expect(localStorage.getItem("new")).toBeNull();
  });
});

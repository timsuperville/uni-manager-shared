import { describe, it, expect } from "vitest";

describe("Basic Shared Workspace Test", () => {
  it("should run basic tests successfully", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle string operations", () => {
    expect("hello".toUpperCase()).toBe("HELLO");
  });

  it("should work with arrays", () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr.includes(2)).toBe(true);
  });
});

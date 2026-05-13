import { describe, expect, it } from "vitest";

function normalize(
  value: number,
  min: number,
  max: number
): number {
  return (value - min) / (max - min);
}

describe("Normalization", () => {
  it("should normalize values between 0 and 1", () => {
    const result = normalize(5, 0, 10);

    expect(result).toBe(0.5);
  });

  it("should preserve lower bound", () => {
    const result = normalize(0, 0, 10);

    expect(result).toBe(0);
  });

  it("should preserve upper bound", () => {
    const result = normalize(10, 0, 10);

    expect(result).toBe(1);
  });
});
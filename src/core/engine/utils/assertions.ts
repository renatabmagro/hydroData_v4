export function assertNormalized(value: number): void {
  if (value < 0 || value > 1) {
    throw new Error(
      `Normalized value out of bounds: ${value}`
    );
  }
}

export function assertPositive(value: number): void {
  if (value < 0) {
    throw new Error(
      `Expected positive value but received ${value}`
    );
  }
}
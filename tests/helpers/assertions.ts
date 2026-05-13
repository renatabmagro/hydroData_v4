export function expectApproximatelyEqual(
  valueA: number,
  valueB: number,
  tolerance = 0.01
): void {
  const diff = Math.abs(valueA - valueB);

  if (diff > tolerance) {
    throw new Error(
      `Values are not approximately equal: ${valueA} vs ${valueB}`
    );
  }
}

export function expectBetween(
  value: number,
  min: number,
  max: number
): void {
  if (value < min || value > max) {
    throw new Error(
      `Expected ${value} to be between ${min} and ${max}`
    );
  }
}
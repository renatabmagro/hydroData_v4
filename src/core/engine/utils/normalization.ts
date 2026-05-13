export function normalizeValue(
  value: number,
  min = 0,
  max = 1
): number {

  if (Number.isNaN(value))
    return 0;

  if (value < min)
    return min;

  if (value > max)
    return max;

  return value;
}
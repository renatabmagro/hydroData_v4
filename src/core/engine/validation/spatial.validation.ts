export function spatialScore(
  inside: number,
  total: number
): number {

  if (total === 0) return 0;

  return inside / total;
}

export function topologyScore(
  connected: number,
  total: number
): number {

  if (total === 0) return 0;

  return connected / total;
}

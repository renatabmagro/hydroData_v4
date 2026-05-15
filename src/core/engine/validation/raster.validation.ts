export function rasterScore(
  validPixels: number,
  totalPixels: number
): number {

  if (totalPixels === 0) return 0;

  return validPixels / totalPixels;
}

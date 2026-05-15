export function geometryScore(
  originalArea: number,
  extractedArea: number
): number {

  return 1 - (
    Math.abs(originalArea - extractedArea)
    / originalArea
  );
}

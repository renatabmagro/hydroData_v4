export function attributeScore(
  originalMean: number,
  extractedMean: number
): number {

  return 1 - (
    Math.abs(originalMean - extractedMean)
    / originalMean
  );
}

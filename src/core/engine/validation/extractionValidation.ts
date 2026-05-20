import * as turf from "@turf/turf";
import {
  ValidationInput,
  ValidationScores
} from "./validation.types";

export async function validateExtraction(
  input: ValidationInput
): Promise<ValidationScores> {

  const originalArea =
    input.originalBasin
      ? turf.area(input.originalBasin)
      : 0;

  const extractedArea =
    input.extractedBasin
      ? turf.area(input.extractedBasin)
      : 0;

  const areaError =
    originalArea > 0
      ? Math.abs(originalArea - extractedArea) / originalArea
      : 1;

  const scoreArea =
    Math.max(0, 1 - areaError);

  const totalDrainage =
    input.originalDrainage?.features?.length ?? 0;

  const extractedDrainage =
    input.extractedDrainage?.features?.length ?? 0;

  const scoreDrainage =
    totalDrainage > 0
      ? extractedDrainage / totalDrainage
      : null;

  const fisValues =
    [scoreArea, scoreDrainage]
      .filter((v) => v !== null) as number[];

  const FIS =
    fisValues.length > 0
      ? fisValues.reduce((a, b) => a + b, 0) / fisValues.length
      : null;

  const totalStations =
    input.originalStations?.length ?? 0;

  const extractedStations =
    input.extractedStations?.length ?? 0;

  const PLU =
    totalStations > 0
      ? extractedStations / totalStations
      : null;

  const totalPixels =
    input.floodRaster?.totalPixels ?? 0;

  const validPixels =
    input.floodRaster?.validPixels ?? 0;

  const INU =
    totalPixels > 0
      ? validPixels / totalPixels
      : null;

  const MUN =
    Math.max(0, 1 - urbanError);

  const validScores =
    [FIS, INU, PLU, MUN]
      .filter((v) => v !== null) as number[];

  const IQA =
    validScores.length > 0
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length
      : 0;

  return {
    FIS,
    INU,
    PLU,
    MUN,
    IQA
  };
}
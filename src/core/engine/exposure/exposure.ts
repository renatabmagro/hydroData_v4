import {
  ExposureInput,
  ExposureComputationResult
} from "./exposure.types";

import { normalizeValue } from "../utils/normalization";
import { assertNormalized } from "../utils/assertions";

export function computeExposure(
  input: ExposureInput
): ExposureComputationResult {

  const normalizedExposure = normalizeValue(
    input.distanceToStation,
    0,
    100
  );

  assertNormalized(normalizedExposure);

  return {
    normalizedExposure
  };
}
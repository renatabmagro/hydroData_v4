import {
  SensitivityInput,
  SensitivityComputationResult
} from "./sensitivity.types";

import { normalizeValue } from "../utils/normalization";
import { assertNormalized } from "../utils/assertions";

export function computeSensitivity(
  input: SensitivityInput
): SensitivityComputationResult {

  const normalizedSensitivity = normalizeValue(
    input.populationDensity,
    0,
    1000
  );

  assertNormalized(normalizedSensitivity);

  return {
    normalizedSensitivity
  };
}
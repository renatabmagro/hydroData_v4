import {
  EligibilityResult
} from "../types/ivpc.types";

import { computeHazardMask } from "./hazard";
import { computeBlindSpotMask } from "./blindSpot";

export function computeEligibility(): EligibilityResult {
  const hazardMask = computeHazardMask();

  const blindSpotMask = computeBlindSpotMask();

  return {
    hazardMask,
    blindSpotMask,
    eligibleMask: {
      id: "eligible-mask",
      name: "IVPC Eligible Mask"
    }
  };
}
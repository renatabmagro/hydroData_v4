import {
  SensitivityResult
} from "../types/ivpc.types";

export function buildSensitivityLayer(): SensitivityResult {
  return {
    sensitivityLayer: {
      id: "sensitivity-layer",
      name: "Normalized Sensitivity Layer"
    },
    normalized: true
  };
}
import {
  ExposureResult
} from "../types/ivpc.types";

export function buildExposureLayer(): ExposureResult {
  return {
    exposureLayer: {
      id: "exposure-layer",
      name: "Normalized Exposure Layer"
    },
    normalized: true
  };
}
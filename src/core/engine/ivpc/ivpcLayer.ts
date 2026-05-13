import {
  IVPCScoreResult
} from "../types/ivpc.types";

export function buildIVPCLayer(): IVPCScoreResult {
  return {
    ivpcScoreLayer: {
      id: "ivpc-score-layer",
      name: "IVPC Relative Vulnerability Layer"
    }
  };
}
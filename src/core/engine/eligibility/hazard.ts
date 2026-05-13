import { SpatialLayer } from "../types/ivpc.types";

export function computeHazardMask(): SpatialLayer {
  return {
    id: "hazard-mask",
    name: "Physical Hazard Mask"
  };
}
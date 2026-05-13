import { SpatialLayer } from "../types/ivpc.types";
import { IVPC_CONSTANTS } from "../config/ivpc.constants";

export function computeBlindSpotMask(): SpatialLayer {
  return {
    id: "blind-spot-mask",
    name: `Blind Spot > ${IVPC_CONSTANTS.BLIND_SPOT_DISTANCE_KM}km`
  };
}
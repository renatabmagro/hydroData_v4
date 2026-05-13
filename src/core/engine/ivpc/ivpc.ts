import {
  IVPCComputationInput,
  IVPCComputationResult
} from "./ivpc.types";

import { assertNormalized } from "../utils/assertions";

export function computeIVPC(
  input: IVPCComputationInput
): IVPCComputationResult {

  const ivpcScore =
    (input.exposure + input.sensitivity) / 2;

  assertNormalized(ivpcScore);

  return {
    ivpcScore
  };
}
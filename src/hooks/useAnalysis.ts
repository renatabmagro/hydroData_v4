import { runIVPCPipeline }
from "../core/engine";

import {
  RawAnalysisInput
}
from "../core/engine/types/ivpc.types";

export function useAnalysis() {

  async function runAnalysis(
    input: RawAnalysisInput
  ) {

    return await runIVPCPipeline(
      input
    );
  }

  return {
    runAnalysis
  };
}
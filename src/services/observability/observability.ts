import { log } from "../logger/logger";
import { trackEvent } from "../telemetry/telemetry";

export function observePipelineExecution(
  pipelineName: string
): void {

  log("info", `Pipeline executed: ${pipelineName}`);

  trackEvent("pipeline_execution", {
    pipelineName
  });
}

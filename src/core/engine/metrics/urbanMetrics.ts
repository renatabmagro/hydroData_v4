import {
  MetricsResult
} from "../types/ivpc.types";

import { validateUrbanMetrics } from "./urbanMetrics.validators";

export function computeUrbanMetrics(): MetricsResult {

  const metrics: MetricsResult = {
    urbanTotalArea: 100,
    urbanBlindSpotArea: 45,
    urbanMonitoredArea: 55,
    urbanEligibleArea: 40,
    urbanIvpcArea: 25
  };

  validateUrbanMetrics(metrics);

  return metrics;
}
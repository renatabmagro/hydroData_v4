import { UrbanMetricsInput } from "./urbanMetrics.types";

export function validateUrbanMetrics(
  metrics: UrbanMetricsInput
): void {

  const total =
    metrics.urbanBlindSpotArea +
    metrics.urbanMonitoredArea;

  const difference = Math.abs(
    total - metrics.urbanTotalArea
  );

  if (difference > 0.01) {
    throw new Error(
      "Urban metrics consistency validation failed."
    );
  }
}
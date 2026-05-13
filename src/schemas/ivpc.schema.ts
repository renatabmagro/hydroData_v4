import { z } from "zod";

export const IVPCMetricsSchema = z.object({
  urbanTotalArea: z.number().nonnegative(),
  urbanBlindSpotArea: z.number().nonnegative(),
  urbanMonitoredArea: z.number().nonnegative(),
  urbanEligibleArea: z.number().nonnegative(),
  urbanIvpcArea: z.number().nonnegative()
});

export const IVPCScoreSchema = z.object({
  ivpcScore: z.number().min(0).max(1)
});

export type IVPCMetrics = z.infer<typeof IVPCMetricsSchema>;

export type IVPCScore = z.infer<typeof IVPCScoreSchema>;

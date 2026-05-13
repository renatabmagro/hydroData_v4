import { z } from "zod";

export const ReportSchema = z.object({
  title: z.string(),
  summary: z.string(),
  methodology: z.string(),
  limitations: z.string()
});

export type ReportSchemaType = z.infer<typeof ReportSchema>;
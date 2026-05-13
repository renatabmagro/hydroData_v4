export type LogLevel =
  | "info"
  | "warn"
  | "error";

export interface StructuredLog {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export function log(
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>
): StructuredLog {

  const structuredLog: StructuredLog = {
    level,
    message,
    timestamp: new Date().toISOString(),
    metadata
  };

  console.log(JSON.stringify(structuredLog));

  return structuredLog;
}

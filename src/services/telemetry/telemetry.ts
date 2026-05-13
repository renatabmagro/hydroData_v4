export interface TelemetryEvent {
  name: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}

export function trackEvent(
  name: string,
  payload?: Record<string, unknown>
): TelemetryEvent {

  const event: TelemetryEvent = {
    name,
    timestamp: new Date().toISOString(),
    payload
  };

  console.log("Telemetry Event", event);

  return event;
}

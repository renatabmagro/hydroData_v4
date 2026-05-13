import { describe, expect, it } from "vitest";

describe("Urban Metrics Regression", () => {
  it("should never report 100 percent blind spot if monitored area exists", () => {
    const monitoredArea = 25;
    const blindSpotPercentage = 1;

    const isInvalid =
      monitoredArea > 0 && blindSpotPercentage === 1;

    expect(isInvalid).toBe(false);
  });
});
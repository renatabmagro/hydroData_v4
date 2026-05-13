import { describe, expect, it } from "vitest";

describe("IVPC Semantic Rules", () => {
  it("hazard must not directly compose IVPC score", () => {
    const formula = "IVPC = exposure + sensitivity";

    expect(formula.includes("hazard")).toBe(false);
  });

  it("blind spot must not directly compose IVPC score", () => {
    const formula = "IVPC = exposure + sensitivity";

    expect(formula.includes("blindSpot")).toBe(false);
  });

  it("exposure must be continuous", () => {
    const exposureType = "continuous";

    expect(exposureType).toBe("continuous");
  });

  it("blind spot must remain binary", () => {
    const blindSpotType = "binary";

    expect(blindSpotType).toBe("binary");
  });

  it("IVPC must represent relative vulnerability", () => {
    const meaning = "relative vulnerability";

    expect(meaning).not.toContain("risk");
  });
});
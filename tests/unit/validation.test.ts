import { describe, it, expect } from "vitest";
import { polygon } from "@turf/turf";

import { geometryScore } from "../../src/core/engine/validation/geometry.validation";
import { spatialScore } from "../../src/core/engine/validation/spatial.validation";
import { topologyScore } from "../../src/core/engine/validation/topology.validation";
import { rasterScore } from "../../src/core/engine/validation/raster.validation";
import { attributeScore } from "../../src/core/engine/validation/attributes.validation";
import { validateExtraction } from "../../src/core/engine/validation/extractionValidation";
import { runValidationPipeline } from "../../src/core/engine/pipeline/validation.pipeline";

describe("Validation score utilities", () => {
  it("computes geometry score correctly", () => {
    expect(geometryScore(100, 90)).toBeCloseTo(0.9, 6);
  });

  it("returns zero when total is zero for spatial score", () => {
    expect(spatialScore(5, 0)).toBe(0);
  });

  it("computes spatial score correctly", () => {
    expect(spatialScore(50, 100)).toBe(0.5);
  });

  it("returns zero when total is zero for topology score", () => {
    expect(topologyScore(3, 0)).toBe(0);
  });

  it("computes topology score correctly", () => {
    expect(topologyScore(8, 10)).toBe(0.8);
  });

  it("returns zero when totalPixels is zero for raster score", () => {
    expect(rasterScore(10, 0)).toBe(0);
  });

  it("computes raster score correctly", () => {
    expect(rasterScore(45, 50)).toBe(0.9);
  });

  it("computes attribute score correctly", () => {
    expect(attributeScore(120, 108)).toBeCloseTo(0.9, 6);
  });

  it("validates extraction and computes IQA from extraction metrics", async () => {
    const square = polygon([[
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0]
    ]]);

    const validation = await validateExtraction({
      originalBasin: square,
      extractedBasin: square,
      originalDrainage: {
        type: "FeatureCollection",
        features: [{ type: "Feature", properties: {}, geometry: null }]
      },
      extractedDrainage: {
        type: "FeatureCollection",
        features: [{ type: "Feature", properties: {}, geometry: null }]
      },
      originalStations: [{}, {}],
      extractedStations: [{}, {}],
      floodRaster: {
        totalPixels: 10,
        validPixels: 10
      },
      originalUrban: square,
      extractedUrban: square
    });

    expect(validation).toEqual({
      FIS: 1,
      INU: 1,
      PLU: 1,
      MUN: 1,
      IQA: 1
    });
  });

  it("runs the validation pipeline and returns the same score structure", async () => {
    const validation = await runValidationPipeline({});

    expect(validation).toHaveProperty("FIS");
    expect(validation).toHaveProperty("INU");
    expect(validation).toHaveProperty("PLU");
    expect(validation).toHaveProperty("MUN");
    expect(validation).toHaveProperty("IQA");
  });
});

import { describe, it, expect } from "vitest";
import * as turf from "@turf/turf";

describe("IVPC Buffer Calculation - Turf.js FeatureCollection API", () => {
  it("✓ deve criar ponto e buffer", () => {
    const point = turf.point([-54.5, -25.2]);
    const buffer = turf.buffer(point, 10, { units: "kilometers" });

    expect(buffer).toBeDefined();
    expect(buffer.geometry?.type).toBe("Polygon");
  });

  it("✓ deve fazer union de múltiplos buffers com FeatureCollection", () => {
    const p1 = turf.point([-54.5, -25.2]);
    const p2 = turf.point([-54.6, -25.3]);
    const p3 = turf.point([-54.7, -25.4]);
    
    const buf1 = turf.buffer(p1, 5, { units: "kilometers" });
    const buf2 = turf.buffer(p2, 5, { units: "kilometers" });
    const buf3 = turf.buffer(p3, 5, { units: "kilometers" });

    // CORRETO: turf.union() espera um FeatureCollection
    const fc = turf.featureCollection([buf1, buf2, buf3]);
    const unionedBuffer = turf.union(fc);

    expect(unionedBuffer).toBeDefined();
    expect(unionedBuffer.geometry).toBeDefined();
    expect(["Polygon", "MultiPolygon"]).toContain(unionedBuffer.geometry?.type);
  });

  it("✓ deve calcular intersect com FeatureCollection", () => {
    const basin = {
      type: "Feature" as const,
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [-56.0, -26.5],
            [-53.0, -26.5],
            [-53.0, -24.0],
            [-56.0, -24.0],
            [-56.0, -26.5],
          ],
        ],
      },
      properties: {},
    };

    const p = turf.point([-54.5, -25.2]);
    const buffer = turf.buffer(p, 10, { units: "kilometers" });

    // CORRETO: turf.intersect() espera um FeatureCollection
    const fc = turf.featureCollection([basin, buffer]);
    const monitoredArea = turf.intersect(fc);

    expect(monitoredArea).toBeDefined();
    expect(monitoredArea?.geometry).toBeDefined();
  });

  it("✓ deve calcular difference com FeatureCollection", () => {
    const basin = {
      type: "Feature" as const,
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [-56.0, -26.5],
            [-53.0, -26.5],
            [-53.0, -24.0],
            [-56.0, -24.0],
            [-56.0, -26.5],
          ],
        ],
      },
      properties: {},
    };

    const p = turf.point([-54.5, -25.2]);
    const buffer = turf.buffer(p, 10, { units: "kilometers" });

    // CORRETO: turf.difference() espera um FeatureCollection
    const fc = turf.featureCollection([basin, buffer]);
    const blindSpotArea = turf.difference(fc);

    expect(blindSpotArea).toBeDefined();
    expect(blindSpotArea?.geometry).toBeDefined();
  });

  it("✓ pipeline completo: buffers → intersect → difference", () => {
    // 1. Criar buffers
    const estacoes = [
      { latitude: -25.5, longitude: -54.6 },
      { latitude: -26.0, longitude: -54.0 },
    ];

    const buffers = estacoes.map((est) => {
      const point = turf.point([est.longitude, est.latitude]);
      return turf.buffer(point, 10, { units: "kilometers" });
    });

    // 2. Union
    const fc = turf.featureCollection(buffers);
    const unionedBuffer = turf.union(fc);

    expect(unionedBuffer).toBeDefined();

    // 3. Basin
    const basin = {
      type: "Feature" as const,
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [-56.0, -26.5],
            [-53.0, -26.5],
            [-53.0, -24.0],
            [-56.0, -24.0],
            [-56.0, -26.5],
          ],
        ],
      },
      properties: {},
    };

    // 4. Monitored area (intersect)
    const fc2 = turf.featureCollection([basin, unionedBuffer]);
    const monitoredArea = turf.intersect(fc2);

    expect(monitoredArea).toBeDefined();
    expect(monitoredArea?.geometry).toBeDefined();

    // 5. Blind spot (difference)
    const fc3 = turf.featureCollection([basin, unionedBuffer]);
    const blindSpotArea = turf.difference(fc3);

    expect(blindSpotArea).toBeDefined();
    expect(blindSpotArea?.geometry).toBeDefined();

    // 6. Render as FeatureCollections
    const monitoredGeoJson = {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          geometry: monitoredArea?.geometry,
          properties: { type: "monitored" },
        },
      ],
    };

    const blindSpotGeoJson = {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          geometry: blindSpotArea?.geometry,
          properties: { type: "blind_spot" },
        },
      ],
    };

    expect(monitoredGeoJson.type).toBe("FeatureCollection");
    expect(blindSpotGeoJson.type).toBe("FeatureCollection");
  });
});

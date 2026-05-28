import { describe, it, expect } from "vitest";
import * as turf from "@turf/turf";

/**
 * Teste de renderização de IVPCMap
 * Valida que os polígonos de blind spot e monitored área são calculados
 * com dados similares aos que seriam passados do componente real.
 */
describe("IVPCMap - Blind Spot and Monitored Area Rendering", () => {
  const mockBasinGeojson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-56.5, -27.0],
              [-52.5, -27.0],
              [-52.5, -23.0],
              [-56.5, -23.0],
              [-56.5, -27.0],
            ],
          ],
        },
        properties: { name: "Rio Paraná" },
      },
    ],
  };

  const mockEstacoes = [
    { latitude: -25.5, longitude: -54.6, nome: "Est 1", codigo: "1", tipo: "fluvial" },
    { latitude: -26.0, longitude: -54.0, nome: "Est 2", codigo: "2", tipo: "fluvial" },
  ];

  const mockMetrics = {
    urbanTotalArea: 850,
    urbanBlindSpotArea: 255,
    urbanMonitoredArea: 595,
    urbanEligibleArea: 850,
    blindSpotPercentage: 30,
    maxDistanceKm: 52,
  };

  it("✅ deve replicar exatamente o pipeline do IVPCMap", () => {
    // Extrair bacia feature
    const basinFeature = mockBasinGeojson.features[0];
    expect(basinFeature).toBeDefined();
    expect(basinFeature.geometry.type).toBe("Polygon");

    // Criar buffers
    const buffers = mockEstacoes.map((est) => {
      const point = turf.point([est.longitude, est.latitude]);
      return turf.buffer(point, 10, { units: "kilometers" });
    });

    expect(buffers).toHaveLength(2);
    expect(buffers[0].geometry.type).toBe("Polygon");

    // Union dos buffers
    const fc = turf.featureCollection(buffers);
    const unionedBuffer = turf.union(fc);

    expect(unionedBuffer).toBeDefined();
    expect(unionedBuffer.geometry).toBeDefined();
    console.log("✅ Union bem-sucedido:", unionedBuffer.geometry.type);

    // Monitored Area (Intersect)
    const fcIntersect = turf.featureCollection([basinFeature, unionedBuffer]);
    const monitoredArea = turf.intersect(fcIntersect);

    expect(monitoredArea).toBeDefined();
    expect(monitoredArea?.geometry).toBeDefined();
    console.log("✅ Monitored Area:", monitoredArea?.geometry?.type);

    // Blind Spot Area (Difference)
    const fcDifference = turf.featureCollection([basinFeature, unionedBuffer]);
    const blindSpotArea = turf.difference(fcDifference);

    expect(blindSpotArea).toBeDefined();
    expect(blindSpotArea?.geometry).toBeDefined();
    console.log("✅ Blind Spot Area:", blindSpotArea?.geometry?.type);

    // Validate GeoJSON for rendering
    const monitoredGeoJson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: monitoredArea?.geometry,
          properties: { type: "monitored" },
        },
      ],
    };

    const blindSpotGeoJson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: blindSpotArea?.geometry,
          properties: { type: "blind_spot" },
        },
      ],
    };

    // Verify both can be rendered
    expect(monitoredGeoJson.features[0].geometry).toBeDefined();
    expect(blindSpotGeoJson.features[0].geometry).toBeDefined();

    console.log("✅ PIPELINE COMPLETO VALIDADO!");
    console.log("  - Monitored GeoJSON features:", monitoredGeoJson.features.length);
    console.log("  - Blind Spot GeoJSON features:", blindSpotGeoJson.features.length);
  });

  it("✅ deve gerar polígonos válidos para leaflet renderizar", () => {
    const basinFeature = mockBasinGeojson.features[0];

    const buffers = mockEstacoes.map((est) => {
      const point = turf.point([est.longitude, est.latitude]);
      return turf.buffer(point, 10, { units: "kilometers" });
    });

    const unionedBuffer = turf.union(turf.featureCollection(buffers));
    const monitoredArea = turf.intersect(turf.featureCollection([basinFeature, unionedBuffer]));
    const blindSpotArea = turf.difference(turf.featureCollection([basinFeature, unionedBuffer]));

    // Validar tipos de geometria que Leaflet pode renderizar
    const validTypes = ["Polygon", "MultiPolygon", "LineString", "Point", "MultiPoint"];

    expect(validTypes).toContain(monitoredArea?.geometry?.type);
    expect(validTypes).toContain(blindSpotArea?.geometry?.type);

    // Validar que não são null ou undefined
    expect(monitoredArea?.geometry?.coordinates).toBeDefined();
    expect(blindSpotArea?.geometry?.coordinates).toBeDefined();

    console.log("✅ Geometrias válidas para renderização Leaflet");
  });
});

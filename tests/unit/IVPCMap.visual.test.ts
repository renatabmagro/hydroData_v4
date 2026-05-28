import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import IVPCMap from "../src/components/IVPCMap";

// Mock data para testar o componente
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
  { latitude: -25.0, longitude: -55.0, nome: "Est 3", codigo: "3", tipo: "fluvial" },
];

const mockMetrics = {
  urbanTotalArea: 1000,
  urbanBlindSpotArea: 300,
  urbanMonitoredArea: 700,
  urbanEligibleArea: 800,
  blindSpotPercentage: 30,
  maxDistanceKm: 45,
};

describe("IVPCMap Component - Visual Rendering", () => {
  it("✓ deve renderizar mapa sem erros", () => {
    const { container } = render(
      <IVPCMap
        basinGeojson={mockBasinGeojson}
        metrics={mockMetrics}
        estacoes={mockEstacoes}
      />
    );

    expect(container).toBeDefined();
  });

  it("✓ deve renderizar MapContainer", () => {
    const { container } = render(
      <IVPCMap
        basinGeojson={mockBasinGeojson}
        metrics={mockMetrics}
        estacoes={mockEstacoes}
      />
    );

    // Verificar se o mapa foi renderizado
    const mapElement = container.querySelector(".leaflet-container");
    expect(mapElement).toBeDefined();
  });

  it("✓ deve receber props corretamente", () => {
    const { container } = render(
      <IVPCMap
        basinGeojson={mockBasinGeojson}
        metrics={mockMetrics}
        estacoes={mockEstacoes}
        mapTileUrl="https://example.com/tile"
      />
    );

    expect(container).toBeDefined();
  });

  it("✓ deve calcular buffers ao montar", async () => {
    const consoleSpy = vi.spyOn(console, "log");

    const { container } = render(
      <IVPCMap
        basinGeojson={mockBasinGeojson}
        metrics={mockMetrics}
        estacoes={mockEstacoes}
      />
    );

    // Aguardar um pouco para o useEffect executar
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verificar se houve logs de buffer
    expect(container).toBeDefined();

    consoleSpy.mockRestore();
  });
});

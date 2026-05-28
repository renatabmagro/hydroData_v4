import React from "react";
import IVPCMap from "./IVPCMap";

// Mock data completos baseados na Bacia do Paraná
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
  { latitude: -25.5, longitude: -54.6, nome: "Est Paraná 1", codigo: "p001", tipo: "fluvial" },
  { latitude: -26.0, longitude: -54.0, nome: "Est Paraná 2", codigo: "p002", tipo: "fluvial" },
  { latitude: -25.2, longitude: -55.2, nome: "Est Paraná 3", codigo: "p003", tipo: "fluvial" },
];

const mockMetrics = {
  urbanTotalArea: 850,
  urbanBlindSpotArea: 255, // 30% blind spot
  urbanMonitoredArea: 595, // 70% monitored
  urbanEligibleArea: 850,
  blindSpotPercentage: 30,
  maxDistanceKm: 52,
};

export default function IVPCMapDebug() {
  return (
    <div className="w-full h-screen bg-gray-100">
      <div className="p-4 bg-yellow-100 border-b-2 border-yellow-500">
        <h2 className="text-lg font-bold">🧪 TESTE IVPCMap com MOCK DATA</h2>
        <p className="text-sm">Este é um teste isolado com dados mock para validar renderização</p>
      </div>
      <div className="h-[calc(100vh-80px)]">
        <IVPCMap
          basinGeojson={mockBasinGeojson}
          metrics={mockMetrics}
          estacoes={mockEstacoes}
          mapTileUrl={null}
        />
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { Eye, EyeOff } from "lucide-react";

interface IVPCMapProps {
  basinGeojson: any;
  metrics: {
    urbanTotalArea: number;
    urbanBlindSpotArea: number;
    urbanMonitoredArea: number;
    urbanEligibleArea: number;
    blindSpotPercentage: number;
    maxDistanceKm: number;
  };
  estacoes?: Array<{
    latitude: number;
    longitude: number;
    nome: string;
    codigo: string;
    tipo: string;
  }>;
  mapTileUrl?: string | null;
}

interface LayerVisibility {
  basinBoundary: boolean;
  blindSpot: boolean;
  monitored: boolean;
  buffers: boolean;
  estacoes: boolean;
  tileLayer: boolean;
}

function MapUpdater({ geoJson }: { geoJson: any }) {
  const map = useMap();
  useEffect(() => {
    if (geoJson) {
      try {
        import("@turf/turf").then((turf) => {
          const bbox = turf.bbox(geoJson);
          map.fitBounds([
            [bbox[1], bbox[0]],
            [bbox[3], bbox[2]],
          ]);
        });
      } catch (err) {
        console.error("Erro ao fazer zoom:", err);
      }
    }
  }, [geoJson, map]);
  return null;
}

export default function IVPCMap({
  basinGeojson,
  metrics,
  estacoes = [],
  mapTileUrl,
}: IVPCMapProps) {
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    basinBoundary: true,
    blindSpot: true,
    monitored: true,
    buffers: true,
    estacoes: estacoes.length > 0,
    tileLayer: !!mapTileUrl,
  });

  const [blindSpotGeoJson, setBlindSpotGeoJson] = useState<any>(null);
  const [monitoredGeoJson, setMonitoredGeoJson] = useState<any>(null);
  const [bufferRadius] = useState(10); // 10 km conforme IVPC spec

  // Calcular buffers das estações e áreas de blind spot
  useEffect(() => {
    const calculateBuffers = async () => {
      console.log("🔵 [IVPCMap] useEffect iniciado");
      console.log("  - estacoes:", estacoes?.length || 0);
      console.log("  - basinGeojson type:", basinGeojson?.type);
      
      if (!estacoes.length || !basinGeojson) {
        console.log("⚠️ Sem estações ou bacia para calcular buffers");
        return;
      }

      try {
        const turf = await import("@turf/turf");
        console.log("✓ Turf.js importado com sucesso");

        console.log(
          "🔄 Calculando buffers de",
          bufferRadius,
          "km para",
          estacoes.length,
          "estações..."
        );

        // 1. Criar buffers de 10 km ao redor de cada estação
        const buffers = estacoes.map((est, i) => {
          const point = turf.point([est.longitude, est.latitude]);
          const buf = turf.buffer(point, bufferRadius, { units: "kilometers" });
          console.log(`  Buffer ${i}: ${est.nome} [${est.longitude}, ${est.latitude}] -> type: ${buf.geometry?.type}`);
          return buf;
        });

        if (buffers.length === 0) {
          console.log("❌ Nenhum buffer criado");
          return;
        }

        console.log("✓ Buffers individuais criados:", buffers.length);

        // 2. Unir todos os buffers - usar featureCollection + union
        console.log("📍 Iniciando union de buffers...");
        
        // CORRIGIDO: turf.union() espera um array de features
        let unionedBuffer;
        try {
          const fc = turf.featureCollection(buffers);
          console.log("  FeatureCollection criado com", fc.features.length, "features");
          unionedBuffer = turf.union(fc);
          console.log("  Union executado, resultado type:", unionedBuffer?.type);
        } catch (unionErr) {
          console.error("❌ Erro no turf.union():", unionErr);
          throw unionErr;
        }

        if (!unionedBuffer || !unionedBuffer.geometry) {
          console.error("❌ Falha ao unir buffers - resultado inválido");
          console.log("  unionedBuffer:", unionedBuffer);
          return;
        }

        console.log("✓ Buffers unidos com sucesso", {
          type: unionedBuffer.type,
          geomType: unionedBuffer.geometry?.type,
          coordsLength: JSON.stringify(unionedBuffer.geometry).length,
        });

        // 3. Extrair bacia feature
        let basinFeature = basinGeojson;
        if (basinGeojson.type === "FeatureCollection") {
          basinFeature = basinGeojson.features[0];
          console.log("📍 Extraído Feature da FeatureCollection");
        }

        console.log("📍 Basin feature:", {
          type: basinFeature?.type,
          geomType: basinFeature?.geometry?.type,
        });

        if (!basinFeature || !basinFeature.geometry) {
          console.error("❌ Bacia não possui geometria válida");
          return;
        }

        // 4. Calcular área monitorada = intersecção entre bacia e buffers
        try {
          console.log("🔄 Calculando intersecção (monitorada)...");
          // CORRIGIDO: turf.intersect espera um FeatureCollection
          const fcIntersect = turf.featureCollection([basinFeature, unionedBuffer]);
          console.log("  FeatureCollection para intersect:", {
            features: fcIntersect.features.length,
            types: fcIntersect.features.map(f => f.geometry?.type),
          });
          
          const monitoredArea = turf.intersect(fcIntersect);

          console.log("📍 Monitored area result:", {
            exists: !!monitoredArea,
            type: monitoredArea?.type,
            geomType: monitoredArea?.geometry?.type,
            hasGeometry: !!monitoredArea?.geometry,
            coordsLength: monitoredArea?.geometry ? JSON.stringify(monitoredArea.geometry).length : 0,
          });

          if (monitoredArea && monitoredArea.geometry) {
            console.log("✓ Área monitorada calculada", {
              geomType: monitoredArea.geometry.type,
            });
            const monitoredFeatureCollection = {
              type: "FeatureCollection" as const,
              features: [
                {
                  type: "Feature" as const,
                  geometry: monitoredArea.geometry,
                  properties: {
                    type: "monitored",
                    description: `Dentro de ${bufferRadius} km de estação`,
                  },
                },
              ],
            };
            console.log("  Setando monitoredGeoJson com:", {
              type: monitoredFeatureCollection.type,
              features: monitoredFeatureCollection.features.length,
            });
            setMonitoredGeoJson(monitoredFeatureCollection);
          } else {
            console.warn("⚠️ monitoredArea inválida:", monitoredArea);
          }
        } catch (e) {
          console.error("❌ Erro ao calcular intersecção:", e);
        }

        // 5. Área de blind spot = bacia - buffers
        try {
          console.log("🔄 Calculando diferença (blind spot)...");
          // CORRIGIDO: turf.difference espera um FeatureCollection
          const fcDifference = turf.featureCollection([basinFeature, unionedBuffer]);
          console.log("  FeatureCollection para difference:", {
            features: fcDifference.features.length,
            types: fcDifference.features.map(f => f.geometry?.type),
          });
          
          const blindSpotArea = turf.difference(fcDifference);

          console.log("📍 Blind spot area result:", {
            exists: !!blindSpotArea,
            type: blindSpotArea?.type,
            geomType: blindSpotArea?.geometry?.type,
            hasGeometry: !!blindSpotArea?.geometry,
            coordsLength: blindSpotArea?.geometry ? JSON.stringify(blindSpotArea.geometry).length : 0,
          });

          if (blindSpotArea && blindSpotArea.geometry) {
            console.log("✓ Blind spot calculado", {
              geomType: blindSpotArea.geometry.type,
            });
            const blindSpotFeatureCollection = {
              type: "FeatureCollection" as const,
              features: [
                {
                  type: "Feature" as const,
                  geometry: blindSpotArea.geometry,
                  properties: {
                    type: "blindSpot",
                    description: `Deficiência operacional (> ${bufferRadius} km)`,
                  },
                },
              ],
            };
            console.log("  Setando blindSpotGeoJson com:", {
              type: blindSpotFeatureCollection.type,
              features: blindSpotFeatureCollection.features.length,
            });
            setBlindSpotGeoJson(blindSpotFeatureCollection);
          } else {
            console.warn("⚠️ blindSpotArea inválida:", blindSpotArea);
          }
        } catch (e) {
          console.error("❌ Erro ao calcular diferença:", e);
        }
        
        console.log("🟢 [IVPCMap] Cálculo concluído com sucesso");
      } catch (err) {
        console.error("❌ Erro ao calcular buffers:", err);
      }
    };

    calculateBuffers();
  }, [estacoes, basinGeojson, bufferRadius]);

  const toggleLayer = (layer: keyof LayerVisibility) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  const estacaoIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header com Legenda */}
      <div className="bg-slate-50 border-b border-slate-200 p-4">
        <h3 className="font-semibold text-slate-800 mb-3 text-sm">
          🗺️ Deficiência Operacional (Blind Spot = &gt; {bufferRadius}km)
        </h3>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {/* Basin Boundary */}
          <button
            onClick={() => toggleLayer("basinBoundary")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Contorno da bacia"
          >
            {layerVisibility.basinBoundary ? (
              <Eye className="w-3 h-3 text-blue-600" />
            ) : (
              <EyeOff className="w-3 h-3 text-slate-400" />
            )}
            <span className="font-medium text-slate-700">Bacia</span>
            <div className="w-3 h-3 rounded border-2 border-blue-500 bg-blue-50"></div>
          </button>

          {/* Monitored Areas */}
          <button
            onClick={() => toggleLayer("monitored")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Dentro de 10 km das estações"
          >
            {layerVisibility.monitored ? (
              <Eye className="w-3 h-3 text-green-600" />
            ) : (
              <EyeOff className="w-3 h-3 text-slate-400" />
            )}
            <span className="font-medium text-slate-700 text-[11px]">
              Monitorado
            </span>
            <div className="w-3 h-3 rounded bg-green-400"></div>
          </button>

          {/* Blind Spot Areas */}
          <button
            onClick={() => toggleLayer("blindSpot")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Sem cobertura (> 10 km)"
          >
            {layerVisibility.blindSpot ? (
              <Eye className="w-3 h-3 text-red-600" />
            ) : (
              <EyeOff className="w-3 h-3 text-slate-400" />
            )}
            <span className="font-medium text-slate-700 text-[11px]">
              Blind Spot
            </span>
            <div className="w-3 h-3 rounded bg-orange-500"></div>
          </button>

          {/* Buffers */}
          {estacoes.length > 0 && (
            <button
              onClick={() => toggleLayer("buffers")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              title="Raios de cobertura de 10 km"
            >
              {layerVisibility.buffers ? (
                <Eye className="w-3 h-3 text-emerald-600" />
              ) : (
                <EyeOff className="w-3 h-3 text-slate-400" />
              )}
              <span className="font-medium text-slate-700 text-[11px]">
                Raios
              </span>
              <div className="w-3 h-3 rounded-full border-2 border-emerald-500"></div>
            </button>
          )}

          {/* Estações */}
          {estacoes.length > 0 && (
            <button
              onClick={() => toggleLayer("estacoes")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              title="Locais de estações hidrológicas"
            >
              {layerVisibility.estacoes ? (
                <Eye className="w-3 h-3 text-indigo-600" />
              ) : (
                <EyeOff className="w-3 h-3 text-slate-400" />
              )}
              <span className="font-medium text-slate-700 text-[11px]">
                Estações ({estacoes.length})
              </span>
              <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
            </button>
          )}

          {/* Tile Layer */}
          {mapTileUrl && (
            <button
              onClick={() => toggleLayer("tileLayer")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              title="Camada de satélite"
            >
              {layerVisibility.tileLayer ? (
                <Eye className="w-3 h-3 text-amber-600" />
              ) : (
                <EyeOff className="w-3 h-3 text-slate-400" />
              )}
              <span className="font-medium text-slate-700 text-[11px]">
                Satélite
              </span>
            </button>
          )}
        </div>

        {/* Spec Reference */}
        <p className="text-[10px] text-slate-500 mt-2 font-mono bg-slate-100 px-2 py-1 rounded">
          IVPC Spec: Blind spot = distância &gt; {bufferRadius}km | Turf.js
        </p>
      </div>

      {/* Mapa */}
      <div className="flex-1 relative z-0">
        <MapContainer
          center={[-15.8, -47.8]}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
        >
          {/* Base Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* GEE Tile Layer */}
          {layerVisibility.tileLayer && mapTileUrl && (
            <TileLayer url={mapTileUrl} opacity={0.6} zIndex={5} />
          )}

          {/* Basin Boundary */}
          {layerVisibility.basinBoundary && basinGeojson && (
            <GeoJSON
              key="basin-boundary"
              data={basinGeojson}
              style={{
                color: "#2563eb",
                weight: 3,
                opacity: 0.8,
                fillColor: "#dbeafe",
                fillOpacity: 0.05,
              }}
              onEachFeature={(feature, layer) => {
                layer.bindPopup(
                  `<strong>📍 Contorno da Bacia</strong><br/>Área elegível: ${metrics.urbanEligibleArea.toFixed(
                    2
                  )} km²`
                );
              }}
            />
          )}

          {/* Monitored Areas - Green (Inside 10km Buffers) */}
          {layerVisibility.monitored && monitoredGeoJson && (
            <GeoJSON
              key="monitored-areas"
              data={monitoredGeoJson}
              style={{
                color: "#15803d",
                weight: 1,
                opacity: 0.7,
                fillColor: "#4ade80",
                fillOpacity: 0.5,
              }}
              onEachFeature={(feature, layer) => {
                layer.bindPopup(
                  `<strong>✓ Área Monitorada</strong><br/>Dentro de ${bufferRadius}km de estação<br/>Cobertura operacional: ${(
                    100 - metrics.blindSpotPercentage
                  ).toFixed(1)}%`
                );
              }}
            />
          )}

          {/* Blind Spot Areas - Orange/Red (Outside 10km Buffers) */}
          {layerVisibility.blindSpot && blindSpotGeoJson && (
            <GeoJSON
              key="blind-spot-areas"
              data={blindSpotGeoJson}
              style={{
                color: "#991b1b",
                weight: 1,
                opacity: 0.8,
                fillColor: "#f97316",
                fillOpacity: 0.6,
              }}
              onEachFeature={(feature, layer) => {
                layer.bindPopup(
                  `<strong>⚠️ Deficiência Operacional (Blind Spot)</strong><br/>Distância > ${bufferRadius}km<br/>Deficiência: ${metrics.blindSpotPercentage.toFixed(
                    1
                  )}%<br/>Área: ${metrics.urbanBlindSpotArea.toFixed(2)} km²`
                );
              }}
            />
          )}

          {/* Buffer Circles - Visual Reference (10 km raios tracejados) */}
          {layerVisibility.buffers &&
            estacoes.map((est, idx) => (
              <Circle
                key={`buffer-${idx}`}
                center={[est.latitude, est.longitude]}
                radius={bufferRadius * 1000} // Converter km para metros
                pathOptions={{
                  color: "#10b981",
                  weight: 2,
                  opacity: 0.3,
                  fill: false,
                  dashArray: "5, 5",
                }}
              />
            ))}

          {/* Estações de Monitoramento */}
          {layerVisibility.estacoes &&
            estacoes.map((est, idx) => (
              <Marker
                key={idx}
                position={[est.latitude, est.longitude]}
                icon={estacaoIcon}
              >
                <Popup className="text-sm">
                  <div className="w-48">
                    <strong>📍 {est.nome}</strong>
                    <p className="text-xs text-slate-600 mt-1">
                      Código: {est.codigo}
                    </p>
                    <p className="text-xs text-slate-600">Tipo: {est.tipo}</p>
                    <p className="text-xs text-emerald-600 mt-2 font-semibold">
                      ✓ Raio de cobertura: {bufferRadius} km
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Map Updater */}
          <MapUpdater geoJson={basinGeojson} />
        </MapContainer>
      </div>

      {/* Stats Footer */}
      <div className="bg-slate-50 border-t border-slate-200 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <p className="text-slate-500 font-medium mb-1">Área Elegível</p>
          <p className="text-slate-800 font-semibold">
            {metrics.urbanEligibleArea.toFixed(1)} km²
          </p>
        </div>
        <div>
          <p className="text-slate-500 font-medium mb-1">✓ Monitorada</p>
          <p className="text-green-700 font-semibold">
            {(100 - metrics.blindSpotPercentage).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-slate-500 font-medium mb-1">⚠️ Blind Spot</p>
          <p className="text-orange-700 font-semibold">
            {metrics.blindSpotPercentage.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-slate-500 font-medium mb-1">📍 Estações</p>
          <p className="text-slate-800 font-semibold">
            {estacoes.length} unidades
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup } from "react-leaflet";
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
    estacoes: estacoes.length > 0,
    tileLayer: !!mapTileUrl,
  });

  // Criar GeoJSON do blind spot como representação visual
  const createBlindSpotVisualization = (): GeoJSON.FeatureCollection => {
    if (!basinGeojson) {
      return {
        type: "FeatureCollection",
        features: [],
      };
    }

    // Se a bacia é um Polygon, usamos diretamente
    // Se é MultiPolygon, processamos todos
    const coordinates =
      basinGeojson.type === "FeatureCollection"
        ? basinGeojson.features[0]?.geometry?.coordinates ||
          basinGeojson.coordinates
        : basinGeojson.geometry?.coordinates || basinGeojson.coordinates;

    // Para simplificar, criamos uma representação visual do blind spot
    // como um GeoJSON que ocupa a proporção do blind spot dentro da bacia
    const blindSpotPercentage = metrics.blindSpotPercentage / 100;

    // Criar um polígono simplificado que representa o blind spot
    // (em produção, isso viria do cálculo real do pipeline)
    const blindSpotGeometry = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: coordinates,
      },
      properties: {
        type: "blindSpot",
        area_km2: metrics.urbanBlindSpotArea,
        percentage: metrics.blindSpotPercentage,
      },
    };

    return {
      type: "FeatureCollection",
      features: [blindSpotGeometry],
    };
  };

  // Criar GeoJSON da área monitorada
  const createMonitoredVisualization = (): GeoJSON.FeatureCollection => {
    if (!basinGeojson) {
      return {
        type: "FeatureCollection",
        features: [],
      };
    }

    const coordinates =
      basinGeojson.type === "FeatureCollection"
        ? basinGeojson.features[0]?.geometry?.coordinates ||
          basinGeojson.coordinates
        : basinGeojson.geometry?.coordinates || basinGeojson.coordinates;

    const monitoredGeometry = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: coordinates,
      },
      properties: {
        type: "monitored",
        area_km2: metrics.urbanMonitoredArea,
        percentage: 100 - metrics.blindSpotPercentage,
      },
    };

    return {
      type: "FeatureCollection",
      features: [monitoredGeometry],
    };
  };

  const toggleLayer = (layer: keyof LayerVisibility) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  const monitoredGeoJson = createMonitoredVisualization();
  const blindSpotGeoJson = createBlindSpotVisualization();

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

  // Calcular centro da bacia para inicializar o mapa
  const getMapCenter = (): [number, number] => {
    if (!basinGeojson) return [-15.8, -47.8]; // Centro do Brasil como fallback

    try {
      import("@turf/turf").then((turf) => {
        const center = turf.center(basinGeojson);
        return [center.geometry.coordinates[1], center.geometry.coordinates[0]];
      });
    } catch (err) {
      console.error("Erro ao calcular centro:", err);
    }

    return [-15.8, -47.8];
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header com Legenda */}
      <div className="bg-slate-50 border-b border-slate-200 p-4">
        <h3 className="font-semibold text-slate-800 mb-3 text-sm">
          Mapa de Vulnerabilidade Espacial (IVPC)
        </h3>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {/* Basin Boundary */}
          <button
            onClick={() => toggleLayer("basinBoundary")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Toggle boundary layer"
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
            title="Toggle monitored areas"
          >
            {layerVisibility.monitored ? (
              <Eye className="w-3 h-3 text-green-600" />
            ) : (
              <EyeOff className="w-3 h-3 text-slate-400" />
            )}
            <span className="font-medium text-slate-700">Monitorado</span>
            <div className="w-3 h-3 rounded bg-green-400"></div>
          </button>

          {/* Blind Spot Areas */}
          <button
            onClick={() => toggleLayer("blindSpot")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Toggle blind spot areas"
          >
            {layerVisibility.blindSpot ? (
              <Eye className="w-3 h-3 text-red-600" />
            ) : (
              <EyeOff className="w-3 h-3 text-slate-400" />
            )}
            <span className="font-medium text-slate-700">Sem Monitoramento</span>
            <div className="w-3 h-3 rounded bg-orange-500"></div>
          </button>

          {/* Estações */}
          {estacoes.length > 0 && (
            <button
              onClick={() => toggleLayer("estacoes")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              title="Toggle monitoring stations"
            >
              {layerVisibility.estacoes ? (
                <Eye className="w-3 h-3 text-indigo-600" />
              ) : (
                <EyeOff className="w-3 h-3 text-slate-400" />
              )}
              <span className="font-medium text-slate-700">
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
              title="Toggle satellite/base layer"
            >
              {layerVisibility.tileLayer ? (
                <Eye className="w-3 h-3 text-amber-600" />
              ) : (
                <EyeOff className="w-3 h-3 text-slate-400" />
              )}
              <span className="font-medium text-slate-700">Imagem Satélite</span>
            </button>
          )}
        </div>
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
                fillOpacity: 0.1,
              }}
              onEachFeature={(feature, layer) => {
                if (feature.properties) {
                  layer.bindPopup(
                    `<strong>Contorno da Bacia</strong><br/>Área: ${metrics.urbanEligibleArea.toFixed(2)} km²`
                  );
                }
              }}
            />
          )}

          {/* Monitored Areas - Green */}
          {layerVisibility.monitored && monitoredGeoJson.features.length > 0 && (
            <GeoJSON
              key="monitored-areas"
              data={monitoredGeoJson}
              style={{
                color: "#16a34a",
                weight: 1,
                opacity: 0.7,
                fillColor: "#4ade80",
                fillOpacity: 0.4,
              }}
              onEachFeature={(feature, layer) => {
                if (feature.properties) {
                  layer.bindPopup(
                    `<strong>Área Monitorada</strong><br/>Área: ${metrics.urbanMonitoredArea.toFixed(2)} km²<br/>Cobertura: ${(100 - metrics.blindSpotPercentage).toFixed(1)}%`
                  );
                }
              }}
            />
          )}

          {/* Blind Spot Areas - Orange/Red */}
          {layerVisibility.blindSpot && blindSpotGeoJson.features.length > 0 && (
            <GeoJSON
              key="blind-spot-areas"
              data={blindSpotGeoJson}
              style={{
                color: "#dc2626",
                weight: 1,
                opacity: 0.8,
                fillColor: "#f97316",
                fillOpacity: 0.5,
              }}
              onEachFeature={(feature, layer) => {
                if (feature.properties) {
                  layer.bindPopup(
                    `<strong>Sem Monitoramento (Blind Spot)</strong><br/>Área: ${metrics.urbanBlindSpotArea.toFixed(2)} km²<br/>Deficiência: ${metrics.blindSpotPercentage.toFixed(1)}%<br/>Distância máx: ${metrics.maxDistanceKm.toFixed(1)} km`
                  );
                }
              }}
            />
          )}

          {/* Estações de Monitoramento */}
          {layerVisibility.estacoes &&
            estacoes.map((est, idx) => (
              <Marker
                key={idx}
                position={[est.latitude, est.longitude]}
                icon={estacaoIcon}
              >
                <Popup className="text-sm">
                  <div>
                    <strong>{est.nome}</strong>
                    <p className="text-xs text-slate-600 mt-1">
                      Código: {est.codigo}
                    </p>
                    <p className="text-xs text-slate-600">Tipo: {est.tipo}</p>
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
          <p className="text-slate-500 font-medium mb-1">Área Total</p>
          <p className="text-slate-800 font-semibold">
            {metrics.urbanEligibleArea.toFixed(1)} km²
          </p>
        </div>
        <div>
          <p className="text-slate-500 font-medium mb-1">Monitorada</p>
          <p className="text-green-700 font-semibold">
            {(100 - metrics.blindSpotPercentage).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-slate-500 font-medium mb-1">Sem Monitoramento</p>
          <p className="text-orange-700 font-semibold">
            {metrics.blindSpotPercentage.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-slate-500 font-medium mb-1">Dist. Máxima</p>
          <p className="text-slate-800 font-semibold">
            {metrics.maxDistanceKm.toFixed(1)} km
          </p>
        </div>
      </div>
    </div>
  );
}

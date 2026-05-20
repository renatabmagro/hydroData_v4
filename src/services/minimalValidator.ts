/**
 * Minimal Validator for App
 * ========================
 * Validador simplificado que não depende de arquivos externos.
 * Implementa a lógica de FIS, INU, PLU, MUN e IQA baseado nos dados
 * persistidos no store global.
 */

import * as turf from "@turf/turf";
import { ExtractedData, getExtractedData } from "./extractedDataStore";

export interface ValidationScores {
  FIS: number | null;
  INU: number | null;
  PLU: number | null;
  MUN: number | null;
  IQA: number | null;
  status: "Aprovado" | "Pendente de Revisão";
}

/**
 * Calcular média ignoran do nulls
 */
function calcMedia(values: (number | null)[]): number | null {
  const validValues = values.filter(
    (v) => v !== null && v !== undefined
  ) as number[];

  if (validValues.length === 0) return null;

  const sum = validValues.reduce((a, b) => a + b, 0);
  return sum / validValues.length;
}

/**
 * Calcular FIS - FISIOGRAFIA
 * Verifica: bacia + MDT + rede hidrográfica
 */
function calculateFIS(data: ExtractedData): number | null {
  const score_basin = data.basinGeojson ? 1.0 : null;
  const score_mdt = data.mdtTileUrl ? 1.0 : null;
  const score_net = data.riosTileUrl ? 1.0 : null;

  return calcMedia([score_basin, score_mdt, score_net]);
}

/**
 * Calcular INU - INUNDAÇÃO HISTÓRICA
 * Verifica: existência de raster de inundação
 */
function calculateINU(data: ExtractedData): number | null {
  if (data.inundacaoTileUrl) {
    return 1.0;
  }
  return null;
}

/**
 * Calcular PLU - COERÊNCIA ESPACIAL DAS ESTAÇÕES
 * Verifica: quantas estações estão dentro da bacia
 */
function calculatePLU(data: ExtractedData): number | null {
  try {
    console.log("🟡 [PLU] Iniciando cálculo...", {
      estacoes_length: data.estacoes?.length,
      has_basinGeojson: !!data.basinGeojson,
    });

    const totalStations = data.estacoes?.length ?? 0;

    // ✅ Debug: Log do estado inicial
    if (totalStations === 0) {
      console.log("🟡 [PLU] ⚠️ Nenhuma estação no store");
      return null;
    }

    if (!data.basinGeojson) {
      console.log("🟡 [PLU] ⚠️ basinGeojson não disponível");
      return null;
    }

    console.log(
      "🟡 [PLU] Processando estações...",
      data.estacoes?.slice(0, 3).map((s) => ({
        nome: s.nome,
        lat: s.latitude,
        lng: s.longitude,
      }))
    );

    let insideCount = 0;
    const stationDetails: any[] = [];

    for (const station of data.estacoes ?? []) {
      try {
        const coords = [station.longitude, station.latitude];

        // ✅ Debug: Validar coordenadas
        if (!coords || coords.length < 2) {
          console.log(
            "🟡 [PLU] ⚠️ Estação sem coordenadas válidas:",
            station.nome
          );
          stationDetails.push({
            nome: station.nome,
            error: "Coordenadas inválidas",
          });
          continue;
        }

        // ✅ Debug: Verificar tipo de coordenadas
        if (
          typeof coords[0] !== "number" ||
          typeof coords[1] !== "number"
        ) {
          console.log(
            "🟡 [PLU] ⚠️ Coordenadas não são números:",
            station.nome,
            coords
          );
          stationDetails.push({
            nome: station.nome,
            error: "Coordenadas não são números",
            coords,
          });
          continue;
        }

        const point = turf.point(coords);
        const isInside = turf.booleanPointInPolygon(
          point,
          data.basinGeojson
        );

        if (isInside) {
          insideCount++;
        }

        stationDetails.push({
          nome: station.nome,
          coords,
          inside: isInside,
        });
      } catch (stationError) {
        console.error(
          "🟡 [PLU] ❌ Erro ao processar estação:",
          station.nome,
          stationError
        );
        stationDetails.push({
          nome: station.nome,
          error: String(stationError),
        });
      }
    }

    console.log(
      "🟡 [PLU] Resultado final:",
      {
        totalStations,
        insideCount,
        percentage: (insideCount / totalStations).toFixed(2),
        stationSample: stationDetails.slice(0, 5),
      }
    );

    return totalStations > 0 ? insideCount / totalStations : null;
  } catch (error) {
    console.error("❌ [PLU] Erro geral ao calcular:", error);
    return null;
  }
}

/**
 * Calcular MUN - DADOS MUNICIPAIS
 * Verifica: urbanização + risco
 */
function calculateMUN(data: ExtractedData): number | null {
  const score_urban = data.urbanizacaoGeojson ? 1.0 : null;
  const score_risk = data.riscoGeojson ? 1.0 : null;

  // Se houver pelo menos um dado municipal
  if (score_urban !== null || score_risk !== null) {
    return calcMedia([score_urban, score_risk]);
  }

  return null;
}

/**
 * Executar validação completa
 */
export function validateExtraction(): ValidationScores {
  const data = getExtractedData();

  console.log("🔵 [VALIDATOR] Iniciando validação...");
  console.log("🔵 [VALIDATOR] Dados no store global:", {
    baciaId: data.baciaId,
    basinName: data.basinName,
    basinGeojson_type: data.basinGeojson?.type,
    basinGeojson_coordinates_length: data.basinGeojson?.geometry?.coordinates?.length,
    mdtTileUrl: data.mdtTileUrl ? "✓" : "✗",
    riosTileUrl: data.riosTileUrl ? "✓" : "✗",
    inundacaoTileUrl: data.inundacaoTileUrl ? "✓" : "✗",
    estacoes_count: data.estacoes?.length,
    estacoes_sample: data.estacoes?.slice(0, 2),
    urbGeojson: data.urbanizacaoGeojson ? "✓" : "✗",
    riskGeojson: data.riscoGeojson ? "✓" : "✗",
  });

  // ============================================
  // Calcular cada índice
  // ============================================

  const FIS = calculateFIS(data);
  const INU = calculateINU(data);
  const PLU = calculatePLU(data);
  const MUN = calculateMUN(data);

  // ============================================
  // IQA - Índice de Qualidade da Extração
  // ============================================

  const IQA = calcMedia([FIS, INU, PLU, MUN]);

  // ============================================
  // Status final
  // ============================================

  const status =
    IQA !== null && IQA >= 0.8
      ? "Aprovado"
      : "Pendente de Revisão";

  console.log("✅ [VALIDATOR] Resultados:", {
    FIS: FIS?.toFixed(2),
    INU: INU?.toFixed(2),
    PLU: PLU?.toFixed(2),
    MUN: MUN?.toFixed(2),
    IQA: IQA?.toFixed(2),
    status,
  });

  return {
    FIS,
    INU,
    PLU,
    MUN,
    IQA,
    status,
  };
}

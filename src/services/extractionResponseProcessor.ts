/**
 * Extraction Response Processor
 * =============================
 * Processa a resposta bruta da API de extração e mapeia para o formato
 * esperado pelo sistema de validação geoespacial.
 * 
 * Este arquivo resolve a discrepância entre:
 * - O que a API retorna
 * - O que o validator espera
 */

import {
  persistExtractedData,
  ExtractedData,
} from "./extractedDataStore";

export interface ExtractionAPIResponse {
  success: boolean;
  bacia_id: string;
  area_km2: number;
  geomGeojson: any;
  mdtTileUrl: string | null;
  riosTileUrl: string | null;
  inundacaoTileUrl: string | null;
  urbanizacaoGeojson?: any;
  riscoGeojson?: any;
  message?: string;
  error?: string;
}

/**
 * Processar resposta da API de extração
 * Mapeia campos reais da API para o formato esperado pelo validator
 */
export function processExtractionResponse(
  apiResponse: ExtractionAPIResponse,
  basinName: string
): ExtractedData {
  console.log(
    "🔍 [EXTRACTION API RESPONSE]",
    {
      success: apiResponse.success,
      bacia_id: apiResponse.bacia_id,
      area_km2: apiResponse.area_km2,
      hasGeomGeojson: !!apiResponse.geomGeojson,
      mdtTileUrl: apiResponse.mdtTileUrl ? "✓" : "✗",
      riosTileUrl: apiResponse.riosTileUrl ? "✓" : "✗",
      inundacaoTileUrl: apiResponse.inundacaoTileUrl ? "✓" : "✗",
      hasUrbanizacao: !!apiResponse.urbanizacaoGeojson,
      hasRisco: !!apiResponse.riscoGeojson,
    }
  );

  // Validação básica
  if (!apiResponse.success) {
    throw new Error(
      `Extraction failed: ${apiResponse.error || "Unknown error"}`
    );
  }

  const extractedData: ExtractedData = {
    baciaId: apiResponse.bacia_id || null,
    basinName: basinName || null,
    areaKm2: apiResponse.area_km2 || null,

    // ===============================================
    // FIS - FISIOGRAFIA
    // ===============================================
    basinGeojson: apiResponse.geomGeojson || null,

    // ===============================================
    // Rasters
    // ===============================================
    mdtTileUrl: apiResponse.mdtTileUrl || null,
    riosTileUrl: apiResponse.riosTileUrl || null,

    // ===============================================
    // INU - INUNDAÇÃO HISTÓRICA
    // ===============================================
    inundacaoTileUrl: apiResponse.inundacaoTileUrl || null,

    // ===============================================
    // PLU - ESTAÇÕES (será carregado separadamente)
    // ===============================================
    estacoes: [],

    // ===============================================
    // MUN - DADOS MUNICIPAIS
    // ===============================================
    urbanizacaoGeojson: apiResponse.urbanizacaoGeojson || null,
    riscoGeojson: apiResponse.riscoGeojson || null,

    timestamp: new Date().toISOString(),
    extractionSuccess: apiResponse.success,
  };

  return extractedData;
}

/**
 * Adicionar estações aos dados extraídos
 * As estações são carregadas em uma chamada separada após a extração da bacia
 */
export function addStationsToExtractedData(
  stations: Array<{
    latitude: number;
    longitude: number;
    nome: string;
    codigo: string;
    tipo: string;
  }>
) {
  console.log(
    "📍 [EXTRACTED STATIONS]",
    {
      count: stations?.length || 0,
      stations: stations?.map((s) => ({
        nome: s.nome,
        tipo: s.tipo,
        lat: s.latitude.toFixed(2),
        lng: s.longitude.toFixed(2),
      })),
    }
  );

  const currentData = require("./extractedDataStore").getExtractedData();
  persistExtractedData({
    estacoes: stations || [],
  });
}

/**
 * Handler completo para processar extração
 * Combina resposta da bacia + estações
 */
export async function handleExtractionComplete(
  extractionResponse: ExtractionAPIResponse,
  basinName: string,
  stations: Array<any> = []
) {
  try {
    // 1. Processar resposta da API
    const extractedData = processExtractionResponse(
      extractionResponse,
      basinName
    );

    // 2. Adicionar estações
    extractedData.estacoes = stations || [];

    // 3. Persistir globalmente
    persistExtractedData(extractedData);

    // 4. Log final
    console.log(
      "✅ [EXTRACTION COMPLETE]",
      {
        basinName: extractedData.basinName,
        areaKm2: extractedData.areaKm2,
        estacoes: extractedData.estacoes?.length,
        readyForValidation:
          !!extractedData.basinGeojson &&
          !!extractedData.mdtTileUrl &&
          extractedData.estacoes.length > 0,
      }
    );

    return extractedData;
  } catch (error) {
    console.error("❌ [EXTRACTION PROCESSING ERROR]", error);
    throw error;
  }
}

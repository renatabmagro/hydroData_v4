/**
 * IVPC Extraction Data Store
 * ========================
 * Armazena globalmente os dados extraídos para serem consumidos
 * pelo sistema de validação geoespacial.
 * 
 * Problema: O validator espera dados extraídos, mas recebia placeholders (null, [])
 * Solução: Este store persiste os dados REAIS da API em window.ivpcExtractedData
 */

export interface ExtractedData {
  // Metadados da bacia
  baciaId: string | null;
  basinName: string | null;
  areaKm2: number | null;

  // Geometrias (FIS - Fisiografia)
  basinGeojson: any; // Geometria da bacia extraída
  
  // Rasters (FIS - Fisiografia + INU - Inundação)
  mdtTileUrl: string | null; // MDT (Modelo Digital de Terreno)
  riosTileUrl: string | null; // Rede hidrográfica (drenagem)
  inundacaoTileUrl: string | null; // Inundação histórica (INU)
  
  // Estações (PLU - Coerência espacial das estações)
  estacoes: Array<{
    latitude: number;
    longitude: number;
    nome: string;
    codigo: string;
    tipo: string;
  }>;
  
  // Dados municipais (MUN)
  urbanizacaoGeojson: any; // Geometria de áreas urbanas
  riscoGeojson: any; // Geometria de áreas de risco
  
  // Metadata
  timestamp: string;
  extractionSuccess: boolean;
  error?: string;
}

// Estado global padrão
const DEFAULT_STATE: ExtractedData = {
  baciaId: null,
  basinName: null,
  areaKm2: null,
  basinGeojson: null,
  mdtTileUrl: null,
  riosTileUrl: null,
  inundacaoTileUrl: null,
  estacoes: [],
  urbanizacaoGeojson: null,
  riscoGeojson: null,
  timestamp: new Date().toISOString(),
  extractionSuccess: false,
};

/**
 * Inicializar o store global
 */
export function initializeExtractedDataStore() {
  if (!(window as any).ivpcExtractedData) {
    (window as any).ivpcExtractedData = { ...DEFAULT_STATE };
    console.log("💾 [EXTRACTED DATA STORE] Initialized");
  }
}

/**
 * Atualizar dados extraídos globalmente
 * IMPORTANTE: Chamar IMEDIATAMENTE após receber resposta da API
 */
export function persistExtractedData(
  data: Partial<ExtractedData>
) {
  initializeExtractedDataStore();
  
  const store = (window as any).ivpcExtractedData;
  Object.assign(store, {
    ...data,
    timestamp: new Date().toISOString(),
  });
  
  console.log(
    "💾 [EXTRACTED DATA] Persistido com sucesso:",
    {
      baciaId: store.baciaId,
      basinName: store.basinName,
      areaKm2: store.areaKm2,
      hasMdtTileUrl: !!store.mdtTileUrl,
      hasRiosTileUrl: !!store.riosTileUrl,
      hasInundacaoTileUrl: !!store.inundacaoTileUrl,
      estacoes: store.estacoes?.length || 0,
      hasUrbanizacao: !!store.urbanizacaoGeojson,
      hasRisco: !!store.riscoGeojson,
      timestamp: store.timestamp,
    }
  );
}

/**
 * Obter dados extraídos para validação
 * Retorna os dados persistidos no store global
 */
export function getExtractedData(): ExtractedData {
  initializeExtractedDataStore();
  return (window as any).ivpcExtractedData || DEFAULT_STATE;
}

/**
 * Limpar dados extraídos
 */
export function clearExtractedData() {
  (window as any).ivpcExtractedData = { ...DEFAULT_STATE };
  console.log("🗑️ [EXTRACTED DATA] Limpo");
}

/**
 * Verificar se há dados extraídos válidos
 */
export function hasValidExtractedData(): boolean {
  const data = getExtractedData();
  return (
    !!data.basinGeojson &&
    !!data.mdtTileUrl &&
    (data.estacoes?.length || 0) > 0
  );
}

export interface ValidationScores {
  FIS: number | null;
  INU: number | null;
  PLU: number | null;
  MUN: number | null;
  IQA: number | null;
  status: "Aprovado" | "Pendente de Revisão";
}

export interface ValidationInput {

  // =========================================
  // FIS
  // =========================================

  basinGeojson?: any;

  mdtTileUrl?: string | null;

  riosTileUrl?: string | null;

  // =========================================
  // INU
  // =========================================

  inundacaoTileUrl?: string | null;

  inundacaoStats?: {
    pixelCount: number;
  } | null;

  // =========================================
  // PLU
  // =========================================

  estacoes?: any[];

  // =========================================
  // MUN
  // =========================================

  urbGeojson?: any;

  populationData?: any;

  riskGeojson?: any;
}
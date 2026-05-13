export interface RawAnalysisInput {

  area_total_km2: number;

  area_urbana_risco_km2: number;

  area_ponto_cego_km2: number;

  porcentagem_risco: number;

  distancia_max_km: number;

  pop_total_ponto_cego: number;

  pop_idosos_criancas_risco: number;

  ivpc_socioambiental?: number;

  modo_metodologico?: string;

  url_asset_mapa_social?: string;
}

export interface StatisticalUniverses {

  globalAreaKm2: number;

  eligibleUrbanAreaKm2: number;

  monitoredUrbanAreaKm2: number;

  blindSpotUrbanAreaKm2: number;
}

export interface PipelineMetrics {

  /*
  =====================================================
  UNIVERSOS BASE
  =====================================================
  */

  areaTotalKm2: number;

  urbanEligibleArea: number;

  urbanBlindSpotArea: number;

  /*
  =====================================================
  COBERTURA OPERACIONAL
  =====================================================
  */

  blindSpotPercentage: number;

  monitoredPercentage: number;

  totalCoveragePercentage: number;

  /*
  =====================================================
  DISTÂNCIA / ALCANCE
  =====================================================
  */

  maxDistanceKm: number;

  /*
  =====================================================
  POPULAÇÃO
  =====================================================
  */

  populationBlindSpot: number;

  vulnerablePopulation: number;
}

export interface PipelineIVPC {

  value: number;

  classification: string;
}

export interface ExposureComponent {

  operationalDeficiency: number;

  blindSpotArea: number;

  monitoredArea: number;
}

export interface SensitivityComponent {

  vulnerablePopulation: number;

  normalizedSensitivity: number;
}

export interface EligibilityComponent {

  maxDistanceKm: number;

  eligibleArea: number;
}

export interface PipelineResult {

  /*
  =====================================================
  UNIVERSOS ESTATÍSTICOS
  =====================================================
  */

  universes: StatisticalUniverses;

  /*
  =====================================================
  MÉTRICAS
  =====================================================
  */

  metrics: PipelineMetrics;

  /*
  =====================================================
  SCORE IVPC
  =====================================================
  */

  ivpc: PipelineIVPC;

  /*
  =====================================================
  COMPONENTES ANALÍTICOS
  =====================================================
  */

  exposure: ExposureComponent;

  sensitivity: SensitivityComponent;

  eligibility: EligibilityComponent;
}
import { StatisticalUniverses } from "../types/statisticalUniverse.types";

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

export interface PipelineMetrics {

  areaTotalKm2: number;

  urbanEligibleArea: number;

  urbanBlindSpotArea: number;

  blindSpotPercentage: number;

  maxDistanceKm: number;

  populationBlindSpot: number;

  vulnerablePopulation: number;

  monitoredPercentage: number;

  totalCoveragePercentage: number;
}

export interface PipelineIVPC {

  value: number;

  classification: string;
}

export interface PipelineResult {

  universes: StatisticalUniverses;

  metrics: PipelineMetrics;

  ivpc: PipelineIVPC;

  exposure: unknown;

  sensitivity: unknown;

  eligibility: unknown;
}
import {
  RawAnalysisInput,
  PipelineResult
}
from "../ivpc/ivpc.types";

import { normalizeValue }
from "../utils/normalization";

import {
  validateSemanticIntegrity
}
from "../../../services/runtime/semanticValidation";

function classifyIVPC(
  value: number
): string {

  if (value >= 0.8)
    return "Muito Alta";

  if (value >= 0.6)
    return "Alta";

  if (value >= 0.4)
    return "Moderada";

  if (value >= 0.2)
    return "Baixa";

  return "Muito Baixa";
}

export async function runIVPCPipeline(
  input: RawAnalysisInput
): Promise<PipelineResult> {

  /*
  =====================================================
  INPUTS RAW
  =====================================================
  */

  const areaTotalKm2 =
    Number(input.area_total_km2 ?? 0);

  const urbanEligibleArea =
    Number(input.area_urbana_risco_km2 ?? 0);

  const urbanBlindSpotArea =
    Number(input.area_ponto_cego_km2 ?? 0);

  const blindSpotPercentage =
    Number(input.porcentagem_risco ?? 0);

  const maxDistanceKm =
    Number(input.distancia_max_km ?? 0);

  const populationBlindSpot =
    Number(input.pop_total_ponto_cego ?? 0);

  const vulnerablePopulation =
    Number(
      input.pop_idosos_criancas_risco ?? 0
    );

  const ivpcRaw =
    Number(
      input.ivpc_socioambiental ?? 0
    );

  /*
  =====================================================
  VALIDAÇÃO E SANITIZAÇÃO DE DADOS
  =====================================================

  REGRA: blindSpotArea NUNCA pode exceder eligibleArea
  - Se ocorrer, significa dados inválidos
  - Corrigir: clamp blindSpotArea ≤ eligibleArea
  - Recalcular percentual após sanitização
  */

  let sanitizedBlindSpotArea =
    urbanBlindSpotArea;

  if (
    sanitizedBlindSpotArea >
    urbanEligibleArea
  ) {
    // Sanitizar: blind spot não pode exceder área elegível
    sanitizedBlindSpotArea =
      urbanEligibleArea;
  }

  // Recalcular percentual após sanitização
  let sanitizedBlindSpotPercentage =
    blindSpotPercentage;

  if (urbanEligibleArea > 0) {
    sanitizedBlindSpotPercentage =
      (sanitizedBlindSpotArea /
        urbanEligibleArea) * 100;
  }

  /*
  =====================================================
  UNIVERSOS ESTATÍSTICOS
  =====================================================

  IMPORTANTE:
  - urbanEligibleArea NÃO representa o total urbano;
  - urbanBlindSpotArea NÃO pode ser usada
    como denominador global;
  - métricas mascaradas NÃO representam
    universo total da bacia.
  */

  // ✅ CORREÇÃO: urbanTotalArea = urbanEligibleArea (são o mesmo universo)
  // blindSpotPercentage já está calculado como razão de urbanEligibleArea
  const urbanTotalArea = urbanEligibleArea;

  const urbanMonitoredArea =
    Math.max(
      urbanTotalArea -
      sanitizedBlindSpotArea,
      0
    );

  const monitoredPercentage =
    urbanTotalArea > 0
      ? (
          urbanMonitoredArea /
          urbanTotalArea
        ) * 100
      : 0;

  const totalCoveragePercentage =
    monitoredPercentage +
    sanitizedBlindSpotPercentage;

  /*
  =====================================================
  VALIDAÇÃO SEMÂNTICA
  =====================================================
  */

  validateSemanticIntegrity({

    globalAreaKm2:
      areaTotalKm2,

    eligibleUrbanAreaKm2:
      urbanEligibleArea,

    monitoredUrbanAreaKm2:
      urbanMonitoredArea,

    blindSpotUrbanAreaKm2:
      sanitizedBlindSpotArea
  });

  /*
  =====================================================
  NORMALIZAÇÃO IVPC
  =====================================================
  */

  const ivpcValue =
    normalizeValue(ivpcRaw);

  /*
  =====================================================
  RESULTADO FORMAL
  =====================================================
  */

  const result: PipelineResult = {

    universes: {

      globalAreaKm2:
        areaTotalKm2,

      eligibleUrbanAreaKm2:
        urbanEligibleArea,

      monitoredUrbanAreaKm2:
        urbanMonitoredArea,

      blindSpotUrbanAreaKm2:
        sanitizedBlindSpotArea
    },

    metrics: {

      areaTotalKm2,

      urbanEligibleArea,

      urbanBlindSpotArea:
        sanitizedBlindSpotArea,

      blindSpotPercentage:
        sanitizedBlindSpotPercentage,

      monitoredPercentage,

      totalCoveragePercentage,

      maxDistanceKm,

      populationBlindSpot,

      vulnerablePopulation
    },

    ivpc: {

      value: ivpcValue,

      classification:
        classifyIVPC(ivpcValue)
    },

    /*
    =====================================================
    COMPONENTES ANALÍTICOS
    =====================================================

    IMPORTANTE:
    - exposure NÃO é distância bruta;
    - exposure representa intensidade
      operacional relativa;
    - sensitivity representa intensidade
      populacional vulnerável;
    - eligibility NÃO participa diretamente
      do score final.
    */

    exposure: {

      operationalDeficiency:
        sanitizedBlindSpotPercentage,

      blindSpotArea:
        sanitizedBlindSpotArea,

      monitoredArea:
        urbanMonitoredArea
    },

    sensitivity: {

      vulnerablePopulation,

      normalizedSensitivity:
        normalizeValue(
          vulnerablePopulation / 100000
        )
    },

    eligibility: {

      maxDistanceKm,

      eligibleArea:
        urbanEligibleArea
    }
  };

  return result;
}
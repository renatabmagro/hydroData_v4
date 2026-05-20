import * as turf from "@turf/turf";

import {
  ValidationInput,
  ValidationScores
} from "./validation.types";

// ======================================================
// HELPERS
// ======================================================

function calcMedia(
  values: Array<number | null>
): number | null {

  const validValues =
    values.filter(
      (v): v is number =>
        v !== null &&
        !Number.isNaN(v)
    );

  if (validValues.length === 0) {
    return null;
  }

  return (
    validValues.reduce((a, b) => a + b, 0)
    / validValues.length
  );
}

// ======================================================
// MAIN VALIDATION
// ======================================================

export async function validateExtraction(
  input: ValidationInput
): Promise<ValidationScores> {

  const {
    basinGeojson,
    mdtTileUrl,
    riosTileUrl,
    inundacaoTileUrl,
    inundacaoStats,
    estacoes,
    urbGeojson,
    populationData,
    riskGeojson
  } = input;

  // ======================================================
  // DEBUG
  // ======================================================

  console.log("AUDIT INPUT", {
    basinGeojson,
    mdtTileUrl,
    riosTileUrl,
    inundacaoTileUrl,
    inundacaoStats,
    estacoes,
    urbGeojson,
    populationData,
    riskGeojson
  });

  // ======================================================
  // 1. FIS — FISIOGRAFIA
  // ======================================================

  const score_basin =
    basinGeojson &&
    turf.area(basinGeojson) > 0
      ? 1.0
      : null;

  const score_dem =
    mdtTileUrl
      ? 1.0
      : null;

  const score_net =
    riosTileUrl
      ? 1.0
      : null;

  const FIS =
    calcMedia([
      score_basin,
      score_dem,
      score_net
    ]);

  // ======================================================
  // 2. INU — INUNDAÇÃO HISTÓRICA
  // ======================================================

  let INU: number | null = null;

  if (
    inundacaoStats &&
    inundacaoStats.pixelCount > 0
  ) {

    INU = 1.0;

  } else if (inundacaoTileUrl) {

    INU = 1.0;

  }

  // ======================================================
  // 3. PLU — ESTAÇÕES
  // ======================================================

  let PLU: number | null = null;

  try {

    const totalStations =
      estacoes?.length ?? 0;

    if (
      totalStations > 0 &&
      basinGeojson
    ) {

      let insideCount = 0;

      for (const station of (estacoes ?? [])) {

        const coords =
          station?.geometry?.coordinates;

        if (
          !coords ||
          coords.length < 2
        ) {
          continue;
        }

        const point =
          turf.point(coords);

        const isInside =
          turf.booleanPointInPolygon(
            point,
            basinGeojson
          );

        if (isInside) {
          insideCount++;
        }
      }

      PLU =
        insideCount / totalStations;
    }

  } catch (error) {

    console.error(
      "PLU validation error:",
      error
    );

    PLU = null;
  }

  // ======================================================
  // 4. MUN — DADOS MUNICIPAIS
  // ======================================================

  const score_urban =
    urbGeojson
      ? 1.0
      : null;

  const score_pop =
    populationData
      ? 1.0
      : null;

  const score_risk =
    riskGeojson
      ? 1.0
      : null;

  const MUN =
    calcMedia([
      score_urban,
      score_pop,
      score_risk
    ]);

  // ======================================================
  // 5. IQA FINAL
  // ======================================================

  const IQA =
    calcMedia([
      FIS,
      INU,
      PLU,
      MUN
    ]);

  // ======================================================
  // 6. STATUS FINAL
  // ======================================================

  const status =
    IQA !== null && IQA >= 0.8
      ? "Aprovado"
      : "Pendente de Revisão";

  // ======================================================
  // RETURN
  // ======================================================

  return {
    FIS,
    INU,
    PLU,
    MUN,
    IQA,
    status
  };
}
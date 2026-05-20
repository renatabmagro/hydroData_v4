import { validateExtraction }
from "../validation/extractionValidation";

export async function runValidationPipeline(
  extractedData: any
) {

  console.log(
    "RAW EXTRACTION DATA",
    extractedData
  );

  const validation =
    await validateExtraction({

      // ======================================
      // FIS
      // ======================================

      basinGeojson:
        extractedData?.extractedBasin,

      mdtTileUrl:
        extractedData?.mdtTileUrl
        ?? null,

      riosTileUrl:
        extractedData?.extractedDrainage,

      // ======================================
      // INU
      // ======================================

      inundacaoTileUrl:
        extractedData?.floodRaster,

      inundacaoStats:
        extractedData?.inundacaoStats
        ?? null,

      // ======================================
      // PLU
      // ======================================

      estacoes:
        extractedData?.extractedStations,

      // ======================================
      // MUN
      // ======================================

      urbGeojson:
        extractedData?.extractedUrban,

      populationData:
        extractedData?.populationData
        ?? null,

      riskGeojson:
        extractedData?.riskGeojson
        ?? null

    });

  console.log(
    "VALIDATION RESULT",
    validation
  );

  return validation;
}
/**
 * Validation Pipeline
 * ===================
 * Pipeline que executa a validação geoespacial após a extração.
 * 
 * Fluxo:
 * 1. Obter dados extraídos do store global
 * 2. Executar validação
 * 3. Retornar scores (FIS, INU, PLU, MUN, IQA)
 */

import { getExtractedData } from "./extractedDataStore";
import { validateExtraction } from "./minimalValidator";
import type { ValidationScores } from "./minimalValidator";

/**
 * Chamar o validator mínimo embutido
 */
function getValidator() {
  return validateExtraction;
}

/**
 * Executar pipeline de validação
 * Pega dados do store global e processa
 */
export async function runValidationPipeline(): Promise<ValidationScores> {
  console.log("🔵 [VALIDATION PIPELINE] Iniciando...");

  try {
    // 1. Obter dados extraídos do store global
    const extractedData = getExtractedData();

    console.log(
      "📋 [VALIDATION DATA AVAILABLE]",
      {
        basinGeojson: extractedData.basinGeojson ? "✓" : "✗",
        mdtTileUrl: extractedData.mdtTileUrl ? "✓" : "✗",
        riosTileUrl: extractedData.riosTileUrl ? "✓" : "✗",
        inundacaoTileUrl: extractedData.inundacaoTileUrl ? "✓" : "✗",
        estacoes: extractedData.estacoes?.length,
        urbGeojson: extractedData.urbanizacaoGeojson ? "✓" : "✗",
        riskGeojson: extractedData.riscoGeojson ? "✓" : "✗",
      }
    );

    // 2. Obter validator
    const validator = getValidator();
    if (!validator) {
      throw new Error(
        "Validator não disponível. Verificar importação de minimalValidator.ts"
      );
    }

    // 3. Executar validação
    const validationScores = validator();

    console.log(
      "✅ [VALIDATION PIPELINE COMPLETE]",
      {
        FIS: validationScores.FIS?.toFixed(2),
        INU: validationScores.INU?.toFixed(2),
        PLU: validationScores.PLU?.toFixed(2),
        MUN: validationScores.MUN?.toFixed(2),
        IQA: validationScores.IQA?.toFixed(2),
        status: validationScores.status,
      }
    );

    return validationScores;
  } catch (error) {
    console.error(
      "❌ [VALIDATION PIPELINE ERROR]",
      error
    );

    // Retornar scores nulos em caso de erro
    return {
      FIS: null,
      INU: null,
      PLU: null,
      MUN: null,
      IQA: null,
      status: "Pendente de Revisão",
    };
  }
}

/**
 * Verificar se há dados suficientes para validação
 */
export function canRunValidation(): boolean {
  const extracted = getExtractedData();
  return (
    !!extracted.basinGeojson &&
    !!extracted.mdtTileUrl &&
    extracted.estacoes.length > 0
  );
}

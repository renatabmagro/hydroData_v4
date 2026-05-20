import { validateExtraction }
from "../validation/extractionValidation";

export async function runValidationPipeline(
  extractedData: any
) {

  const validation =
    await validateExtraction(extractedData);

  return validation;
}
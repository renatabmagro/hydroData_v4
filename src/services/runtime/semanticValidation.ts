import {
  StatisticalUniverses
}
from "../../core/engine/types/statisticalUniverse.types";

import {
  validateStatisticalUniverses
}
from "../../core/engine/utils/semanticGuards";

export function validateSemanticIntegrity(
  universes: StatisticalUniverses
) {

  validateStatisticalUniverses(
    universes
  );

  return true;
}
import { z }
from "zod";

export const analysisSchema = z.object({

  area_total_km2:
    z.number(),

  area_urbana_risco_km2:
    z.number(),

  area_ponto_cego_km2:
    z.number(),

  porcentagem_risco:
    z.number(),

  distancia_max_km:
    z.number(),

  pop_total_ponto_cego:
    z.number(),

  pop_idosos_criancas_risco:
    z.number(),

  ivpc_socioambiental:
    z.number().optional(),

  modo_metodologico:
    z.string().optional(),

  url_asset_mapa_social:
    z.string().optional()
});

export function validateAnalysis(
  data: unknown
) {

  return analysisSchema.parse(data);
}

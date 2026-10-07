import type { Metricas } from "@qi/contracts";

/** Indicadores de EXEMPLO (as 60 primeiras peças do turno). */
export const metricasExemplo: Metricas = {
  turno: 1,
  segundos: 295,
  lote: null,
  fotos: 60,
  por_destino: {
    caixa: 32,
    refugo: 14,
    revisao: 14,
  },
  taxa_refugo_pct: 23.3,
  prejuizo_esperado: 120.2,
  revisoes_pendentes: 14,
  espera_revisao_media_s: 40,
  lotes: ["L7-1"],
};

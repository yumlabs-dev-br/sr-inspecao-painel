import { useCallback, useState } from "react";
import type { Metricas } from "@qi/contracts";
import { metricasExemplo } from "../mocks/metricas.ts";
import type { Estado, Origem } from "./origem.ts";

/**
 * Os indicadores do turno — Etapa 2. Hoje devolve os dados de EXEMPLO.
 *
 * TODO Etapa 2, num useEffect:
 *   - chame buscarMetricas(lote, sinal) (services/api.ts) e guarde o resultado; origem passa a "api"
 *   - em caso de erro, guarde a mensagem em erro; recarregar() busca de novo
 *   - repita a cada 5 s (setTimeout) e busque de novo quando o lote mudar
 *   - cancele tudo ao desmontar (AbortController + clearTimeout)
 * Dica: o mesmo vale para o useSeries — dá para escrever um hook genérico useBusca(buscar, chave).
 */
export function useMetricas(lote: string | null): Estado<Metricas> {
  void lote;
  const [dados] = useState<Metricas | null>(metricasExemplo);
  const [origem] = useState<Origem>("exemplo");
  const recarregar = useCallback(() => {}, []);
  return { dados, origem, carregando: false, erro: null, recarregar };
}

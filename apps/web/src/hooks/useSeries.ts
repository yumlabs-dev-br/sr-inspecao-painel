import { useCallback, useState } from "react";
import type { Series } from "@qi/contracts";
import { seriesExemplo } from "../mocks/series.ts";
import type { FiltroSeries } from "../services/api.ts";
import type { Estado, Origem } from "./origem.ts";

/**
 * Os dados do gráfico — Etapa 2. Hoje devolve os dados de EXEMPLO.
 *
 * TODO Etapa 2: como o useMetricas, com buscarSeries(filtro, sinal); busque de novo quando
 * filtro.agrupar ou filtro.lote mudarem (e a cada 5 s).
 */
export function useSeries(filtro: FiltroSeries): Estado<Series> {
  void filtro;
  const [dados] = useState<Series | null>(seriesExemplo);
  const [origem] = useState<Origem>("exemplo");
  const recarregar = useCallback(() => {}, []);
  return { dados, origem, carregando: false, erro: null, recarregar };
}

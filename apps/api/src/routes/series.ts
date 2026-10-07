import { Router } from "express";
import { ErroHttp, type Operacao } from "../dados/operacao.ts";

/**
 * GET /api/series?agrupar=minuto|lote&lote= — Etapa 2: os dados do gráfico.
 *
 * TODO Etapa 2:
 *   - agrupar (padrão "minuto") só pode ser "minuto" ou "lote" → senão 400 {"erro": ...}
 *   - lote (opcional) tem o formato "L7-2" (/^L\d+-\d+$/) → senão 400; não existe neste turno → 404
 *   - res.json(operacao.series(agrupar, lote ?? null))   (a conta já está pronta na Operacao)
 * Veja docs/contrato.md.
 */
export function rotaSeries(operacao: Operacao) {
  const r = Router();
  r.get("/series", (_req, _res) => {
    void operacao;
    throw new ErroHttp(501, "TODO Etapa 2: implemente GET /api/series (routes/series.ts)");
  });
  return r;
}

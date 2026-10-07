import { Router } from "express";
import { ErroHttp, type Operacao } from "../dados/operacao.ts";

/** GET /api/metricas?lote= — os indicadores do turno (ou de um lote). */
export function rotaMetricas(operacao: Operacao) {
  const r = Router();
  r.get("/metricas", (req, res) => {
    const lote = typeof req.query.lote === "string" && req.query.lote ? req.query.lote : null;
    if (lote && !operacao.existeLote(lote)) throw new ErroHttp(404, `lote ${lote} não existe neste turno`);
    res.json(operacao.metricas(lote));
  });
  return r;
}

import { Router } from "express";
import { ErroHttp, type Operacao } from "../dados/operacao.ts";
import { miniatura } from "../imagem/miniatura.ts";
import { destinoDaQuery, inteiroDaQuery } from "./validacao.ts";

/** As fotos do turno: lista (com filtros e paginação), uma foto, o arquivo e a miniatura. */
export function rotaFotos(operacao: Operacao) {
  const r = Router();

  r.get("/fotos", (req, res) => {
    const destino = destinoDaQuery(req.query.destino);
    const lote = typeof req.query.lote === "string" && req.query.lote ? req.query.lote : null;
    const pagina = inteiroDaQuery(req.query.pagina, "pagina", 1, 1, 1_000_000);
    const porPagina = inteiroDaQuery(req.query.por_pagina, "por_pagina", 12, 1, 100);
    res.json(operacao.listar({ destino, lote, pagina, porPagina }));
  });

  r.get("/fotos/:id", (req, res) => {
    const f = operacao.buscar(req.params.id);
    if (!f) throw new ErroHttp(404, `foto ${req.params.id} não existe`);
    res.json(f);
  });

  r.get("/fotos/:id/arquivo", (req, res) => {
    const b = operacao.arquivo(req.params.id);
    if (!b) throw new ErroHttp(404, `foto ${req.params.id} não existe`);
    res.type("png").send(Buffer.from(b));
  });

  /**
   * GET /api/fotos/:id/miniatura — Etapa 1. A galeria mostra dezenas de fotos:
   * em vez da foto inteira (12 KB), uma miniatura de 24 × 24 (menos de 1 KB).
   *
   * TODO Etapa 1:
   *   1. b = operacao.arquivo(id) — não existe: throw new ErroHttp(404, ...)
   *   2. a miniatura de uma foto NUNCA muda: Cache-Control "public, max-age=31536000, immutable"
   *      (o navegador — e, na Etapa 4, o service worker — pode guardar para sempre)
   *   3. res.type("png").send(Buffer.from(miniatura(b, 24)))   (miniatura() já está pronta)
   */
  r.get("/fotos/:id/miniatura", (_req, _res) => {
    void miniatura;
    throw new ErroHttp(501, "TODO Etapa 1: implemente GET /api/fotos/:id/miniatura (routes/fotos.ts)");
  });

  return r;
}

import request from "supertest";
import { describe, expect, it } from "vitest";
import { criarApp } from "../src/app.ts";
import { Operacao } from "../src/dados/operacao.ts";
import { pecasDoPeriodo } from "../src/simulador/modelo.mjs";

/** Uma API com as primeiras `n` peças do turno da semente 7. */
function api(n = 30) {
  const op = new Operacao();
  op.novoTurno(1);
  for (const p of pecasDoPeriodo(7).slice(0, n)) op.receber(p);
  return { app: criarApp(op), op };
}

describe("fotos", () => {
  it("lista com filtro de destino e paginação", async () => {
    const { app } = api();
    const r = await request(app).get("/api/fotos?destino=refugo&por_pagina=2");
    expect(r.status).toBe(200);
    expect(r.body.itens).toHaveLength(2);
    expect(r.body.itens.every((f: { destino: string }) => f.destino === "refugo")).toBe(true);
    expect((await request(app).get("/api/fotos?destino=lixo")).status).toBe(400);
  });

  // Etapa 1: tire o .skip quando a rota da miniatura estiver pronta.
  it.skip("a miniatura é um PNG pequeno que pode ficar em cache para sempre", async () => {
    const { app } = api();
    const r = await request(app).get("/api/fotos/P-7001/miniatura").buffer(true);
    expect(r.status).toBe(200);
    expect(r.headers["content-type"]).toContain("image/png");
    expect(r.headers["cache-control"]).toContain("immutable");
    expect((r.body as Buffer).length).toBeLessThan(2000);
  });
});

describe("métricas e séries", () => {
  it("métricas do turno e de um lote", async () => {
    const { app } = api(70);
    const m = (await request(app).get("/api/metricas")).body;
    expect(m.fotos).toBe(70);
    expect(m.lotes).toEqual(["L7-1", "L7-2"]);
    expect((await request(app).get("/api/metricas?lote=L7-2")).body.fotos).toBe(10);
    expect((await request(app).get("/api/metricas?lote=L9-9")).status).toBe(404);
  });

  // Etapa 2: tire o .skip quando GET /api/series estiver pronta.
  it.skip("séries por minuto e por lote, com validação", async () => {
    const { app } = api(70);
    expect((await request(app).get("/api/series?agrupar=lote")).body.pontos).toHaveLength(2);
    expect((await request(app).get("/api/series")).body.pontos[0].rotulo).toBe("00 min");
    expect((await request(app).get("/api/series?agrupar=hora")).status).toBe(400);
    expect((await request(app).get("/api/series?lote=lote-2")).status).toBe(400);
  });
});

describe("revisão", () => {
  it("o supervisor revisa uma vez só", () => {
    const { op } = api();
    const pendente = op.listar({ destino: "revisao", lote: null, pagina: 1, porPagina: 1 }).itens[0];
    expect(op.revisar(pendente.id, "caixa", "bruno").revisada_por).toBe("bruno");
    expect(() => op.revisar(pendente.id, "refugo", "bruno")).toThrow(/já foi revisada/);
  });
});

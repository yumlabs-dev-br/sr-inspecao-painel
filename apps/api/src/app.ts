import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express, { type ErrorRequestHandler } from "express";
import { ErroHttp, type Operacao } from "./dados/operacao.ts";
import { rotaFotos } from "./routes/fotos.ts";
import { rotaMetricas } from "./routes/metricas.ts";
import { rotaSeries } from "./routes/series.ts";

const WEB = join(dirname(fileURLToPath(import.meta.url)), "../../web/dist");

const tratarErros: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ErroHttp) {
    res.status(err.status).json({ erro: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ erro: "erro interno no servidor" });
};

/** A API do painel em /api e, em produção, o painel já compilado (apps/web/dist). */
export function criarApp(operacao: Operacao) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json());

  const api = express.Router();
  api.get("/saude", (_req, res) => {
    res.json({ ok: true });
  });
  api.use(rotaFotos(operacao));
  api.use(rotaMetricas(operacao));
  api.use(rotaSeries(operacao));
  api.use((req, res) => {
    res.status(404).json({ erro: `rota ${req.method} /api${req.path} não existe` });
  });
  api.use(tratarErros);
  app.use("/api", api);

  if (existsSync(WEB)) {
    app.use(express.static(WEB));
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(join(WEB, "index.html")));
  }
  return app;
}

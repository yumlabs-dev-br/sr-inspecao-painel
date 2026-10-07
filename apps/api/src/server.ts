import { createServer } from "node:http";
import { criarApp } from "./app.ts";
import { Operacao } from "./dados/operacao.ts";
import { ligarAoVivo } from "./routes/aoVivo.ts";
import { Estacao } from "./simulador/estacao.ts";

const porta = Number(process.env.PORT ?? 3001);
const operacao = new Operacao();
const estacao = new Estacao(operacao, {
  semente: Number(process.env.SIMULACAO_SEMENTE ?? 7),
  ritmoMs: Number(process.env.SIMULACAO_RITMO_MS ?? 2000),
  repetir: process.env.SIMULACAO_REPETIR !== "0",
});

const servidor = createServer(criarApp(operacao));
ligarAoVivo(servidor, operacao, estacao);
estacao.rodar().catch((e) => console.error("A estação parou:", e));
servidor.listen(porta, () => {
  console.log(`API do painel: http://localhost:${porta}/api (uma peça a cada ${process.env.SIMULACAO_RITMO_MS ?? 2000} ms)`);
});

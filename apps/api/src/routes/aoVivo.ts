import type { Server } from "node:http";
import type { MensagemServidor } from "@qi/contracts";
import { WebSocket, WebSocketServer } from "ws";
import type { Operacao } from "../dados/operacao.ts";
import type { Estacao } from "../simulador/estacao.ts";

/**
 * O painel ao vivo por WebSocket em /api/ao-vivo — Etapa 3. Nos DOIS sentidos:
 *   API → painel: {"tipo": "foto", foto} a cada peça nova e {"tipo": "revisada", foto} quando alguém revisa;
 *   painel → API: {"tipo": "revisar", id, destino, supervisor}.
 *
 * TODO Etapa 3:
 *   1. const wss = new WebSocketServer({ server: servidor, path: "/api/ao-vivo" })
 *   2. estacao.on("foto", (foto) => …) manda {"tipo": "foto", foto} para TODOS (wss.clients)
 *   3. wss.on("connection", (ws) => …): mande {"tipo": "ola", turno, segundos} e, em ws.on("message"):
 *      - JSON inválido ou tipo desconhecido → {"tipo": "erro", mensagem} só para quem mandou
 *      - "revisar" → operacao.revisar(id, destino, supervisor) e {"tipo": "revisada", foto} para TODOS;
 *        se a Operacao lançar ErroHttp (ex.: já revisada), {"tipo": "erro", mensagem: e.message} só para quem mandou
 * Veja docs/contrato.md.
 */
export function ligarAoVivo(servidor: Server, operacao: Operacao, estacao: Estacao) {
  // Para mandar uma mensagem: ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify(m))
  const exemplo: MensagemServidor = { tipo: "ola", turno: operacao.turno, segundos: operacao.segundos };
  void exemplo;
  void servidor;
  void estacao;
  void WebSocket;
  void WebSocketServer;
}

import type { Agrupamento, Destino, ErroApi, Foto, MensagemCliente, MensagemServidor, Metricas, PaginaFotos, Series } from "@qi/contracts";

/** Erro de uma chamada à API, com o status HTTP (0 = sem conexão). */
export class ErroDaApi extends Error {
  constructor(
    public readonly status: number,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = "ErroDaApi";
  }
}

/**
 * GET em /api com tratamento de erro — Etapa 1.
 *
 * TODO Etapa 1:
 *   1. r = await fetch(`/api${caminho}`, { headers: { accept: "application/json" }, signal: sinal })
 *      (falha de rede → throw new ErroDaApi(0, "sem conexão com a API"); AbortError → relance como veio)
 *   2. se !r.ok: leia o corpo ({"erro": "..."} — tipo ErroApi) e throw new ErroDaApi(r.status, corpo.erro)
 *   3. devolva await r.json() como T
 */
async function obter<T>(caminho: string, sinal?: AbortSignal): Promise<T> {
  void caminho;
  void sinal;
  throw new ErroDaApi(0, "TODO Etapa 1: implemente obter() em services/api.ts");
}
// Para a Etapa 1 você vai precisar do tipo do corpo de erro:
export type { ErroApi };

export interface FiltroGaleria {
  destino: Destino | null;
  lote: string | null;
}

export const POR_PAGINA = 12;

/** GET /api/fotos?destino=&lote=&pagina=&por_pagina= — Etapa 1. */
export const buscarFotos = (filtro: FiltroGaleria, pagina: number, sinal?: AbortSignal): Promise<PaginaFotos> => {
  // TODO Etapa 1: monte a query com URLSearchParams — pagina, por_pagina (POR_PAGINA) e,
  // se vierem no filtro, destino e lote — e use obter().
  void filtro;
  void pagina;
  void sinal;
  void obter;
  throw new ErroDaApi(0, "TODO Etapa 1: implemente buscarFotos() em services/api.ts");
};

/** A miniatura (24 × 24) e a foto inteira de uma peça (as de exemplo ficam em public/exemplo). */
export const urlMiniatura = (f: Pick<Foto, "id">, exemplo = false) => (exemplo ? `/exemplo/${f.id}.png` : `/api/fotos/${encodeURIComponent(f.id)}/miniatura`);
export const urlFoto = (f: Pick<Foto, "id">, exemplo = false) => (exemplo ? `/exemplo/${f.id}.png` : `/api/fotos/${encodeURIComponent(f.id)}/arquivo`);

/** GET /api/metricas?lote= */
export const buscarMetricas = (lote: string | null, sinal?: AbortSignal) => obter<Metricas>(`/metricas${lote ? `?lote=${encodeURIComponent(lote)}` : ""}`, sinal);

export interface FiltroSeries {
  agrupar: Agrupamento;
  lote: string | null;
}

/** GET /api/series?agrupar=&lote= — Etapa 2. */
export const buscarSeries = (filtro: FiltroSeries, sinal?: AbortSignal): Promise<Series> => {
  // TODO Etapa 2: monte a query com URLSearchParams — agrupar e, se houver, lote — e use obter().
  void filtro;
  void sinal;
  throw new ErroDaApi(0, "TODO Etapa 2: implemente buscarSeries() em services/api.ts");
};

export interface ConexaoAoVivo {
  enviar: (m: MensagemCliente) => boolean;
  fechar: () => void;
}

/**
 * Abre o WebSocket /api/ao-vivo e chama aoReceber a cada mensagem da API — Etapa 3.
 *
 * TODO Etapa 3:
 *   - new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/api/ao-vivo`)
 *   - onopen → aoMudarConexao(true); onmessage → aoReceber(JSON.parse(e.data) como MensagemServidor)
 *   - onclose → aoMudarConexao(false) e, se ninguém chamou fechar(), tente de novo em 1 s
 *   - enviar(m): só se a conexão estiver aberta (readyState === WebSocket.OPEN): ws.send(JSON.stringify(m))
 */
export function conectarAoVivo(aoReceber: (m: MensagemServidor) => void, aoMudarConexao: (conectado: boolean) => void): ConexaoAoVivo {
  void aoReceber;
  void aoMudarConexao;
  const exemplo: MensagemCliente | null = null;
  void exemplo;
  return { enviar: () => false, fechar: () => {} };
}

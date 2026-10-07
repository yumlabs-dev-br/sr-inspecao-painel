/**
 * O contrato entre a API e o painel: os mesmos tipos dos dois lados. Se a API
 * mudar um campo, o TypeScript avisa no painel (npm run typecheck).
 */

export type Destino = "caixa" | "refugo" | "revisao";

/** Uma foto de peça e o que se decidiu sobre ela. */
export interface Foto {
  id: string;
  peca: string;
  lote: string;
  camera: string;
  tipo: string;
  bytes: number;
  /** As chances que a IA da câmera deu (0 a 1). */
  ia: { trinca: number; mancha: number };
  destino: Destino;
  /** Segundos do turno em que a foto chegou. */
  criada_em: number;
  revisada_em: number | null;
  revisada_por: string | null;
}

export interface PaginaFotos {
  itens: Foto[];
  total: number;
  pagina: number;
  por_pagina: number;
}

/** GET /api/metricas?lote= */
export interface Metricas {
  turno: number;
  /** Segundos do turno (0 a 895). */
  segundos: number;
  /** O lote filtrado (null = o turno todo). */
  lote: string | null;
  fotos: number;
  por_destino: { caixa: number; refugo: number; revisao: number };
  /** refugo ÷ fotos × 100, com 1 casa. */
  taxa_refugo_pct: number;
  /** A soma do prejuízo esperado, com 1 casa (revisada ou em revisão: 3). */
  prejuizo_esperado: number;
  revisoes_pendentes: number;
  /** Média de revisada_em − criada_em das revisadas (1 casa), ou null. */
  espera_revisao_media_s: number | null;
  /** Os lotes do turno, em ordem. */
  lotes: string[];
}

export type Agrupamento = "minuto" | "lote";

/** GET /api/series?agrupar=&lote= */
export interface Series {
  agrupar: Agrupamento;
  lote: string | null;
  pontos: { rotulo: string; caixa: number; refugo: number; revisao: number; prejuizo: number }[];
}

/** O que a API manda pelo WebSocket /api/ao-vivo. */
export type MensagemServidor =
  | { tipo: "ola"; turno: number; segundos: number }
  | { tipo: "foto"; foto: Foto }
  | { tipo: "revisada"; foto: Foto }
  | { tipo: "erro"; mensagem: string };

/** O que o painel manda pelo WebSocket: a revisão do supervisor. */
export interface MensagemCliente {
  tipo: "revisar";
  id: string;
  destino: "caixa" | "refugo";
  supervisor: string;
}

/** Corpo dos erros da API. */
export interface ErroApi {
  erro: string;
}

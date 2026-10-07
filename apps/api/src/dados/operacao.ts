import type { Agrupamento, Destino, Foto, Metricas, PaginaFotos, Series } from "@qi/contracts";
import { CUSTO, melhorDestino, PASSO_S, type Peca } from "../simulador/modelo.mjs";

const umaCasa = (v: number) => Math.round(v * 10) / 10;

/** Prejuízo esperado de uma foto no destino atual (revisada ou em revisão: o tempo do supervisor). */
export function prejuizoEsperado(f: Foto): number {
  if (f.revisada_em !== null || f.destino === "revisao") return CUSTO.revisao;
  if (f.destino === "caixa") return f.ia.trinca * CUSTO.trinca + f.ia.mancha * CUSTO.mancha;
  return (1 - f.ia.trinca - f.ia.mancha) * CUSTO.boa;
}

/** Erro com status HTTP (as rotas transformam em {"erro": ...}). */
export class ErroHttp extends Error {
  constructor(
    public readonly status: number,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

/**
 * Os dados do turno, na memória da API (já pronta): as fotos que a estação
 * mandou, com os bytes, e as contas que o painel usa.
 */
export class Operacao {
  turno = 0;
  segundos = 0;
  private fotos: Foto[] = [];
  private bytes = new Map<string, Uint8Array>();

  novoTurno(turno: number) {
    this.turno = turno;
    this.segundos = 0;
    this.fotos = [];
    this.bytes.clear();
  }

  /** A estação mandou uma peça: decide pelo menor prejuízo esperado (com revisão) e guarda. */
  receber(p: Peca): Foto {
    const foto: Foto = { id: p.codigo, peca: p.codigo, lote: p.lote, camera: "estacao-3", tipo: "image/png", bytes: p.foto.length, ia: p.ia, destino: melhorDestino(p.ia, true), criada_em: p.n * PASSO_S, revisada_em: null, revisada_por: null };
    this.fotos.push(foto);
    this.bytes.set(foto.id, p.foto);
    this.segundos = foto.criada_em;
    return { ...foto };
  }

  get lotes() {
    return [...new Set(this.fotos.map((f) => f.lote))];
  }

  existeLote(lote: string) {
    return this.fotos.some((f) => f.lote === lote);
  }

  listar({ destino, lote, pagina, porPagina }: { destino: Destino | null; lote: string | null; pagina: number; porPagina: number }): PaginaFotos {
    const todas = this.fotos.filter((f) => (!destino || f.destino === destino) && (!lote || f.lote === lote));
    return { itens: todas.slice((pagina - 1) * porPagina, pagina * porPagina).map((f) => ({ ...f })), total: todas.length, pagina, por_pagina: porPagina };
  }

  buscar(id: string): Foto | null {
    const f = this.fotos.find((x) => x.id === id);
    return f ? { ...f } : null;
  }

  arquivo(id: string): Uint8Array | null {
    return this.bytes.get(id) ?? null;
  }

  /** A revisão do supervisor (uma vez só). */
  revisar(id: string, destino: "caixa" | "refugo", supervisor: string): Foto {
    const f = this.fotos.find((x) => x.id === id);
    if (!f) throw new ErroHttp(404, `foto ${id} não existe`);
    if (f.revisada_em !== null) throw new ErroHttp(409, `a foto ${id} já foi revisada por ${f.revisada_por}`);
    if (destino !== "caixa" && destino !== "refugo") throw new ErroHttp(400, 'destino deve ser "caixa" ou "refugo"');
    if (!supervisor.trim()) throw new ErroHttp(400, "falta o supervisor");
    Object.assign(f, { destino, revisada_em: this.segundos, revisada_por: supervisor.trim() });
    return { ...f };
  }

  metricas(lote: string | null): Metricas {
    const fs = this.fotos.filter((f) => !lote || f.lote === lote);
    const conta = (d: Destino) => fs.filter((f) => f.destino === d).length;
    const revisadas = fs.filter((f) => f.revisada_em !== null);
    return {
      turno: this.turno,
      segundos: this.segundos,
      lote,
      fotos: fs.length,
      por_destino: { caixa: conta("caixa"), refugo: conta("refugo"), revisao: conta("revisao") },
      taxa_refugo_pct: fs.length ? umaCasa((conta("refugo") / fs.length) * 100) : 0,
      prejuizo_esperado: umaCasa(fs.reduce((s, f) => s + prejuizoEsperado(f), 0)),
      revisoes_pendentes: conta("revisao"),
      espera_revisao_media_s: revisadas.length ? umaCasa(revisadas.reduce((s, f) => s + (f.revisada_em! - f.criada_em), 0) / revisadas.length) : null,
      lotes: this.lotes,
    };
  }

  /** Por minuto do turno (12 peças a cada minuto) ou por lote. */
  series(agrupar: Agrupamento, lote: string | null): Series {
    const fs = this.fotos.filter((f) => !lote || f.lote === lote);
    const grupos = new Map<string, Foto[]>();
    for (const f of fs) {
      const k = agrupar === "lote" ? f.lote : `${String(Math.floor(f.criada_em / 60)).padStart(2, "0")} min`;
      grupos.set(k, [...(grupos.get(k) ?? []), f]);
    }
    return {
      agrupar,
      lote,
      pontos: [...grupos.entries()].map(([rotulo, g]) => ({
        rotulo,
        caixa: g.filter((f) => f.destino === "caixa").length,
        refugo: g.filter((f) => f.destino === "refugo").length,
        revisao: g.filter((f) => f.destino === "revisao").length,
        prejuizo: umaCasa(g.reduce((s, f) => s + prejuizoEsperado(f), 0)),
      })),
    };
  }
}

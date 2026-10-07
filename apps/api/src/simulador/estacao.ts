import { EventEmitter } from "node:events";
import type { Foto } from "@qi/contracts";
import type { Operacao } from "../dados/operacao.ts";
import { pecasDoPeriodo } from "./modelo.mjs";

export interface ConfigEstacao {
  /** Semente do primeiro turno (o turno n usa semente + n − 1). */
  semente: number;
  /** Milissegundos de relógio entre uma peça e outra (na fábrica, 5 s). */
  ritmoMs: number;
  /** Começa outro turno quando um termina? */
  repetir: boolean;
}

/**
 * A estação de inspeção rodando dentro da API (já pronta): um turno de 180
 * peças atrás do outro. A cada peça guarda a foto na Operacao e emite "foto".
 */
export class Estacao extends EventEmitter<{ foto: [Foto]; "fim-do-turno": [number] }> {
  constructor(
    private readonly operacao: Operacao,
    private readonly config: ConfigEstacao,
  ) {
    super();
  }

  async rodar() {
    for (let turno = 1; ; turno++) {
      this.operacao.novoTurno(turno);
      for (const p of pecasDoPeriodo(this.config.semente + turno - 1)) {
        this.emit("foto", this.operacao.receber(p));
        await new Promise((r) => setTimeout(r, this.config.ritmoMs));
      }
      this.emit("fim-do-turno", turno);
      if (!this.config.repetir) return;
    }
  }
}

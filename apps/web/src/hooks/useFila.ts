import { useState } from "react";
import type { Foto } from "@qi/contracts";
import { fotosExemplo } from "../mocks/fotos.ts";
import type { Origem } from "./origem.ts";
import type { AoVivo } from "./useAoVivo.ts";

export interface Fila {
  itens: Foto[] | null;
  pendentes: number;
  origem: Origem;
}

/**
 * A fila de revisão (as 4 mais antigas) — Etapa 3. Hoje mostra os dados de EXEMPLO.
 *
 * TODO Etapa 3:
 *   - busque a fila com buscarFotos({ destino: "revisao", lote: null }, 1): as 4 primeiras e o total (pendentes)
 *   - com aoVivo.assinar(...): "foto" em revisão → pendentes + 1 (e entra se couber);
 *     "revisada" → sai da fila (de QUALQUER painel!) e busque de novo para completar as 4
 *   - origem "api"
 */
export function useFila(aoVivo: AoVivo): Fila {
  void aoVivo;
  const [itens] = useState<Foto[]>(() => fotosExemplo.filter((f) => f.destino === "revisao"));
  return { itens: itens.slice(0, 4), pendentes: itens.length, origem: "exemplo" };
}

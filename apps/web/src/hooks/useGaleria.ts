import { useCallback, useState } from "react";
import type { Foto } from "@qi/contracts";
import { fotosExemplo } from "../mocks/fotos.ts";
import type { FiltroGaleria } from "../services/api.ts";
import type { Origem } from "./origem.ts";
import type { AoVivo } from "./useAoVivo.ts";

export interface Galeria {
  itens: Foto[] | null;
  total: number;
  origem: Origem;
  carregando: boolean;
  erro: string | null;
  recarregar: () => void;
  /** Busca a próxima página e junta no fim. */
  carregarMais: () => void;
}

/**
 * A galeria de fotos — Etapa 1. Hoje mostra os dados de EXEMPLO.
 *
 * TODO Etapa 1:
 *   - num useEffect: buscarFotos(filtro, pagina, sinal) (services/api.ts); guarde itens e total; origem "api"
 *   - filtro novo (destino ou lote) → volta para a página 1; carregarMais() → página + 1, JUNTANDO no fim
 *   - em caso de erro, guarde a mensagem em erro (o cartão mostra o aviso e "Tentar de novo")
 *   - recarregar() busca de novo (ex.: um contador de tentativas nas dependências do efeito)
 *   - cancele a busca ao trocar de filtro ou desmontar (AbortController)
 * Etapa 3: com aoVivo.assinar(...), atualize o cartão quando chegar {"tipo": "revisada"}.
 */
export function useGaleria(filtro: FiltroGaleria, aoVivo: AoVivo): Galeria {
  void aoVivo;
  const [itens] = useState<Foto[] | null>(fotosExemplo);
  const filtradas = (itens ?? []).filter((f) => (!filtro.destino || f.destino === filtro.destino) && (!filtro.lote || f.lote === filtro.lote));
  const recarregar = useCallback(() => {}, []);
  const carregarMais = useCallback(() => {}, []);
  return { itens: filtradas.slice(0, 12), total: filtradas.length, origem: "exemplo", carregando: false, erro: null, recarregar, carregarMais };
}

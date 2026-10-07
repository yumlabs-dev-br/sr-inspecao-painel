import { useCallback, useMemo, useState } from "react";
import type { Foto, MensagemServidor } from "@qi/contracts";
import { fotosExemplo } from "../mocks/fotos.ts";
import type { Origem } from "./origem.ts";

export interface AoVivo {
  conectado: boolean;
  origem: Origem;
  turno: number;
  segundos: number;
  /** As últimas fotos que chegaram (a mais nova primeiro). */
  ultimas: Foto[];
  /** A última mensagem de erro que a API mandou (ex.: revisão repetida). */
  erro: string | null;
  /** Manda a revisão pelo WebSocket; false se a conexão está fechada. */
  revisar: (id: string, destino: "caixa" | "refugo") => boolean;
  /** Outras partes do painel ouvem as mensagens; devolve a função que para de ouvir. */
  assinar: (fn: (m: MensagemServidor) => void) => () => void;
}

/**
 * O WebSocket /api/ao-vivo — Etapa 3. Hoje é um feed PARADO, de exemplo.
 *
 * TODO Etapa 3:
 *   - num useEffect: c = conectarAoVivo(aoReceber, setConectado) (services/api.ts); ao desmontar, c.fechar()
 *   - "ola": turno e segundos; "foto": segundos e a foto no começo de ultimas (no máximo 12); "erro": erro
 *   - guarde os ouvintes num Set (useRef) e chame cada um a cada mensagem — é o que assinar() devolve
 *   - revisar(id, destino) manda {"tipo": "revisar", id, destino, supervisor: "bruno"} pela conexão aberta
 *   - origem "api" (o selo some)
 */
export function useAoVivo(): AoVivo {
  const [ultimas] = useState<Foto[]>(() => [...fotosExemplo].reverse().slice(0, 12));
  const revisar = useCallback(() => false, []);
  const assinar = useCallback(() => () => {}, []);
  return useMemo(() => ({ conectado: false, origem: "exemplo", turno: 1, segundos: 295, ultimas, erro: null, revisar, assinar }), [ultimas, revisar, assinar]);
}

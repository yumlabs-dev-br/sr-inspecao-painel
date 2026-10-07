import type { Foto } from "@qi/contracts";
import type { Origem } from "../hooks/origem.ts";
import { urlMiniatura } from "../services/api.ts";
import { relogio } from "../utils/formatar.ts";
import { Cartao } from "./Cartao.tsx";
import { Destino } from "./Destino.tsx";

/** As fotos chegando da estação, a mais nova primeiro. */
export function AoVivo({ ultimas, origem }: { ultimas: Foto[]; origem: Origem }) {
  return (
    <Cartao titulo="Chegando da estação" legenda="cada foto, na hora em que a câmera manda" secao="ao-vivo" origem={origem}>
      <ol data-testid="feed" data-ultima-peca={ultimas[0]?.peca ?? ""} className="space-y-1.5">
        {ultimas.slice(0, 8).map((f, i) => (
          <li key={f.id} className={`flex items-center gap-2 rounded-lg px-1.5 py-1 ${i === 0 ? "bg-turquesa/10" : ""}`}>
            <img src={urlMiniatura(f, origem === "exemplo")} alt="" width={32} height={32} className="foto size-8 rounded bg-borda" />
            <span className="font-mono text-[11px] font-semibold">{f.peca}</span>
            <span className="text-[10.5px] text-fraco">{relogio(f.criada_em)}</span>
            <span className="ml-auto">
              <Destino destino={f.destino} />
            </span>
          </li>
        ))}
        {ultimas.length === 0 && <li className="py-6 text-center text-sm text-fraco">Esperando a próxima peça…</li>}
      </ol>
    </Cartao>
  );
}

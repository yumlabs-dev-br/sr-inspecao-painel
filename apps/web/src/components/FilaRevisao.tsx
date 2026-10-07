import type { Fila } from "../hooks/useFila.ts";
import { urlFoto } from "../services/api.ts";
import { numero, pontos, relogio } from "../utils/formatar.ts";
import { BarrasIa } from "./BarrasIa.tsx";
import { Cartao } from "./Cartao.tsx";

/** A fila de revisão do supervisor: a foto grande, as chances da IA e os botões. */
export function FilaRevisao({ fila, erro, onRevisar }: { fila: Fila; erro: string | null; onRevisar: (id: string, destino: "caixa" | "refugo") => void }) {
  const { itens, pendentes, origem } = fila;
  return (
    <Cartao titulo="Fila de revisão" legenda={`${numero(pendentes, 0)} pendente${pendentes === 1 ? "" : "s"} · a mais antiga primeiro`} secao="fila" origem={origem}>
      {erro && (
        <p data-testid="erro-fila" className="mb-2 rounded-lg bg-vermelho/10 px-3 py-2 text-xs text-vermelho">
          {erro}
        </p>
      )}
      <div data-testid="fila" data-pendentes={pendentes} className="space-y-2">
        {(itens ?? []).map((f) => (
          <article key={f.id} data-testid="revisao" data-id={f.id} className="flex gap-3 rounded-xl border border-borda bg-painel/60 p-2">
            <img src={urlFoto(f, origem === "exemplo")} alt={`Foto da peça ${f.peca}`} width={88} height={88} className="foto size-[88px] shrink-0 rounded-lg bg-borda" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold">{f.peca}</span>
                <span className="text-[10.5px] text-fraco">
                  lote {f.lote} · {relogio(f.criada_em)}
                </span>
              </div>
              <div className="mt-1.5">
                <BarrasIa ia={f.ia} />
              </div>
              <div className="mt-1 text-[10.5px] text-fraco">caixa {pontos(f.ia.trinca * 40 + f.ia.mancha * 10)} · refugo {pontos((1 - f.ia.trinca - f.ia.mancha) * 6)}</div>
              <div className="mt-2 flex gap-1.5">
                <button data-testid="revisar-caixa" data-id={f.id} onClick={() => onRevisar(f.id, "caixa")} className="flex-1 rounded-md border border-verde/40 bg-verde/10 py-1 text-[11px] font-semibold text-verde hover:bg-verde/20">
                  Caixa
                </button>
                <button data-testid="revisar-refugo" data-id={f.id} onClick={() => onRevisar(f.id, "refugo")} className="flex-1 rounded-md border border-vermelho/40 bg-vermelho/10 py-1 text-[11px] font-semibold text-vermelho hover:bg-vermelho/20">
                  Refugo
                </button>
              </div>
            </div>
          </article>
        ))}
        {itens && itens.length === 0 && <p className="py-6 text-center text-sm text-fraco">Nada para revisar agora.</p>}
      </div>
    </Cartao>
  );
}

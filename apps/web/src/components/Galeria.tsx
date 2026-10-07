import type { Destino as TipoDestino, Foto } from "@qi/contracts";
import type { Galeria as EstadoGaleria } from "../hooks/useGaleria.ts";
import { urlMiniatura } from "../services/api.ts";
import { numero, relogio } from "../utils/formatar.ts";
import { Aviso } from "./Aviso.tsx";
import { BarrasIa } from "./BarrasIa.tsx";
import { Cartao } from "./Cartao.tsx";
import { Destino } from "./Destino.tsx";

const ABAS: [TipoDestino | null, string][] = [
  ["refugo", "Refugo"],
  ["revisao", "Revisão"],
  ["caixa", "Caixa"],
  [null, "Todas"],
];

function CartaoFoto({ foto, miniatura }: { foto: Foto; miniatura: string }) {
  return (
    <article data-testid="foto" data-id={foto.id} data-destino={foto.destino} className="rounded-xl border border-borda bg-painel/60 p-2">
      <img data-testid="miniatura" src={miniatura} alt={`Foto da peça ${foto.peca}`} width={96} height={96} loading="lazy" className="foto aspect-square w-full rounded-lg bg-borda" />
      <div className="mt-2 flex items-center gap-1.5">
        <span className="font-mono text-[11px] font-semibold">{foto.peca}</span>
        <span className="ml-auto">
          <Destino destino={foto.destino} />
        </span>
      </div>
      <div className="mt-0.5 text-[10.5px] text-fraco">
        lote {foto.lote} · {relogio(foto.criada_em)}
        {foto.revisada_por ? ` · revisada por ${foto.revisada_por}` : ""}
      </div>
      <div className="mt-1.5">
        <BarrasIa ia={foto.ia} compacta />
      </div>
    </article>
  );
}

/** A galeria de fotos com abas por destino e "Carregar mais". */
export function Galeria({ galeria, destino, onDestino }: { galeria: EstadoGaleria; destino: TipoDestino | null; onDestino: (d: TipoDestino | null) => void }) {
  const { itens, total, origem, carregando, erro, recarregar, carregarMais } = galeria;
  const abas = (
    <div className="flex rounded-lg border border-borda p-0.5 text-xs">
      {ABAS.map(([d, nome]) => (
        <button key={nome} data-testid={`aba-${d ?? "todas"}`} aria-pressed={destino === d} onClick={() => onDestino(d)} className={`rounded-md px-2.5 py-1 font-medium ${destino === d ? "bg-turquesa/15 text-turquesa" : "text-fraco hover:text-texto"}`}>
          {nome}
        </button>
      ))}
    </div>
  );
  return (
    <Cartao titulo="Galeria de fotos" legenda={itens ? `${numero(itens.length, 0)} de ${numero(total, 0)} fotos` : "carregando…"} secao="galeria" origem={origem} acoes={abas}>
      {erro && <Aviso id="galeria" erro={erro} onTentar={recarregar} />}
      <div data-testid="galeria" data-total={total} className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
        {(itens ?? []).map((f) => (
          <CartaoFoto key={f.id} foto={f} miniatura={urlMiniatura(f, origem === "exemplo")} />
        ))}
        {!itens && Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-borda/60" />)}
      </div>
      {itens && itens.length === 0 && <p className="py-8 text-center text-sm text-fraco">Nenhuma foto com esse filtro.</p>}
      {itens && itens.length < total && (
        <button data-testid="carregar-mais" disabled={carregando} onClick={carregarMais} className="mt-3 w-full rounded-lg border border-borda py-2 text-xs font-semibold text-fraco hover:bg-borda/40 hover:text-texto disabled:opacity-50">
          {carregando ? "Carregando…" : `Carregar mais (${numero(total - itens.length, 0)} restantes)`}
        </button>
      )}
    </Cartao>
  );
}

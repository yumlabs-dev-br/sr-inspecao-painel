import { useState } from "react";
import type { Agrupamento, Destino } from "@qi/contracts";
import { AoVivo } from "./components/AoVivo.tsx";
import { Cabecalho } from "./components/Cabecalho.tsx";
import { Cartao } from "./components/Cartao.tsx";
import { FilaRevisao } from "./components/FilaRevisao.tsx";
import { Galeria } from "./components/Galeria.tsx";
import { Grafico } from "./components/Grafico.tsx";
import { Offline } from "./components/Offline.tsx";
import { SecaoKpis } from "./components/SecaoKpis.tsx";
import { useAoVivo } from "./hooks/useAoVivo.ts";
import { useFila } from "./hooks/useFila.ts";
import { useGaleria } from "./hooks/useGaleria.ts";
import { useMetricas } from "./hooks/useMetricas.ts";
import { useSeries } from "./hooks/useSeries.ts";

export function App() {
  const [lote, setLote] = useState<string | null>(null);
  const [destino, setDestino] = useState<Destino | null>("refugo");
  const [agrupar, setAgrupar] = useState<Agrupamento>("minuto");
  const aoVivo = useAoVivo();
  const metricas = useMetricas(lote);
  const series = useSeries({ agrupar, lote });
  const galeria = useGaleria({ destino, lote }, aoVivo);
  const fila = useFila(aoVivo);
  const lotes = metricas.dados?.lotes ?? [];

  const filtroLote = (
    <select data-testid="filtro-lote" value={lote ?? ""} onChange={(e) => setLote(e.target.value || null)} className="rounded-lg border border-borda bg-painel px-2 py-1 text-xs text-texto">
      <option value="">Todos os lotes</option>
      {lotes.map((l) => (
        <option key={l} value={l}>
          Lote {l}
        </option>
      ))}
    </select>
  );
  const botoesAgrupar = (
    <div className="flex rounded-lg border border-borda p-0.5 text-xs">
      {(
        [
          ["minuto", "Por minuto"],
          ["lote", "Por lote"],
        ] as const
      ).map(([a, nome]) => (
        <button key={a} data-testid={`agrupar-${a}`} aria-pressed={agrupar === a} onClick={() => setAgrupar(a)} className={`rounded-md px-2.5 py-1 font-medium ${agrupar === a ? "bg-turquesa/15 text-turquesa" : "text-fraco hover:text-texto"}`}>
          {nome}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-4 p-4 md:p-6">
      <Cabecalho turno={aoVivo.turno} segundos={aoVivo.segundos} conectado={aoVivo.conectado} aoVivo={aoVivo.origem === "api"} />
      <Offline />
      <SecaoKpis estado={metricas} acoes={filtroLote} />
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Galeria galeria={galeria} destino={destino} onDestino={setDestino} />
        </div>
        <div className="lg:col-span-4">
          <FilaRevisao fila={fila} erro={aoVivo.erro} onRevisar={aoVivo.revisar} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <Cartao titulo="Destino das peças" legenda={`${lote ? `lote ${lote}` : "todos os lotes"} · ${agrupar === "minuto" ? "por minuto do turno" : "por lote"}`} secao="grafico" origem={series.origem} acoes={botoesAgrupar} className="lg:col-span-8">
          {series.erro && <p className="mb-2 rounded-lg bg-vermelho/10 px-3 py-2 text-xs text-vermelho">Não foi possível atualizar o gráfico: {series.erro}</p>}
          <Grafico series={series.dados} />
        </Cartao>
        <div className="lg:col-span-4">
          <AoVivo ultimas={aoVivo.ultimas} origem={aoVivo.origem} />
        </div>
      </div>
      <footer className="pb-2 text-center text-[11px] text-fraco">Situação real do webforge · Inspeção visual: o painel de qualidade</footer>
    </div>
  );
}

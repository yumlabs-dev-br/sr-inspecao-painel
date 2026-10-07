import type { ReactNode } from "react";
import type { Metricas } from "@qi/contracts";
import type { Estado } from "../hooks/origem.ts";
import { numero, pontos, porcento, segundos } from "../utils/formatar.ts";
import { Aviso } from "./Aviso.tsx";
import { Cartao } from "./Cartao.tsx";

interface Kpi {
  id: string;
  titulo: string;
  valor: number | null;
  texto: string;
  legenda: string;
  cor: string;
  nivel: number;
}

function CartaoKpi({ kpi, carregando }: { kpi: Kpi; carregando: boolean }) {
  return (
    <div data-testid={`kpi-${kpi.id}`} data-valor={carregando ? "" : (kpi.valor ?? "")} className="relative overflow-hidden rounded-xl border border-borda bg-painel/60 p-4">
      <div className="text-xs font-medium text-fraco">{kpi.titulo}</div>
      {carregando ? <div className="mt-3 h-8 w-24 animate-pulse rounded-md bg-borda" /> : <div className="mt-2 text-[28px] leading-none font-semibold tracking-tight text-texto tabular-nums">{kpi.texto}</div>}
      <div className="mt-2 text-[11px] text-fraco">{kpi.legenda}</div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-borda">
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.round(Math.min(1, Math.max(0, kpi.nivel)) * 100)}%`, background: kpi.cor }} />
      </div>
    </div>
  );
}

/** Os quatro indicadores do turno (ou do lote filtrado). */
export function SecaoKpis({ estado, acoes }: { estado: Estado<Metricas>; acoes?: ReactNode }) {
  const { dados, origem, carregando, erro, recarregar } = estado;
  const m = dados;
  const kpis: Kpi[] = [
    { id: "prejuizo", titulo: "Prejuízo esperado", valor: m?.prejuizo_esperado ?? null, texto: pontos(m?.prejuizo_esperado), legenda: "trinca 40 · mancha 10 · boa no refugo 6 · revisão 3", cor: "#f87171", nivel: (m?.prejuizo_esperado ?? 0) / 500 },
    { id: "refugo", titulo: "Taxa de refugo", valor: m?.taxa_refugo_pct ?? null, texto: porcento(m?.taxa_refugo_pct), legenda: `${numero(m?.por_destino.refugo ?? 0, 0)} de ${numero(m?.fotos ?? 0, 0)} peças`, cor: "#fbbf24", nivel: (m?.taxa_refugo_pct ?? 0) / 40 },
    { id: "pendentes", titulo: "Revisões pendentes", valor: m?.revisoes_pendentes ?? null, texto: numero(m?.revisoes_pendentes ?? null, 0), legenda: "esperando o supervisor", cor: "#a78bfa", nivel: (m?.revisoes_pendentes ?? 0) / 60 },
    { id: "espera", titulo: "Espera da revisão", valor: m?.espera_revisao_media_s ?? null, texto: segundos(m?.espera_revisao_media_s), legenda: "da foto até o supervisor decidir", cor: "#2dd4bf", nivel: (m?.espera_revisao_media_s ?? 0) / 300 },
  ];
  return (
    <Cartao titulo="Indicadores do turno" legenda={m ? `${m.lote ? `lote ${m.lote}` : "todos os lotes"} · ${numero(m.fotos, 0)} peças · atualiza a cada 5 s` : "carregando…"} secao="kpis" origem={origem} acoes={acoes}>
      {erro && <Aviso id="kpis" erro={erro} onTentar={recarregar} />}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <CartaoKpi key={k.id} kpi={k} carregando={!dados || (carregando && origem === "exemplo" && !erro)} />
        ))}
      </div>
    </Cartao>
  );
}

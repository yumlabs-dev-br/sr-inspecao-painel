import type { ReactNode } from "react";
import type { Origem } from "../hooks/origem.ts";
import { Selo } from "./Selo.tsx";

/** Moldura das seções do painel: título, legenda, ações e o selo dos dados de exemplo. */
export function Cartao({ titulo, legenda, secao, origem, acoes, children, className = "" }: { titulo: string; legenda?: string; secao: string; origem: Origem; acoes?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section data-testid={`secao-${secao}`} className={`flex flex-col rounded-2xl border border-borda bg-cartao/80 p-4 shadow-[0_1px_0_0_rgb(255_255_255/0.03)_inset,0_20px_40px_-24px_rgb(0_0_0/0.6)] backdrop-blur ${className}`}>
      <header className="mb-3 flex flex-wrap items-start gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-texto">{titulo}</h2>
          {legenda && <p className="mt-0.5 text-xs text-fraco">{legenda}</p>}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {origem === "exemplo" && <Selo secao={secao} />}
          {acoes}
        </div>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

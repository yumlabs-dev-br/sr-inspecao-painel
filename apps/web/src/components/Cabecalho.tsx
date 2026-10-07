import { relogio } from "../utils/formatar.ts";

/** Marca da fábrica, o relógio do turno e o estado da conexão ao vivo. */
export function Cabecalho({ turno, segundos, conectado, aoVivo }: { turno: number; segundos: number; conectado: boolean; aoVivo: boolean }) {
  return (
    <header className="flex flex-wrap items-center gap-3">
      <img src="/icone.svg" alt="" className="size-10 rounded-xl" />
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Serra Azul Porcelanatos</h1>
        <p className="text-xs text-fraco">Qualidade da linha 3 · estação de inspeção visual · supervisor: Bruno</p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span
          data-testid="status-conexao"
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${aoVivo && conectado ? "border-verde/40 bg-verde/10 text-verde" : "border-borda bg-cartao text-fraco"}`}
        >
          <span className={`size-2 rounded-full ${aoVivo && conectado ? "animate-pulse bg-verde" : "bg-fraco"}`} />
          {aoVivo ? (conectado ? "Ao vivo" : "Reconectando…") : "Parado"}
        </span>
        <span data-testid="relogio" data-segundos={segundos} className="rounded-full border border-borda bg-cartao px-3 py-1 font-mono text-xs text-texto tabular-nums">
          turno {turno} · {relogio(segundos)}
        </span>
      </div>
    </header>
  );
}

import type { Foto } from "@qi/contracts";
import { chance } from "../utils/formatar.ts";

/** As duas chances da IA (trinca e mancha) em barrinhas. */
export function BarrasIa({ ia, compacta = false }: { ia: Foto["ia"]; compacta?: boolean }) {
  return (
    <div className={compacta ? "space-y-0.5" : "space-y-1"}>
      {(
        [
          ["trinca", ia.trinca, "#a78bfa"],
          ["mancha", ia.mancha, "#fbbf24"],
        ] as const
      ).map(([nome, v, cor]) => (
        <div key={nome} className="flex items-center gap-1.5 text-[10.5px] text-fraco">
          <span className="w-11">{nome}</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-borda">
            <span className="block h-full rounded-full" style={{ width: chance(v), background: cor }} />
          </span>
          <span className="w-8 text-right font-mono tabular-nums">{chance(v)}</span>
        </div>
      ))}
    </div>
  );
}

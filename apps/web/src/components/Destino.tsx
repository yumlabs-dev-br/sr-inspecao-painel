import type { Destino as TipoDestino } from "@qi/contracts";
import { NOME_DESTINO } from "../utils/formatar.ts";

const COR: Record<TipoDestino, string> = { caixa: "border-verde/40 bg-verde/10 text-verde", refugo: "border-vermelho/40 bg-vermelho/10 text-vermelho", revisao: "border-ambar/40 bg-ambar/10 text-ambar" };

export function Destino({ destino }: { destino: TipoDestino }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${COR[destino]}`}>{NOME_DESTINO[destino]}</span>;
}

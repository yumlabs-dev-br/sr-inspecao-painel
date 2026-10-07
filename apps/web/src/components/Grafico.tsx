import type { Series } from "@qi/contracts";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** Peças por destino (barras empilhadas), por minuto do turno ou por lote. */
export function Grafico({ series }: { series: Series | null }) {
  const pontos = series?.pontos ?? [];
  const refugo = pontos.reduce((s, p) => s + p.refugo, 0);
  return (
    <div data-testid="grafico" data-total-refugo={series ? refugo : ""} data-pontos={pontos.length} className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={pontos} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 4" />
          <XAxis dataKey="rotulo" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: "#121d22", border: "1px solid #1f3038", borderRadius: 8, fontSize: 12 }} cursor={{ fill: "rgb(255 255 255 / 0.04)" }} />
          <Bar dataKey="caixa" stackId="d" fill="#34d399" fillOpacity={0.75} name="caixa" />
          <Bar dataKey="revisao" stackId="d" fill="#fbbf24" fillOpacity={0.8} name="revisão" />
          <Bar dataKey="refugo" stackId="d" fill="#f87171" fillOpacity={0.85} name="refugo" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

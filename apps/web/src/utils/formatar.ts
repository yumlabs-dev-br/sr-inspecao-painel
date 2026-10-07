/** Números do painel em português (1 casa quando faz sentido). */
export const numero = (v: number | null | undefined, casas = 1) => (v === null || v === undefined ? "—" : v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }));
export const pontos = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${numero(v, 1)} pts`);
export const porcento = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${numero(v, 1)}%`);
export const segundos = (v: number | null | undefined) => (v === null || v === undefined ? "—" : v < 60 ? `${numero(v, 0)} s` : `${Math.floor(v / 60)} min ${Math.round(v % 60)} s`);
/** 0 a 1 → "23%". */
export const chance = (v: number) => `${Math.round(v * 100)}%`;
/** Segundos do turno → "07:35". */
export const relogio = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
export const NOME_DESTINO = { caixa: "Caixa", refugo: "Refugo", revisao: "Revisão" } as const;

export type Verdade = "boa" | "trinca" | "mancha";
export type Destino = "caixa" | "refugo" | "revisao";
export interface Peca {
  n: number;
  codigo: string;
  lote: string;
  verdade: Verdade;
  ia: { trinca: number; mancha: number };
  foto: Uint8Array;
}
export const PECAS: number;
export const PASSO_S: number;
export const LOTE: number;
export const CUSTO: { trinca: number; mancha: number; boa: number; revisao: number; relatorio: number };
export function pecasDoPeriodo(semente: number): Peca[];
export function prejuizo(ia: { trinca: number; mancha: number }, destino: Destino): number;
export function melhorDestino(ia: { trinca: number; mancha: number }, comRevisao: boolean): Destino;
export function rotuloTempo(k: number): string;
export function mulberry32(seed: number): () => number;

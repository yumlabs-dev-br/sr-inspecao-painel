import type { Destino } from "@qi/contracts";
import { ErroHttp } from "../dados/operacao.ts";

/** Inteiro vindo da query string (?pagina=2), com padrão (ou 400). */
export function inteiroDaQuery(valor: unknown, campo: string, padrao: number, min: number, max: number): number {
  if (valor === undefined) return padrao;
  const n = Number(valor);
  if (typeof valor !== "string" || valor.trim() === "" || !Number.isInteger(n) || n < min || n > max) throw new ErroHttp(400, `${campo} deve ser um inteiro de ${min} a ${max}`);
  return n;
}

/** ?destino= (opcional) — "caixa", "refugo" ou "revisao" (ou 400). */
export function destinoDaQuery(valor: unknown): Destino | null {
  if (valor === undefined) return null;
  if (valor === "caixa" || valor === "refugo" || valor === "revisao") return valor;
  throw new ErroHttp(400, 'destino deve ser "caixa", "refugo" ou "revisao"');
}

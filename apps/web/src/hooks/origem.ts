/** De onde vêm os dados de uma seção do painel. */
export type Origem = "exemplo" | "api";

export interface Estado<T> {
  /** null enquanto a primeira resposta não chega. */
  dados: T | null;
  origem: Origem;
  carregando: boolean;
  erro: string | null;
  recarregar: () => void;
}

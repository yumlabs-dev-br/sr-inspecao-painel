/** Aviso de que a seção ainda mostra dados estáticos (some quando a seção vem da API). */
export function Selo({ secao }: { secao: string }) {
  return (
    <span data-testid="selo-exemplo" data-secao={secao} className="inline-flex items-center gap-1.5 rounded-full border border-ambar/40 bg-ambar/10 px-2 py-0.5 text-[10.5px] font-semibold tracking-wide text-ambar uppercase">
      <span className="size-1.5 rounded-full bg-ambar" />
      Dados de exemplo
    </span>
  );
}

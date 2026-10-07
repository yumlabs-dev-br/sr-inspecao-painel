/** Faixa de erro com o botão "Tentar de novo". */
export function Aviso({ id, erro, onTentar }: { id: string; erro: string; onTentar?: () => void }) {
  return (
    <div data-testid={`erro-${id}`} role="alert" className="mb-3 flex items-center gap-3 rounded-lg border border-vermelho/30 bg-vermelho/10 px-3 py-2 text-xs text-vermelho">
      <span className="font-semibold">Não foi possível atualizar:</span>
      <span className="min-w-0 flex-1 truncate">{erro}</span>
      {onTentar && (
        <button data-testid={`tentar-${id}`} onClick={onTentar} className="rounded-md border border-vermelho/40 px-2 py-1 font-semibold hover:bg-vermelho/15">
          Tentar de novo
        </button>
      )}
    </div>
  );
}

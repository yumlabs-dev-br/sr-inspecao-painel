import { useEffect, useState } from "react";

/** Sem internet: o painel continua abrindo (service worker) com os últimos dados guardados. */
export function Offline() {
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);
  useEffect(() => {
    const atualizar = () => setOffline(!navigator.onLine);
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
    };
  }, []);
  if (!offline) return null;
  return (
    <div data-testid="offline" role="status" className="rounded-xl border border-ambar/40 bg-ambar/10 px-4 py-2 text-sm text-ambar">
      <b>Sem conexão.</b> Mostrando os últimos dados guardados neste aparelho — a fila e o ao vivo voltam quando a rede voltar.
    </div>
  );
}

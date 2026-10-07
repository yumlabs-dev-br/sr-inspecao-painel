// Service worker do painel — Etapa 4: o painel abre sem internet com os últimos dados guardados.
//
// TODO Etapa 4:
//   - "install": guarde a casca no cache (caches.open(VERSAO) e cache.addAll(["/", "/index.html", …]))
//     e chame self.skipWaiting()
//   - "activate": apague os caches de versões antigas e chame self.clients.claim()
//     (sem o claim, a página só passa a ser controlada no próximo carregamento)
//   - "fetch" (só GET do mesmo site):
//       navegação (e.request.mode === "navigate") → rede; sem rede, o /index.html guardado
//       /assets/… e …/miniatura → cache primeiro (nunca mudam)
//       /api/… (menos /api/ao-vivo) → rede primeiro, guardando a resposta; sem rede, a guardada
//
// Para ver funcionando: npm start (o service worker só é registrado no build), abra o painel,
// recarregue e, nas DevTools (Application → Service Workers), marque "Offline".

const VERSAO = "qualidade-v1";
void VERSAO;

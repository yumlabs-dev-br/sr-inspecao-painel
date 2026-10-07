# Arquitetura

Monorepo com **npm workspaces**: a API, o painel e o contrato entre os dois,
no mesmo repositório e com uma versão só.

```
apps/
  api/        Express + TypeScript — a linha roda aqui dentro e a API expõe os dados
    src/simulador/   a estação: uma peça a cada 5 s do turno (fornecido: não precisa mexer)
    src/dados/       Operacao: as fotos, o destino de cada uma, as revisões (as contas prontas)
    src/imagem/      miniatura(): reduz o PNG da câmera (pronta)
    src/routes/      /api/fotos · /api/metricas · /api/series · WebSocket /api/ao-vivo
  web/        React + Vite + Tailwind + Recharts — o painel
    public/          sw.js (service worker), ícones, exemplo/ (fotos de exemplo)
    src/components/  galeria, fila de revisão, cartões, gráfico (prontos)
    src/hooks/       useGaleria · useMetricas · useSeries · useAoVivo · useFila  ← você liga aqui
    src/services/    api.ts: o cliente HTTP e WebSocket da API                    ← e aqui
    src/mocks/       os dados de exemplo (saem de cena na Etapa 4)
packages/
  contracts/  os tipos da API e das mensagens do WebSocket, usados pelos dois lados
```

## O caminho de um dado

```
Estacao (simulação) → Operacao → rota /api/... ou WebSocket → services/api.ts
                                                            → hook (estado, erro, recarregar)
                                                            → componente
```

- **Componentes não buscam dados.** Eles recebem o que desenhar. Quem busca é o
  hook, e quem fala HTTP e WebSocket é o `services/api.ts`.
- **Um contrato, dois lados.** `@qi/contracts` define `Foto`, `Metricas`,
  `Series` e as mensagens do WebSocket. Se a API mudar um campo, o
  `npm run typecheck` acusa no painel.
- **Imagens leves.** A galeria nunca baixa a foto inteira: usa a miniatura, que
  nunca muda e por isso pode ficar em cache para sempre (`immutable`).
- **Tempo real nos dois sentidos.** O WebSocket fica aberto: a API empurra cada
  foto nova e cada revisão, e o painel manda a revisão do supervisor pela mesma
  conexão. Se duas pessoas revisam a mesma peça, só a primeira vale; a segunda
  recebe `{"tipo": "erro"}`.
- **Offline primeiro para o que não muda.** O service worker guarda a casca do
  painel e as miniaturas (cache primeiro) e as respostas de `/api` (rede
  primeiro, com a última guardada quando não há rede).

## Em desenvolvimento e em produção

- `npm run dev` sobe a API (porta 3001) e o Vite (porta 5173); o Vite repassa
  `/api` — inclusive o WebSocket — para a API, então o painel chama sempre
  `/api/...` (sem CORS).
- `npm start` compila o painel e sobe só a API, que também serve o painel
  compilado — uma porta, uma origem. É assim que a central testa, e é só no
  build que o service worker é registrado.

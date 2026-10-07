# Contrato da API

Os tipos estão em [`packages/contracts/src/index.ts`](../packages/contracts/src/index.ts).
Erros respondem `{"erro": "mensagem"}` com o status HTTP certo.

| Rota | Etapa | Resposta |
|---|---|---|
| `GET /api/saude` | — | `{"ok": true}` |
| `GET /api/fotos?destino=&lote=&pagina=1&por_pagina=12` | 1 (pronta na API) | `PaginaFotos` (as mais antigas primeiro) |
| `GET /api/fotos/:id` | — (pronta) | `Foto` (404 se não existe) |
| `GET /api/fotos/:id/arquivo` | — (pronta) | o PNG da câmera (64 × 64) |
| `GET /api/fotos/:id/miniatura` | 1 | PNG 24 × 24, `Cache-Control: public, max-age=31536000, immutable` |
| `GET /api/metricas?lote=` | 2 (pronta na API) | `Metricas` (404 se o lote não existe) |
| `GET /api/series?agrupar=minuto\|lote&lote=` | 2 | `Series` (400 se `agrupar` ou `lote` forem inválidos; 404 se o lote não existe) |
| WebSocket `/api/ao-vivo` | 3 | as mensagens abaixo |

Lotes têm o formato `L7-2` (`/^L\d+-\d+$/`): 60 peças cada, 3 por turno.

## WebSocket `/api/ao-vivo`

Cada mensagem é um JSON. Da API para o painel (`MensagemServidor`):

```json
{"tipo": "ola", "turno": 1, "segundos": 295}             // ao conectar
{"tipo": "foto", "foto": { ...Foto }}                    // a cada peça nova, para todos
{"tipo": "revisada", "foto": { ...Foto }}                // alguém revisou, para todos
{"tipo": "erro", "mensagem": "a foto P-7042 já foi revisada por ana"} // só para quem mandou
```

Do painel para a API (`MensagemCliente`):

```json
{"tipo": "revisar", "id": "P-7042", "destino": "refugo", "supervisor": "bruno"}
```

No navegador: `new WebSocket("ws://" + location.host + "/api/ao-vivo")`,
`ws.onmessage = (e) => JSON.parse(e.data)` e `ws.send(JSON.stringify(...))`.

## Variáveis de ambiente da API

| Variável | Padrão | Para quê |
|---|---|---|
| `PORT` | 3001 | porta da API |
| `SIMULACAO_SEMENTE` | 7 | o sorteio das peças (a central usa outra) |
| `SIMULACAO_RITMO_MS` | 2000 | milissegundos por peça (5 s do turno) |
| `SIMULACAO_REPETIR` | 1 | `0` para parar no fim do primeiro turno |

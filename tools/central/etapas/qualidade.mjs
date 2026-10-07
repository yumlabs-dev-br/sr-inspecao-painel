// Situação "Inspeção visual: o painel de qualidade" — as checagens de cada etapa.
//
// Sobe o monorepo do aluno (npm start: compila o painel e sobe a API, que
// serve o painel e roda a estação), refaz aqui a MESMA simulação (mesma
// semente, mesma decisão) para saber os números certos, e confere com um
// navegador de verdade (Playwright) o que o painel mostra.

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pedir, subirServidor } from "../http.mjs";
import { CUSTO, melhorDestino, PASSO_S, pecasDoPeriodo } from "../inspecao/modelo.mjs";

const SEMENTE = 11;
const umaCasa = (v) => Math.round(v * 10) / 10;
const objeto = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const resumoResposta = (r) => (r.erro ? r.erro : `${r.status}${r.corpo ? ` ${r.corpo.slice(0, 160)}` : ""}`);
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function relatorio() {
  const checagens = [];
  return {
    checagens,
    checar(nome, ok, detalhe = "") {
      checagens.push({ nome, ok: !!ok, detalhe: ok ? "" : detalhe });
      return !!ok;
    },
  };
}

// ─── O que o painel deveria mostrar (a mesma conta da API de referência) ─────

function operacaoEsperada(semente) {
  const fotos = pecasDoPeriodo(semente).map((p) => ({ id: p.codigo, peca: p.codigo, lote: p.lote, ia: p.ia, destino: melhorDestino(p.ia, true), criada_em: p.n * PASSO_S, revisada_em: null }));
  const prej = (f) => (f.revisada_em !== null || f.destino === "revisao" ? CUSTO.revisao : f.destino === "caixa" ? f.ia.trinca * CUSTO.trinca + f.ia.mancha * CUSTO.mancha : (1 - f.ia.trinca - f.ia.mancha) * CUSTO.boa);
  const lotes = [...new Set(fotos.map((f) => f.lote))];
  const filtrar = ({ destino = null, lote = null } = {}) => fotos.filter((f) => (!destino || f.destino === destino) && (!lote || f.lote === lote));
  const metricas = (lote = null) => {
    const fs = filtrar({ lote });
    const conta = (d) => fs.filter((f) => f.destino === d).length;
    return { fotos: fs.length, por_destino: { caixa: conta("caixa"), refugo: conta("refugo"), revisao: conta("revisao") }, taxa_refugo_pct: fs.length ? umaCasa((conta("refugo") / fs.length) * 100) : 0, prejuizo_esperado: umaCasa(fs.reduce((s, f) => s + prej(f), 0)), revisoes_pendentes: conta("revisao"), lotes };
  };
  const series = (agrupar = "minuto", lote = null) => {
    const grupos = new Map();
    for (const f of filtrar({ lote })) {
      const k = agrupar === "lote" ? f.lote : `${String(Math.floor(f.criada_em / 60)).padStart(2, "0")} min`;
      grupos.set(k, [...(grupos.get(k) ?? []), f]);
    }
    return { agrupar, lote, pontos: [...grupos.entries()].map(([rotulo, g]) => ({ rotulo, caixa: g.filter((f) => f.destino === "caixa").length, refugo: g.filter((f) => f.destino === "refugo").length, revisao: g.filter((f) => f.destino === "revisao").length, prejuizo: umaCasa(g.reduce((s, f) => s + prej(f), 0)) })) };
  };
  return { fotos, lotes, filtrar, metricas, series };
}

// ─── Subir o painel e abrir o navegador ──────────────────────────────────────

async function subirPainel(pasta, env) {
  return subirServidor({ pasta, env: { SIMULACAO_SEMENTE: String(SEMENTE), ...env }, prontoEm: "/api/saude", limiteMs: 240000 });
}

/** Espera o turno congelado terminar (ritmo rápido, sem repetir). */
async function esperarFimDoTurno(base) {
  for (let i = 0; i < 160; i++) {
    const r = await pedir(base, { caminho: "/api/metricas" });
    if (r.json?.segundos === 895 && r.json?.fotos === 180) return true;
    await esperar(250);
  }
  return false;
}

async function navegador() {
  let pw;
  try {
    pw = await import("playwright");
  } catch {
    throw new Error("O Playwright não está instalado. Rode: npm install && npx playwright install chromium");
  }
  try {
    return await pw.chromium.launch();
  } catch (e) {
    throw new Error(`Não consegui abrir o Chromium do Playwright (rode: npx playwright install chromium).\n${e instanceof Error ? e.message.split("\n")[0] : e}`);
  }
}

/** Espera um atributo chegar a um valor (o painel atualiza sozinho). */
async function esperarAtributo(pg, seletor, atributo, esperado, ms = 12000) {
  const fim = Date.now() + ms;
  let ultimo = null;
  while (Date.now() < fim) {
    ultimo = await pg.locator(seletor).first().getAttribute(atributo, { timeout: 1000 }).catch(() => null);
    if (ultimo === String(esperado)) return { ok: true, ultimo };
    await pg.waitForTimeout(250);
  }
  return { ok: false, ultimo };
}

/** Os ids dos cartões da galeria (espera até a quantidade bater). */
async function idsDaGaleria(pg, quantos, ms = 10000) {
  const fim = Date.now() + ms;
  let ids = [];
  while (Date.now() < fim) {
    ids = await pg.locator('[data-testid="foto"]').evaluateAll((els) => els.map((e) => e.getAttribute("data-id")));
    if (ids.length === quantos) return ids;
    await pg.waitForTimeout(250);
  }
  return ids;
}

const selos = (pg, secoes) => pg.locator(secoes.map((s) => `[data-testid="selo-exemplo"][data-secao="${s}"]`).join(", ")).count();

// ─── Etapa 1: a galeria do refugo ────────────────────────────────────────────

export async function etapa1({ pasta }) {
  const { checagens, checar } = relatorio();
  const s = await subirPainel(pasta, { SIMULACAO_RITMO_MS: "5", SIMULACAO_REPETIR: "0" });
  const b = await navegador();
  try {
    checar("A estação mandou o turno inteiro", await esperarFimDoTurno(s.base), "GET /api/metricas não chegou ao fim do turno (180 fotos, segundos 895).");
    const op = operacaoEsperada(SEMENTE);
    const refugo = op.filtrar({ destino: "refugo" });

    const rm = await pedir(s.base, { caminho: `/api/fotos/${refugo[0].id}/miniatura`, binario: true });
    const png = rm.bytes && rm.bytes[0] === 0x89 && rm.bytes[1] === 0x50;
    checar("GET /api/fotos/{id}/miniatura → PNG pequeno", rm.status === 200 && (rm.cabecalhos["content-type"] ?? "").startsWith("image/png") && png && rm.bytes.length < 4000, `esperava 200 com um PNG de menos de 4 KB (a foto tem ${pecasDoPeriodo(SEMENTE)[0].foto.length} bytes); veio ${rm.status} ${rm.cabecalhos["content-type"] ?? ""} (${rm.bytes?.length ?? 0} bytes) — use miniatura(bytes) de imagem/miniatura.ts`);
    const cc = rm.cabecalhos["cache-control"] ?? "";
    const idade = Number(/max-age=(\d+)/.exec(cc)?.[1] ?? 0);
    checar("A miniatura pode ficar em cache para sempre (Cache-Control)", /immutable/.test(cc) && idade >= 86400, `esperava Cache-Control com max-age de pelo menos 1 dia e immutable (a miniatura de uma foto nunca muda); veio "${cc || "nenhum"}"`);

    const pg = await b.newPage();
    const pedidos = [];
    pg.on("request", (r) => pedidos.push(r.url()));
    await pg.goto(s.base + "/", { waitUntil: "domcontentloaded" });
    const primeira = refugo.slice(0, 12).map((f) => f.id);
    const ids = await idsDaGaleria(pg, primeira.length);
    checar("O painel pediu GET /api/fotos?destino=refugo", pedidos.some((u) => /\/api\/fotos\?.*destino=refugo/.test(u)), "nenhuma requisição para /api/fotos com destino=refugo saiu do navegador — services/api.ts (buscarFotos) e hooks/useGaleria.ts");
    if (checar("A galeria mostra as 12 primeiras fotos do refugo, na ordem da API", igual(ids, primeira), `esperava ${primeira.join(", ")}; o painel mostra ${ids.join(", ") || "nada"} (ainda são os dados de exemplo?)`)) {
      const minis = await pg.locator('[data-testid="miniatura"]').evaluateAll((els) => els.map((e) => ({ src: e.getAttribute("src") ?? "", ok: e.complete && e.naturalWidth > 0 })));
      checar("Cada cartão carrega a miniatura da API", minis.length === 12 && minis.every((m) => /\/api\/fotos\/[^/]+\/miniatura/.test(m.src)), `as imagens apontam para ${minis[0]?.src ?? "nada"} — use urlMiniatura(foto)`);
    }
    checar('Sem o selo "Dados de exemplo" na galeria', (await selos(pg, ["galeria"])) === 0, 'a galeria ainda diz que mostra dados de exemplo — o hook deve marcar origem "api"');

    if (refugo.length > 12) {
      const pedidoMais = pg.waitForRequest((r) => /\/api\/fotos\?.*pagina=2/.test(r.url()), { timeout: 6000 }).then(() => true).catch(() => false);
      await pg.locator('[data-testid="carregar-mais"]').click({ timeout: 4000 }).catch(() => {});
      checar('"Carregar mais" pede a página 2', await pedidoMais, 'clicar em "Carregar mais" não gerou GET /api/fotos?…pagina=2');
      const todos = refugo.slice(0, 24).map((f) => f.id);
      const ids2 = await idsDaGaleria(pg, todos.length, 6000);
      checar("E junta a página 2 no fim da galeria", igual(ids2, todos), `esperava ${todos.length} fotos (as 12 de antes e mais ${todos.length - 12}); o painel mostra ${ids2.length}`);
    }
    const pedidoAba = pg.waitForRequest((r) => /\/api\/fotos\?.*destino=revisao/.test(r.url()), { timeout: 6000 }).then(() => true).catch(() => false);
    await pg.locator('[data-testid="aba-revisao"]').click({ timeout: 4000 }).catch(() => {});
    checar('A aba "Revisão" pede GET /api/fotos?destino=revisao', await pedidoAba, "trocar de aba não gerou a requisição com destino=revisao (o hook deve buscar de novo quando o filtro muda)");
    const rev = op.filtrar({ destino: "revisao" }).slice(0, 12).map((f) => f.id);
    const idsRev = await idsDaGaleria(pg, rev.length, 6000);
    checar("E a galeria passa a mostrar as fotos em revisão", igual(idsRev, rev), `esperava ${rev.slice(0, 3).join(", ")}…; o painel mostra ${idsRev.slice(0, 3).join(", ") || "nada"}`);

    // A API fora do ar: o painel avisa e deixa tentar de novo.
    const pg2 = await b.newPage();
    await pg2.route("**/api/fotos?**", (rota) => rota.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ erro: "câmera em manutenção" }) }));
    await pg2.goto(s.base + "/", { waitUntil: "domcontentloaded" });
    const aviso = await pg2.locator('[data-testid="erro-galeria"]').first().waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
    if (checar("API fora do ar (503): a galeria mostra o erro", aviso, "com /api/fotos respondendo 503, nenhum aviso apareceu — trate o status (não só a falta de rede) em obter() e preencha erro no hook")) {
      checar("A mensagem do erro vem da API", ((await pg2.locator('[data-testid="erro-galeria"]').first().textContent()) ?? "").includes("câmera em manutenção"), 'use o "erro" que a API devolve no corpo');
      await pg2.unroute("**/api/fotos?**");
      await pg2.locator('[data-testid="tentar-galeria"]').first().click();
      const volta = await idsDaGaleria(pg2, 12, 8000);
      checar('"Tentar de novo" busca outra vez', igual(volta, primeira), "depois de clicar em Tentar de novo, as fotos não voltaram (recarregar() deve disparar a busca)");
    }
  } finally {
    await b.close();
    await s.parar();
  }
  const ok = checagens.filter((c) => c.ok).length;
  return { passou: ok === checagens.length, resumo: `${ok}/${checagens.length} checagens da galeria`, checagens };
}

// ─── Etapa 2: indicadores e gráfico com filtro de lote ───────────────────────

const KPIS = [
  ["prejuizo", "prejuizo_esperado"],
  ["refugo", "taxa_refugo_pct"],
  ["pendentes", "revisoes_pendentes"],
];

export async function etapa2({ pasta }) {
  const { checagens, checar } = relatorio();
  const s = await subirPainel(pasta, { SIMULACAO_RITMO_MS: "5", SIMULACAO_REPETIR: "0" });
  const b = await navegador();
  try {
    checar("A estação mandou o turno inteiro", await esperarFimDoTurno(s.base), "GET /api/metricas não chegou ao fim do turno.");
    const op = operacaoEsperada(SEMENTE);
    const lote = op.lotes[1];
    for (const [nome, q, esperado] of [
      ["GET /api/series (padrão: por minuto, todos os lotes)", "", op.series("minuto", null)],
      ["GET /api/series?agrupar=lote", "?agrupar=lote", op.series("lote", null)],
      [`GET /api/series?lote=${lote}`, `?lote=${lote}`, op.series("minuto", lote)],
    ]) {
      const r = await pedir(s.base, { caminho: `/api/series${q}` });
      checar(nome, r.status === 200 && igual(r.json, esperado), `esperava ${JSON.stringify(esperado).slice(0, 200)}…; veio ${resumoResposta(r)}`);
    }
    for (const [q, status] of [
      ["agrupar=hora", 400],
      ["lote=terceiro", 400],
      [`lote=L${SEMENTE}-9`, 404],
    ]) {
      const r = await pedir(s.base, { caminho: `/api/series?${q}` });
      checar(`GET /api/series?${q} → ${status} {erro}`, r.status === status && typeof r.json?.erro === "string", `esperava ${status} com {"erro": ...}; veio ${resumoResposta(r)}`);
    }

    const pg = await b.newPage();
    await pg.goto(s.base + "/", { waitUntil: "domcontentloaded" });
    const m = op.metricas(null);
    const r1 = await esperarAtributo(pg, '[data-testid="kpi-prejuizo"]', "data-valor", m.prejuizo_esperado);
    if (checar(`Prejuízo esperado no painel = ${m.prejuizo_esperado}`, r1.ok, `o cartão mostra ${r1.ultimo === "" || r1.ultimo === null ? "nada" : r1.ultimo} (ainda são os dados de exemplo?)`)) {
      for (const [id, campo] of KPIS.slice(1)) {
        const v = await pg.locator(`[data-testid="kpi-${id}"]`).first().getAttribute("data-valor");
        checar(`${campo} no painel = ${m[campo]}`, v === String(m[campo]), `o cartão mostra ${v}`);
      }
    }
    const somaRefugo = (sr) => sr.pontos.reduce((a, p) => a + p.refugo, 0);
    const g = await esperarAtributo(pg, '[data-testid="grafico"]', "data-total-refugo", somaRefugo(op.series("minuto", null)));
    checar("O gráfico mostra os dados da API", g.ok, `o gráfico soma ${g.ultimo} peças no refugo; pela API seriam ${somaRefugo(op.series("minuto", null))}`);
    checar('Sem o selo "Dados de exemplo" nos indicadores e no gráfico', (await selos(pg, ["kpis", "grafico"])) === 0, "os indicadores ou o gráfico ainda dizem que mostram dados de exemplo");

    const pedidoMetricas = pg.waitForRequest((r) => r.url().includes(`/api/metricas?lote=${lote}`), { timeout: 8000 }).then(() => true).catch(() => false);
    const pedidoSeries = pg.waitForRequest((r) => /\/api\/series\?/.test(r.url()) && r.url().includes(`lote=${lote}`), { timeout: 8000 }).then(() => true).catch(() => false);
    await pg.locator('[data-testid="filtro-lote"]').selectOption(lote).catch(() => {});
    checar(`Filtrar o lote ${lote} pede GET /api/metricas?lote=${lote}`, await pedidoMetricas, "trocar o lote não gerou a requisição de métricas com ?lote= (o hook deve buscar de novo quando o filtro muda)");
    checar(`… e GET /api/series com lote=${lote}`, await pedidoSeries, "trocar o lote não gerou a requisição de séries com lote=");
    const ml = op.metricas(lote);
    const rl = await esperarAtributo(pg, '[data-testid="kpi-prejuizo"]', "data-valor", ml.prejuizo_esperado, 8000);
    checar(`O prejuízo passa a ser o do lote (${ml.prejuizo_esperado})`, rl.ok, `o cartão mostra ${rl.ultimo}`);
    const pedidoAgrupar = pg.waitForRequest((r) => /\/api\/series\?.*agrupar=lote/.test(r.url()), { timeout: 8000 }).then(() => true).catch(() => false);
    await pg.locator('[data-testid="agrupar-lote"]').click().catch(() => {});
    checar('"Por lote" pede …agrupar=lote', await pedidoAgrupar, 'clicar em "Por lote" não gerou a requisição com agrupar=lote');

    const pg2 = await b.newPage();
    await pg2.route("**/api/metricas**", (rota) => rota.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ erro: "banco em manutenção" }) }));
    await pg2.goto(s.base + "/", { waitUntil: "domcontentloaded" });
    const aviso = await pg2.locator('[data-testid="erro-kpis"]').first().waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
    checar("API fora do ar (503): os indicadores mostram o erro da API", aviso && ((await pg2.locator('[data-testid="erro-kpis"]').first().textContent()) ?? "").includes("banco em manutenção"), 'com /api/metricas respondendo 503, o aviso com a mensagem da API ("banco em manutenção") não apareceu');
  } finally {
    await b.close();
    await s.parar();
  }
  const ok = checagens.filter((c) => c.ok).length;
  return { passou: ok === checagens.length, resumo: `${ok}/${checagens.length} checagens dos indicadores e do gráfico`, checagens };
}

// ─── Etapa 3: ao vivo por WebSocket (nos dois sentidos) ──────────────────────

/** Um cliente WebSocket que guarda as mensagens que chegam. */
function abrirWs(url) {
  return new Promise((resolve) => {
    const msgs = [];
    let ws;
    try {
      ws = new WebSocket(url);
    } catch (e) {
      return resolve({ erro: String(e) });
    }
    const timer = setTimeout(() => resolve({ erro: "a conexão não abriu em 5 s" }), 5000);
    ws.onmessage = (e) => {
      try {
        msgs.push(JSON.parse(String(e.data)));
      } catch {
        msgs.push({ tipo: "(não é JSON)", texto: String(e.data).slice(0, 80) });
      }
    };
    ws.onerror = () => {
      clearTimeout(timer);
      resolve({ erro: "a conexão foi recusada (o servidor aceita WebSocket em /api/ao-vivo?)" });
    };
    ws.onopen = () => {
      clearTimeout(timer);
      resolve({ ws, msgs });
    };
  });
}
async function esperarMensagem(msgs, filtro, ms = 4000) {
  const fim = Date.now() + ms;
  while (Date.now() < fim) {
    const m = msgs.find(filtro);
    if (m) return m;
    await esperar(50);
  }
  return null;
}

export async function etapa3({ pasta }) {
  const { checagens, checar } = relatorio();
  const s = await subirPainel(pasta, { SIMULACAO_RITMO_MS: "250", SIMULACAO_REPETIR: "1" });
  const b = await navegador();
  try {
    const url = s.base.replace(/^http/, "ws") + "/api/ao-vivo";
    const c = await abrirWs(url);
    if (!checar("WebSocket em /api/ao-vivo aceita a conexão", !c.erro, c.erro)) return fim();
    const ola = await esperarMensagem(c.msgs, (m) => m.tipo === "ola", 3000);
    checar('A primeira mensagem é {"tipo": "ola", turno, segundos}', ola && Number.isInteger(ola.turno) && Number.isInteger(ola.segundos), `chegou ${JSON.stringify(c.msgs[0] ?? null)?.slice(0, 160)}`);
    await esperar(1200);
    const fotos = c.msgs.filter((m) => m.tipo === "foto");
    if (checar('Cada peça nova chega como {"tipo": "foto", foto}', fotos.length >= 3, `em 1,2 s (uma peça a cada 250 ms) chegaram ${fotos.length} mensagens "foto" — a API manda para todos os clientes quando a estação emite "foto"`)) {
      checar("As fotos chegam na ordem do turno", fotos.every((m, i) => typeof m.foto?.id === "string" && (i === 0 || m.foto.criada_em > fotos[i - 1].foto.criada_em || m.foto.criada_em === 0)), `os segundos chegaram assim: ${fotos.map((m) => m.foto?.criada_em).join(", ")}`);
    }
    c.ws.send(JSON.stringify({ tipo: "voar" }));
    const erro1 = await esperarMensagem(c.msgs, (m) => m.tipo === "erro", 3000);
    checar('Mensagem desconhecida → {"tipo": "erro", mensagem}', erro1 && typeof erro1.mensagem === "string", "mandei {\"tipo\": \"voar\"} e nenhum erro voltou (responda só para quem mandou)");

    // A revisão pelo WebSocket vale para todos.
    const fila = await pedir(s.base, { caminho: "/api/fotos?destino=revisao&por_pagina=5" });
    const alvo = fila.json?.itens?.[0];
    if (checar("Há fotos esperando revisão", alvo, `GET /api/fotos?destino=revisao veio ${resumoResposta(fila)}`)) {
      const c2 = await abrirWs(url);
      c.ws.send(JSON.stringify({ tipo: "revisar", id: alvo.id, destino: "caixa", supervisor: "central" }));
      const outro = c2.msgs ? await esperarMensagem(c2.msgs, (m) => m.tipo === "revisada" && m.foto?.id === alvo.id, 3000) : null;
      checar('A revisão chega a TODOS os painéis: {"tipo": "revisada", foto}', outro && outro.foto.destino === "caixa" && outro.foto.revisada_por === "central", `um segundo cliente não recebeu a foto ${alvo.id} revisada — mande a "revisada" para todos os clientes conectados`);
      const r = await pedir(s.base, { caminho: `/api/fotos/${alvo.id}` });
      checar("E a API guarda a revisão", r.json?.destino === "caixa" && r.json?.revisada_por === "central", `GET /api/fotos/${alvo.id} veio ${resumoResposta(r)}`);
      const nErros = c.msgs.filter((m) => m.tipo === "erro").length;
      c.ws.send(JSON.stringify({ tipo: "revisar", id: alvo.id, destino: "refugo", supervisor: "central" }));
      await esperar(600);
      checar("Revisar de novo a mesma foto → erro (só para quem mandou)", c.msgs.filter((m) => m.tipo === "erro").length === nErros + 1 && !(c2.msgs ?? []).some((m) => m.tipo === "erro"), "a segunda revisão da mesma foto deveria voltar {\"tipo\": \"erro\"} só para quem a mandou");
      c2.ws?.close();
    }
    c.ws.close();

    // Dois painéis abertos: o feed se mexe sozinho e a revisão de um aparece no outro.
    const pa = await b.newPage();
    const pb = await b.newPage();
    const polling = [];
    await pa.goto(s.base + "/", { waitUntil: "domcontentloaded" });
    await pb.goto(s.base + "/", { waitUntil: "domcontentloaded" });
    await pa.waitForTimeout(2500);
    pa.on("request", (r) => /\/api\/fotos\?/.test(r.url()) && polling.push(r.url()));
    const vistos = new Set();
    for (let i = 0; i < 12; i++) {
      vistos.add(await pa.locator('[data-testid="feed"]').first().getAttribute("data-ultima-peca").catch(() => null));
      await pa.waitForTimeout(250);
    }
    vistos.delete(null);
    vistos.delete("");
    checar("O feed do painel se mexe sozinho (WebSocket)", vistos.size >= 4, `em 3 s o feed mostrou ${vistos.size} peça(s) como a mais nova — o useAoVivo deve abrir um WebSocket em /api/ao-vivo`);
    checar("Sem polling: as fotos novas chegam pelo WebSocket", polling.length === 0, `o painel fez ${polling.length} requisições a /api/fotos parado — o ao vivo vem pelo WebSocket, não por consultas repetidas`);
    checar('O cabeçalho mostra "Ao vivo"', ((await pa.locator('[data-testid="status-conexao"]').first().textContent()) ?? "").includes("Ao vivo"), "o status da conexão não está como Ao vivo");
    checar('Sem o selo "Dados de exemplo" no ao vivo e na fila', (await selos(pa, ["ao-vivo", "fila"])) === 0, "o feed ou a fila de revisão ainda dizem que mostram dados de exemplo");

    const primeiro = pa.locator('[data-testid="revisao"]').first();
    const idCard = await primeiro.getAttribute("data-id", { timeout: 6000 }).catch(() => null);
    if (checar("A fila de revisão mostra as fotos pendentes", idCard, "nenhum cartão [data-testid=revisao] apareceu na fila")) {
      // O WebSocket do painel já está aberto: escuta os frames da conexão existente pelo CDP.
      const cdp = await pa.context().newCDPSession(pa);
      await cdp.send("Network.enable");
      let viuFrame = false;
      cdp.on("Network.webSocketFrameSent", (e) => {
        if (String(e.response?.payloadData ?? "").includes('"revisar"')) viuFrame = true;
      });
      await pa.locator(`[data-testid="revisar-refugo"][data-id="${idCard}"]`).click();
      await esperar(1500);
      checar('O botão manda {"tipo": "revisar"} pelo WebSocket', viuFrame, "clicar em Refugo não mandou a mensagem pelo WebSocket (use enviar() da conexão aberta, não um fetch)");
      const r = await pedir(s.base, { caminho: `/api/fotos/${idCard}` });
      checar("A API registrou a revisão do painel", r.json?.destino === "refugo" && typeof r.json?.revisada_por === "string", `GET /api/fotos/${idCard} veio ${resumoResposta(r)}`);
      const sumiu = await pb.locator(`[data-testid="revisao"][data-id="${idCard}"]`).waitFor({ state: "detached", timeout: 5000 }).then(() => true).catch(() => false);
      checar("No OUTRO painel aberto, a foto revisada sai da fila", sumiu, `a foto ${idCard} continuou na fila do segundo painel — ao receber {"tipo": "revisada"}, tire a foto da fila`);
    }
  } finally {
    await b.close();
    await s.parar();
  }
  return fim();

  function fim() {
    const ok = checagens.filter((c) => c.ok).length;
    return { passou: ok === checagens.length, resumo: `${ok}/${checagens.length} checagens do ao vivo`, checagens };
  }
}

// ─── Etapa 4: PWA (instalável e offline), fim dos mocks, tipos e testes ──────

function arquivos(dir) {
  const out = [];
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) out.push(...arquivos(p));
    else if (/\.(ts|tsx)$/.test(nome)) out.push(p);
  }
  return out;
}

export async function etapa4({ pasta }) {
  const { checagens, checar } = relatorio();
  const roda = (args) => spawnSync("npm", args, { cwd: pasta, encoding: "utf8", env: { ...process.env, CI: "1" }, timeout: 240000 });
  const cauda = (r) => `${r.stdout ?? ""}${r.stderr ?? ""}`.split("\n").filter((l) => l.trim() && !l.startsWith(">")).slice(-12).join("\n");

  const web = join(pasta, "apps/web/src");
  const usamMocks = arquivos(web).filter((f) => !relative(web, f).startsWith("mocks") && !/\.test\.tsx?$/.test(f) && /from\s+["'][^"']*mocks\//.test(readFileSync(f, "utf8")));
  checar("O painel não importa mais os dados de exemplo (mocks)", usamMocks.length === 0, `ainda importam mocks: ${usamMocks.map((f) => relative(pasta, f)).join(", ")}`);
  const contrato = (dir) => arquivos(join(pasta, dir)).some((f) => /from\s+["']@qi\/contracts["']/.test(readFileSync(f, "utf8")));
  checar("A API e o painel usam os tipos de @qi/contracts", contrato("apps/api/src") && contrato("apps/web/src"), "os dois lados (apps/api/src e apps/web/src) devem importar os tipos de @qi/contracts");
  const tipos = roda(["run", "typecheck"]);
  checar("npm run typecheck sem erros (API, painel e contratos)", tipos.status === 0, cauda(tipos));
  const testes = roda(["test"]);
  checar("npm test passa", testes.status === 0, cauda(testes));
  const testesDe = (dir) => (existsSync(join(pasta, dir)) ? arquivos(join(pasta, dir)) : []).filter((f) => /\.test\.tsx?$/.test(f));
  const pulados = [...testesDe("apps/api/tests"), ...testesDe("apps/api/src"), ...testesDe("apps/web/src")].filter((f) => /\b(it|test|describe)\.(skip|todo)\(/.test(readFileSync(f, "utf8")));
  checar("Nenhum teste pulado (.skip)", pulados.length === 0, `tire o .skip de: ${pulados.map((f) => relative(pasta, f)).join(", ")}`);

  const s = await subirPainel(pasta, { SIMULACAO_RITMO_MS: "5", SIMULACAO_REPETIR: "0" });
  const b = await navegador();
  try {
    await esperarFimDoTurno(s.base);
    const html = (await pedir(s.base, { caminho: "/" })).corpo;
    const link = /<link[^>]+rel=["']manifest["'][^>]*>/i.exec(html)?.[0] ?? "";
    const href = /href=["']([^"']+)["']/.exec(link)?.[1];
    const man = href ? await pedir(s.base, { caminho: href.startsWith("/") ? href : `/${href}` }) : null;
    const m = man?.json;
    if (checar("O index.html aponta o manifest (<link rel=\"manifest\">)", href && man?.status === 200 && objeto(m), href ? `GET ${href} veio ${man ? resumoResposta(man) : "nada"}` : "não achei <link rel=\"manifest\" href=\"…\"> no index.html")) {
      checar("O manifest tem nome, start_url e display de app", typeof m.name === "string" && typeof m.short_name === "string" && typeof m.start_url === "string" && ["standalone", "fullscreen", "minimal-ui"].includes(m.display), `esperava name, short_name, start_url e display "standalone"; veio ${JSON.stringify(m).slice(0, 200)}`);
      const icones = Array.isArray(m.icons) ? m.icons : [];
      let ok192 = false;
      let ok512 = false;
      for (const i of icones) {
        const r = await pedir(s.base, { caminho: String(i.src).startsWith("/") ? i.src : `/${i.src}`, binario: true });
        if (r.status === 200 && (r.cabecalhos["content-type"] ?? "").startsWith("image/")) {
          if (/192x192/.test(i.sizes)) ok192 = true;
          if (/512x512/.test(i.sizes)) ok512 = true;
        }
      }
      checar("Ícones de 192 e 512 px que existem de verdade", ok192 && ok512, `os ícones do manifest (${icones.map((i) => `${i.src} ${i.sizes}`).join(", ") || "nenhum"}) precisam incluir 192x192 e 512x512 e abrir (200, imagem)`);
    }

    const ctx = await b.newContext();
    const pg = await ctx.newPage();
    const erros = [];
    pg.on("pageerror", (e) => erros.push(String(e)));
    await pg.goto(s.base + "/", { waitUntil: "load" });
    const pronto = await pg.evaluate(() => (navigator.serviceWorker ? Promise.race([navigator.serviceWorker.ready.then(() => true), new Promise((r) => setTimeout(() => r(false), 8000))]) : false));
    await pg.reload({ waitUntil: "load" });
    await pg.locator('[data-testid="foto"]').first().waitFor({ timeout: 8000 }).catch(() => {});
    const controla = await pg.evaluate(() => !!navigator.serviceWorker?.controller);
    if (checar("O service worker é registrado e controla o painel", pronto && controla, pronto ? "o service worker registrou, mas não controla a página depois de recarregar (self.clients.claim() no activate?)" : "nenhum service worker ficou pronto em 8 s — registre /sw.js no main.tsx (navigator.serviceWorker.register)")) {
      await pg.waitForTimeout(800);
      await ctx.setOffline(true);
      const abriu = await pg.reload({ waitUntil: "domcontentloaded" }).then(() => true).catch(() => false);
      const cartoes = abriu ? await pg.locator('[data-testid="foto"]').count().catch(() => 0) : 0;
      const espera = abriu ? await pg.locator('[data-testid="foto"]').first().waitFor({ timeout: 8000 }).then(() => true).catch(() => false) : false;
      checar("Sem internet, o painel abre e mostra a galeria guardada", abriu && (cartoes > 0 || espera), abriu ? "offline, a página abriu mas a galeria ficou vazia — guarde as respostas de /api/fotos (rede primeiro, cache se falhar) e as miniaturas no service worker" : "offline, a página nem abriu — guarde o index.html e os arquivos do build no cache do service worker");
      checar("E avisa que está offline", await pg.locator('[data-testid="offline"]').first().isVisible().catch(() => false), 'mostre o aviso [data-testid="offline"] quando navigator.onLine for false');
      await ctx.setOffline(false);
    }
    checar('Nenhum selo "Dados de exemplo" no painel', (await pg.locator('[data-testid="selo-exemplo"]').count()) === 0 && erros.length === 0, erros.length ? `erro no navegador: ${erros[0].slice(0, 200)}` : "ainda há seções marcadas como dados de exemplo");
    await ctx.close();
  } finally {
    await b.close();
    await s.parar();
  }
  const ok = checagens.filter((c) => c.ok).length;
  return { passou: ok === checagens.length, resumo: `${ok}/${checagens.length} checagens do PWA e do fim dos mocks`, checagens };
}

export const ETAPAS = {
  1: { titulo: "Galeria de fotos", rodar: etapa1 },
  2: { titulo: "Indicadores e gráfico", rodar: etapa2 },
  3: { titulo: "Ao vivo por WebSocket", rodar: etapa3 },
  4: { titulo: "PWA e fim dos mocks", rodar: etapa4 },
};

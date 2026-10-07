import { deflateSync, inflateSync } from "node:zlib";

const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (b: Uint8Array) => {
  let c = 0xffffffff;
  for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const u32 = (v: number) => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
const bloco = (tipo: string, dados: Uint8Array) => {
  const corpo = Buffer.concat([Buffer.from(tipo, "latin1"), dados]);
  return Buffer.concat([Buffer.from(u32(dados.length)), corpo, Buffer.from(u32(crc32(corpo)))]);
};

/** Lê um PNG RGB de 8 bits (sem entrelaçamento): [largura, altura, pixels rgb]. */
function lerPng(png: Uint8Array): [number, number, Uint8Array] {
  const v = new DataView(png.buffer, png.byteOffset, png.byteLength);
  let i = 8;
  let w = 0;
  let h = 0;
  const idat: Uint8Array[] = [];
  while (i < png.length) {
    const tam = v.getUint32(i);
    const tipo = String.fromCharCode(...png.subarray(i + 4, i + 8));
    const dados = png.subarray(i + 8, i + 8 + tam);
    if (tipo === "IHDR") {
      w = v.getUint32(i + 8);
      h = v.getUint32(i + 12);
      if (dados[8] !== 8 || dados[9] !== 2) throw new Error("miniatura: só PNG RGB de 8 bits");
    } else if (tipo === "IDAT") idat.push(dados);
    else if (tipo === "IEND") break;
    i += 12 + tam;
  }
  const cru = inflateSync(Buffer.concat(idat));
  const px = new Uint8Array(w * h * 3);
  const linha = w * 3;
  for (let y = 0; y < h; y++) {
    const f = cru[y * (linha + 1)];
    for (let x = 0; x < linha; x++) {
      const bruto = cru[y * (linha + 1) + 1 + x];
      const a = x >= 3 ? px[y * linha + x - 3] : 0;
      const b = y > 0 ? px[(y - 1) * linha + x] : 0;
      const c = x >= 3 && y > 0 ? px[(y - 1) * linha + x - 3] : 0;
      const p = a + b - c;
      const pr = Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c) ? a : Math.abs(p - b) <= Math.abs(p - c) ? b : c;
      px[y * linha + x] = (bruto + [0, a, b, (a + b) >> 1, pr][f]) & 255;
    }
  }
  return [w, h, px];
}

/**
 * Uma miniatura `lado × lado` da foto (média dos pixels de cada quadradinho),
 * em PNG comprimido — já pronta: o painel mostra dezenas de fotos e não
 * precisa baixar cada uma inteira.
 */
export function miniatura(png: Uint8Array, lado = 24): Uint8Array {
  const [w, h, px] = lerPng(png);
  const out = new Uint8Array(lado * (1 + lado * 3));
  for (let y = 0; y < lado; y++)
    for (let x = 0; x < lado; x++) {
      const soma = [0, 0, 0];
      let n = 0;
      for (let yy = Math.floor((y * h) / lado); yy < Math.floor(((y + 1) * h) / lado); yy++)
        for (let xx = Math.floor((x * w) / lado); xx < Math.floor(((x + 1) * w) / lado); xx++) {
          for (let k = 0; k < 3; k++) soma[k] += px[(yy * w + xx) * 3 + k];
          n++;
        }
      for (let k = 0; k < 3; k++) out[y * (1 + lado * 3) + 1 + x * 3 + k] = Math.round(soma[k] / Math.max(1, n));
    }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), bloco("IHDR", Buffer.from([...u32(lado), ...u32(lado), 8, 2, 0, 0, 0])), bloco("IDAT", deflateSync(out)), bloco("IEND", new Uint8Array())]);
}

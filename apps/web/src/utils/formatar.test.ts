import { describe, expect, it } from "vitest";
import { chance, numero, porcento, relogio, segundos } from "./formatar.ts";

describe("formatar", () => {
  it("números com vírgula", () => expect(numero(1234.56)).toBe("1.234,6"));
  it("porcentagem", () => expect(porcento(19.4)).toBe("19,4%"));
  it("chance da IA", () => expect(chance(0.25)).toBe("25%"));
  it("relógio do turno", () => expect(relogio(455)).toBe("07:35"));
  it("tempo de espera", () => {
    expect(segundos(42)).toBe("42 s");
    expect(segundos(125)).toBe("2 min 5 s");
    expect(segundos(null)).toBe("—");
  });
});

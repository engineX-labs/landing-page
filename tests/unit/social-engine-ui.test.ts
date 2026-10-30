import { describe, expect, it } from "vitest";
import { connectorOffset, nextTabIndex } from "../../src/lib/social-engine-ui";

describe("connectorOffset", () => {
  const viewport = 800;
  const height = 200;

  it("está sin dibujar (1) mientras el conector está abajo, fuera de pantalla", () => {
    expect(connectorOffset({ top: 900, height, viewport })).toBe(1);
  });

  it("está completo (0) cuando ya pasó la mitad de la pantalla", () => {
    expect(connectorOffset({ top: -400, height, viewport })).toBe(0);
  });

  it("avanza de forma continua y nunca retrocede mientras se scrollea hacia abajo", () => {
    const offsets = [700, 600, 500, 400, 300, 200].map((top) =>
      connectorOffset({ top, height, viewport }),
    );
    expect(offsets.every((value) => value >= 0 && value <= 1)).toBe(true);
    for (let i = 1; i < offsets.length; i++) expect(offsets[i]).toBeLessThan(offsets[i - 1]);
  });

  it("con movimiento reducido se muestra entero", () => {
    expect(connectorOffset({ top: 900, height, viewport, reducedMotion: true })).toBe(0);
  });
});

describe("nextTabIndex", () => {
  it("las flechas avanzan y retroceden, y dan la vuelta en los extremos", () => {
    expect(nextTabIndex(0, "ArrowDown", 7)).toBe(1);
    expect(nextTabIndex(0, "ArrowRight", 7)).toBe(1);
    expect(nextTabIndex(3, "ArrowUp", 7)).toBe(2);
    expect(nextTabIndex(0, "ArrowLeft", 7)).toBe(6);
    expect(nextTabIndex(6, "ArrowDown", 7)).toBe(0);
  });

  it("Home y End van al primero y al último", () => {
    expect(nextTabIndex(3, "Home", 7)).toBe(0);
    expect(nextTabIndex(3, "End", 7)).toBe(6);
  });

  it("cualquier otra tecla no mueve la selección", () => {
    expect(nextTabIndex(3, "Enter", 7)).toBeUndefined();
    expect(nextTabIndex(3, "a", 7)).toBeUndefined();
  });
});

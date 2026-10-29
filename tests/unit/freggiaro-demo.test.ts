import { describe, expect, it } from "vitest";
import {
  areaOf,
  categories,
  clients,
  donutSegments,
  filterClients,
  filterProducts,
  formatArs,
  formatCuit,
  LAST_INVOICE_NUMBER,
  linePoints,
  matchesQuery,
  normalize,
  pathOf,
  periods,
  products,
  ratios,
  sales,
  searchText,
  simulateInvoice,
  stockLevel,
  totalDebt,
} from "../../src/lib/freggiaro-demo";

describe("búsqueda de productos", () => {
  it("ignora mayúsculas y tildes", () => {
    expect(normalize("  Rulemán ")).toBe("ruleman");
    const found = filterProducts(products, "RULEMAN", null);
    expect(found.map((p) => p.sku)).toEqual(["RUL-SKF-VKC"]);
  });

  it("cada palabra tiene que aparecer, en cualquier orden", () => {
    const text = searchText(products[0]);
    expect(matchesQuery(text, "sachs kit")).toBe(true);
    expect(matchesQuery(text, "sachs luk")).toBe(false);
  });

  it("busca por SKU, marca y categoría", () => {
    expect(filterProducts(products, "dsc-luk", null)).toHaveLength(1);
    expect(filterProducts(products, "skf", null)).toHaveLength(1);
    expect(filterProducts(products, "hidraulica", null)).toHaveLength(2);
  });

  it("sin búsqueda ni categoría devuelve todo; la categoría filtra", () => {
    expect(filterProducts(products, "", null)).toHaveLength(products.length);
    expect(filterProducts(products, "  ", null)).toHaveLength(products.length);
    expect(filterProducts(products, "", "Frenos").map((p) => p.category)).toEqual([
      "Frenos",
      "Frenos",
    ]);
    expect(filterProducts(products, "disco", "Frenos").map((p) => p.sku)).toEqual(["DSC-FRN-276"]);
    expect(filterProducts(products, "kit", "Frenos")).toEqual([]);
  });

  it("las categorías no se repiten", () => {
    expect(new Set(categories).size).toBe(categories.length);
  });
});

describe("stock", () => {
  it("distingue sin stock, bajo y normal", () => {
    expect(stockLevel(0)).toBe("out");
    expect(stockLevel(9)).toBe("low");
    expect(stockLevel(10)).toBe("ok");
  });
});

describe("formatArs", () => {
  it("usa punto de miles y redondea", () => {
    expect(formatArs(185000)).toBe("$ 185.000");
    expect(formatArs(18746300)).toBe("$ 18.746.300");
    expect(formatArs(842.6)).toBe("$ 843");
    expect(formatArs(0)).toBe("$ 0");
  });
});

describe("resumen", () => {
  it("las razones se miden contra el valor más alto", () => {
    expect(ratios([50, 100, 0])).toEqual([0.5, 1, 0]);
    expect(ratios([0, 0])).toEqual([0, 0]);
  });

  it("cada período tiene datos coherentes", () => {
    expect(periods.map((p) => p.id)).toEqual(["hoy", "semana", "mes", "anio"]);
    for (const p of periods) {
      expect(p.count).toBeGreaterThan(0);
      expect(p.top.length).toBeGreaterThan(0);
      // El gráfico cuenta exactamente las ventas que muestra el KPI.
      expect(
        p.series.reduce((acc, point) => acc + point.value, 0),
        p.id,
      ).toBe(p.total);
      expect(
        p.payments.reduce((acc, m) => acc + m.pct, 0),
        p.id,
      ).toBe(100);
    }
  });
});

describe("gráficos", () => {
  it("la línea pone cada punto en el centro de su celda y deja aire arriba", () => {
    const points = linePoints([0, 50, 100, 25], 200, 100);
    expect(points.map((p) => p.x)).toEqual([25, 75, 125, 175]);
    expect(points[0].y).toBe(100);
    expect(points[2].y).toBeGreaterThan(0);
    expect(points[2].y).toBeLessThan(points[1].y);
  });

  it("un solo punto o ninguno no rompe", () => {
    expect(linePoints([], 100, 50)).toEqual([]);
    expect(linePoints([5], 100, 50)).toHaveLength(1);
    expect(linePoints([0, 0], 100, 50).every((p) => p.y === 50)).toBe(true);
  });

  it("arma el trazo y el área cerrada", () => {
    const points = [
      { x: 0, y: 10 },
      { x: 20, y: 5 },
    ];
    expect(pathOf(points)).toBe("M0.0 10.0 L20.0 5.0");
    expect(areaOf(points, 40)).toBe("M0.0 10.0 L20.0 5.0 L20.0 40 L0.0 40 Z");
    expect(areaOf([], 40)).toBe("");
  });

  it("las porciones de la torta se apoyan una tras otra", () => {
    expect(donutSegments([{ pct: 38 }, { pct: 34 }, { pct: 28 }])).toEqual([
      { pct: 38, offset: -0 },
      { pct: 34, offset: -38 },
      { pct: 28, offset: -72 },
    ]);
  });
});

describe("factura simulada", () => {
  it("sigue la numeración y cambia el CAE con cada número", () => {
    const next = simulateInvoice(LAST_INVOICE_NUMBER + 1);
    expect(next.label).toBe("Factura B 0003-00000320");
    expect(next.cae).toMatch(/^\d{14}$/);
    expect(simulateInvoice(LAST_INVOICE_NUMBER + 2).cae).not.toBe(next.cae);
    expect(simulateInvoice(LAST_INVOICE_NUMBER + 1)).toEqual(next);
    expect(simulateInvoice(41, "A").label).toBe("Factura A 0003-00000041");
  });

  it("hay ventas sin facturar para probar y otras ya facturadas", () => {
    expect(sales.filter((s) => s.invoice === null).length).toBeGreaterThan(0);
    expect(sales.filter((s) => s.invoice !== null).length).toBeGreaterThan(0);
    expect(sales[0].invoice?.label).toBe("Factura B 0003-00000318");
  });
});

describe("clientes", () => {
  it("formatea el CUIT y avisa cuando no hay", () => {
    expect(formatCuit("30712345674")).toBe("30-71234567-4");
    expect(formatCuit("30-71234567-4")).toBe("30-71234567-4");
    expect(formatCuit("")).toBe("—");
    expect(formatCuit("123")).toBe("—");
  });

  it("busca por nombre o CUIT, con o sin guiones", () => {
    expect(filterClients(clients, "piston", {}).map((c) => c.name)).toEqual(["Taller El Pistón"]);
    expect(filterClients(clients, "30-71234567", {}).map((c) => c.name)).toEqual([
      "Transporte Andino",
    ]);
    expect(filterClients(clients, "3071234567", {})).toHaveLength(1);
    expect(filterClients(clients, "", {})).toHaveLength(clients.length);
  });

  it("filtra los que tienen saldo pendiente", () => {
    const debt = filterClients(clients, "", { onlyDebt: true });
    expect(debt.length).toBeGreaterThan(0);
    expect(debt.every((c) => c.balance > 0)).toBe(true);
    expect(filterClients(clients, "rossi", { onlyDebt: true })).toEqual([]);
  });

  it("suma la deuda y cuenta deudores", () => {
    expect(totalDebt([100, 0, 50])).toEqual({ total: 150, debtors: 2 });
    expect(totalDebt([])).toEqual({ total: 0, debtors: 0 });
    expect(totalDebt(clients.map((c) => c.balance))).toEqual({ total: 704900, debtors: 4 });
  });

  it("cada cliente de Ventas está en la cartera", () => {
    const names = new Set(clients.map((c) => c.name));
    for (const s of sales) expect(names.has(s.client), s.client).toBe(true);
  });
});

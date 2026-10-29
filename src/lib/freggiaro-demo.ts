/**
 * Datos y reglas de la demo de Freggiaro (`FreggiaroDemo.astro`).
 *
 * Todo es ficticio: no hay ningún servidor detrás ni conexión con ARCA. Las funciones son puras
 * y se comparten entre el prerender de la página y el script del navegador.
 */

export interface DemoProduct {
  sku: string;
  name: string;
  category: string;
  brand: string;
  stock: number;
  price: number;
}

export const products: DemoProduct[] = [
  {
    sku: "KIT-SAC-3000",
    name: "Kit de embrague Sachs 3000",
    category: "Kits de embrague",
    brand: "Sachs",
    stock: 14,
    price: 185000,
  },
  {
    sku: "DSC-LUK-200",
    name: "Disco de embrague LuK 200 mm",
    category: "Discos",
    brand: "LuK",
    stock: 22,
    price: 68500,
  },
  {
    sku: "PLT-VAL-801",
    name: "Placa de presión Valeo 801",
    category: "Placas",
    brand: "Valeo",
    stock: 9,
    price: 97300,
  },
  {
    sku: "RUL-SKF-VKC",
    name: "Rulemán de empuje SKF VKC",
    category: "Rulemanes",
    brand: "SKF",
    stock: 31,
    price: 24900,
  },
  {
    sku: "BOM-FTE-110",
    name: 'Bomba de embrague FTE 3/4"',
    category: "Hidráulica",
    brand: "FTE",
    stock: 0,
    price: 54200,
  },
  {
    sku: "CIL-TRW-450",
    name: "Cilindro receptor TRW",
    category: "Hidráulica",
    brand: "TRW",
    stock: 12,
    price: 38700,
  },
  {
    sku: "PAS-FRS-220",
    name: "Pastillas de freno Fras-le",
    category: "Frenos",
    brand: "Fras-le",
    stock: 46,
    price: 29800,
  },
  {
    sku: "DSC-FRN-276",
    name: "Disco de freno ventilado 276 mm",
    category: "Frenos",
    brand: "Fremax",
    stock: 5,
    price: 41600,
  },
];

export const categories: string[] = [...new Set(products.map((p) => p.category))];

/** Por debajo de este stock el producto se marca como "stock bajo". */
export const LOW_STOCK = 10;

export type StockLevel = "out" | "low" | "ok";

export function stockLevel(stock: number): StockLevel {
  if (stock <= 0) return "out";
  return stock < LOW_STOCK ? "low" : "ok";
}

/** Minúsculas y sin tildes, para que "embrague" encuentre "Embrague" y "ruleman" a "Rulemán". */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Texto donde busca el filtro: SKU, nombre, marca y categoría. */
export function searchText(p: DemoProduct): string {
  return normalize(`${p.sku} ${p.name} ${p.brand} ${p.category}`);
}

/** Cada palabra de la búsqueda tiene que aparecer en el texto, en cualquier orden. */
export function matchesQuery(haystack: string, query: string): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return words.every((w) => haystack.includes(w));
}

export function filterProducts(
  list: readonly DemoProduct[],
  query: string,
  category: string | null,
): DemoProduct[] {
  return list.filter(
    (p) => (!category || p.category === category) && matchesQuery(searchText(p), query),
  );
}

/** `$ 185.000`, con punto de miles y sin depender del ICU de quien lo ejecute. */
export function formatArs(value: number): string {
  const n = Math.round(value);
  const digits = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${n < 0 ? "-" : ""}$ ${digits}`;
}

export type PeriodId = "hoy" | "semana" | "mes" | "anio";

export interface DemoPeriod {
  id: PeriodId;
  label: string;
  /** Qué representa cada punto del gráfico, para el texto accesible. */
  seriesLabel: string;
  total: number;
  count: number;
  clients: number;
  /** Unidades vendidas en el período. */
  items: number;
  /** Variación contra el período anterior, en porcentaje. */
  delta: number;
  /** Ventas por punto del gráfico. Suman `total`. */
  series: { label: string; value: number }[];
  /** Cómo cobraron: porcentajes que suman 100. */
  payments: { label: string; pct: number }[];
  top: { name: string; amount: number }[];
}

const series = (labels: string[], values: number[]) =>
  labels.map((label, i) => ({ label, value: values[i] ?? 0 }));

export const periods: DemoPeriod[] = [
  {
    id: "hoy",
    label: "Hoy",
    seriesLabel: "Ventas por franja horaria",
    total: 842600,
    count: 11,
    clients: 9,
    items: 38,
    delta: 6.2,
    series: series(
      ["9 h", "10 h", "11 h", "12 h", "13 h", "14 h", "15 h", "16 h"],
      [48000, 126000, 184000, 97000, 22000, 61000, 143000, 161600],
    ),
    payments: [
      { label: "Efectivo", pct: 46 },
      { label: "Transferencia", pct: 28 },
      { label: "Tarjeta", pct: 18 },
      { label: "Cuenta corriente", pct: 8 },
    ],
    top: [
      { name: "Kit de embrague Sachs 3000", amount: 370000 },
      { name: "Disco de embrague LuK 200 mm", amount: 137000 },
      { name: "Placa de presión Valeo 801", amount: 97300 },
    ],
  },
  {
    id: "semana",
    label: "Semana",
    seriesLabel: "Ventas por día",
    total: 4318900,
    count: 52,
    clients: 31,
    items: 311,
    delta: 11.8,
    series: series(
      ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
      [612000, 784000, 693000, 905000, 1022900, 302000, 0],
    ),
    payments: [
      { label: "Efectivo", pct: 41 },
      { label: "Transferencia", pct: 31 },
      { label: "Tarjeta", pct: 17 },
      { label: "Cuenta corriente", pct: 11 },
    ],
    top: [
      { name: "Kit de embrague Sachs 3000", amount: 1480000 },
      { name: "Disco de embrague LuK 200 mm", amount: 822000 },
      { name: "Placa de presión Valeo 801", amount: 583800 },
    ],
  },
  {
    id: "mes",
    label: "Mes",
    seriesLabel: "Ventas del mes",
    total: 18746300,
    count: 214,
    clients: 96,
    items: 1538,
    delta: 18.4,
    series: series(
      [
        "01 oct",
        "03 oct",
        "06 oct",
        "08 oct",
        "10 oct",
        "13 oct",
        "15 oct",
        "17 oct",
        "20 oct",
        "22 oct",
        "24 oct",
        "27 oct",
      ],
      [
        746000, 1083000, 959000, 1385000, 1225000, 1633000, 1527000, 1846000, 1740000, 2148000,
        2006000, 2448300,
      ],
    ),
    payments: [
      { label: "Efectivo", pct: 38 },
      { label: "Transferencia", pct: 34 },
      { label: "Tarjeta", pct: 18 },
      { label: "Cuenta corriente", pct: 10 },
    ],
    top: [
      { name: "Kit de embrague Sachs 3000", amount: 6290000 },
      { name: "Disco de embrague LuK 200 mm", amount: 3426000 },
      { name: "Placa de presión Valeo 801", amount: 2594000 },
    ],
  },
  {
    id: "anio",
    label: "Año",
    seriesLabel: "Ventas por mes",
    total: 196420800,
    count: 2318,
    clients: 318,
    items: 16904,
    delta: 32.6,
    series: series(
      ["Nov", "Dic", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct"],
      [
        11404000, 13034000, 13746000, 12321000, 15681000, 16496000, 16088000, 18227000, 18634000,
        19958000, 19041000, 21790800,
      ],
    ),
    payments: [
      { label: "Efectivo", pct: 35 },
      { label: "Transferencia", pct: 36 },
      { label: "Tarjeta", pct: 19 },
      { label: "Cuenta corriente", pct: 10 },
    ],
    top: [
      { name: "Kit de embrague Sachs 3000", amount: 64200000 },
      { name: "Disco de embrague LuK 200 mm", amount: 38900000 },
      { name: "Placa de presión Valeo 801", amount: 27400000 },
    ],
  },
];

/** Cada valor como fracción del más alto (0 a 1). */
export function ratios(values: readonly number[]): number[] {
  const max = Math.max(0, ...values);
  return values.map((v) => (max > 0 ? v / max : 0));
}

export interface ChartPoint {
  x: number;
  y: number;
}

/**
 * Puntos del gráfico de línea dentro de un lienzo `width` × `height`. Cada valor ocupa una celda
 * del mismo ancho y el punto cae en su centro, para que coincida con su etiqueta. El cero queda
 * abajo y el máximo deja un 10 % de aire arriba.
 */
export function linePoints(values: readonly number[], width: number, height: number): ChartPoint[] {
  const max = Math.max(0, ...values) * 1.1;
  const cell = values.length > 0 ? width / values.length : 0;
  return values.map((v, i) => ({
    x: (i + 0.5) * cell,
    y: max > 0 ? height - (v / max) * height : height,
  }));
}

/** `M x y L x y …`, con un decimal. */
export function pathOf(points: readonly ChartPoint[]): string {
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
}

/** Trazo del área bajo la línea, cerrado contra el piso del gráfico. */
export function areaOf(points: readonly ChartPoint[], height: number): string {
  if (points.length === 0) return "";
  const first = points[0];
  const last = points[points.length - 1];
  return `${pathOf(points)} L${last.x.toFixed(1)} ${height} L${first.x.toFixed(1)} ${height} Z`;
}

/** Posición de cada porción de la torta (circunferencia de 100 unidades). */
export function donutSegments(
  items: readonly { pct: number }[],
): { pct: number; offset: number }[] {
  let acc = 0;
  return items.map(({ pct }) => {
    const segment = { pct, offset: -acc };
    acc += pct;
    return segment;
  });
}

export type PaymentStatus = "Pagado" | "Pendiente" | "Cuenta corriente";

export interface SimulatedInvoice {
  /** `Factura B 0003-00000320`. */
  label: string;
  /** CAE inventado: 14 dígitos, siempre el mismo para el mismo número. */
  cae: string;
}

/** Arma una factura de mentira con ese número. No hay llamada a ARCA. */
export function simulateInvoice(sequence: number, type: "A" | "B" = "B"): SimulatedInvoice {
  const number = String(sequence).padStart(8, "0");
  const cae = String(76432189054127 + sequence * 7919).padStart(14, "0");
  return { label: `Factura ${type} 0003-${number}`, cae };
}

export interface DemoSale {
  number: string;
  date: string;
  client: string;
  total: number;
  payment: PaymentStatus;
  /** Comprobante ya emitido, o `null` si todavía no se facturó. */
  invoice: SimulatedInvoice | null;
}

export const sales: DemoSale[] = [
  {
    number: "R-0001-00000483",
    date: "10/10/2026",
    client: "Mecánica Rossi",
    total: 68500,
    payment: "Pagado",
    invoice: simulateInvoice(318),
  },
  {
    number: "R-0001-00000484",
    date: "10/10/2026",
    client: "Consumidor final",
    total: 29800,
    payment: "Pagado",
    invoice: simulateInvoice(319),
  },
  {
    number: "R-0001-00000485",
    date: "11/10/2026",
    client: "Transporte Andino",
    total: 412300,
    payment: "Cuenta corriente",
    invoice: simulateInvoice(41, "A"),
  },
  {
    number: "R-0001-00000486",
    date: "11/10/2026",
    client: "Lubricentro Norte",
    total: 97300,
    payment: "Pendiente",
    invoice: null,
  },
  {
    number: "R-0001-00000487",
    date: "12/10/2026",
    client: "Taller El Pistón",
    total: 199900,
    payment: "Pagado",
    invoice: null,
  },
  {
    number: "R-0001-00000488",
    date: "12/10/2026",
    client: "Consumidor final",
    total: 24900,
    payment: "Pagado",
    invoice: null,
  },
];

/** Último número de factura B ya usado en los datos de arriba. */
export const LAST_INVOICE_NUMBER = 319;

export type TaxCondition = "Responsable inscripto" | "Monotributo" | "Consumidor final";

export interface DemoClient {
  name: string;
  /** 11 dígitos, sin guiones. Inventado. */
  cuit: string;
  condition: TaxCondition;
  phone: string;
  /** Saldo de cuenta corriente: lo que el cliente debe. 0 es "al día". */
  balance: number;
  lastPurchase: string;
}

export const clients: DemoClient[] = [
  {
    name: "Transporte Andino",
    cuit: "30712345674",
    condition: "Responsable inscripto",
    phone: "351 555-0142",
    balance: 412300,
    lastPurchase: "11/10/2026",
  },
  {
    name: "Lubricentro Norte",
    cuit: "30709876541",
    condition: "Responsable inscripto",
    phone: "351 555-0187",
    balance: 97300,
    lastPurchase: "11/10/2026",
  },
  {
    name: "Mecánica Rossi",
    cuit: "20284561237",
    condition: "Monotributo",
    phone: "3548 55-0123",
    balance: 0,
    lastPurchase: "10/10/2026",
  },
  {
    name: "Taller El Pistón",
    cuit: "30715558882",
    condition: "Responsable inscripto",
    phone: "351 555-0164",
    balance: 0,
    lastPurchase: "12/10/2026",
  },
  {
    name: "AutoService Gral. Paz",
    cuit: "30711122239",
    condition: "Responsable inscripto",
    phone: "351 555-0119",
    balance: 158400,
    lastPurchase: "06/10/2026",
  },
  {
    name: "Repuestos Don Carlos",
    cuit: "20171239874",
    condition: "Monotributo",
    phone: "3548 55-0176",
    balance: 36900,
    lastPurchase: "03/10/2026",
  },
  {
    name: "Gomería La Ruta",
    cuit: "27305557771",
    condition: "Monotributo",
    phone: "3548 55-0105",
    balance: 0,
    lastPurchase: "29/09/2026",
  },
  {
    name: "Consumidor final",
    cuit: "",
    condition: "Consumidor final",
    phone: "",
    balance: 0,
    lastPurchase: "12/10/2026",
  },
];

/** `30-71234567-4`. Sin CUIT (consumidor final) devuelve una raya. */
export function formatCuit(cuit: string): string {
  const digits = cuit.replace(/\D/g, "");
  if (digits.length !== 11) return "—";
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
}

/** Texto donde busca el filtro de clientes: nombre y CUIT, con y sin guiones. */
export function clientSearchText(c: DemoClient): string {
  return normalize(`${c.name} ${c.cuit} ${formatCuit(c.cuit)} ${c.condition}`);
}

export function filterClients(
  list: readonly DemoClient[],
  query: string,
  { onlyDebt = false } = {},
): DemoClient[] {
  return list.filter(
    (c) => (!onlyDebt || c.balance > 0) && matchesQuery(clientSearchText(c), query),
  );
}

/** Total a cobrar en cuenta corriente y cuántos clientes deben. */
export function totalDebt(balances: readonly number[]): { total: number; debtors: number } {
  const owed = balances.filter((b) => b > 0);
  return { total: owed.reduce((acc, b) => acc + b, 0), debtors: owed.length };
}

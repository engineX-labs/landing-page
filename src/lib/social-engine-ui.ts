// Cálculos de la interfaz de Social Engine, puros para poder testearlos sin navegador.

interface ConnectorInput {
  /** `getBoundingClientRect().top` del conector. */
  top: number;
  height: number;
  /** Alto de la ventana. */
  viewport: number;
  reducedMotion?: boolean;
}

/**
 * `stroke-dashoffset` de la línea (con `pathLength=1`): 1 sin dibujar, 0 completa.
 * Empieza cuando el conector asoma por el 85 % de la pantalla y termina cuando su base llega al 55 %.
 */
export function connectorOffset({ top, height, viewport, reducedMotion }: ConnectorInput): number {
  if (reducedMotion) return 0;
  const progress = (viewport * 0.85 - top) / (height + viewport * 0.3);
  return 1 - Math.min(1, Math.max(0, progress));
}

const STEP: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };

/** Pestaña que corresponde a una tecla (flechas, Home y End), o undefined si no es de navegación. */
export function nextTabIndex(current: number, key: string, count: number): number | undefined {
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  const step = STEP[key];
  return step === undefined ? undefined : (current + step + count) % count;
}

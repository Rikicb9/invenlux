import { redondear } from './fechas';
import { lotesConStock, type LoteConStock } from './stock';
import type { Estrategia, InstanteISO, Lote, Movimiento } from './tipos';

/**
 * El motor de salida de stock. Es la pieza que diferencia a Invenlux, así
 * que vive aquí: sin UI, sin base de datos y con tests propios.
 */

type Comparador = (a: LoteConStock, b: LoteConStock) => number;

/** Desempate estable cuando dos lotes empatan en el criterio principal. */
const porEntrada: Comparador = (a, b) =>
  a.fCompra === b.fCompra ? a.id.localeCompare(b.id) : a.fCompra < b.fCompra ? -1 : 1;

/**
 * FEFO — First Expired, First Out.
 * Primero lo que antes caduca; los lotes sin fecha van al final (no se
 * pueden ordenar por caducidad y son, por definición, los menos urgentes);
 * a igual caducidad, gana el que entró antes.
 */
export const compararFEFO: Comparador = (a, b) => {
  if (a.fCaducidad && b.fCaducidad) {
    if (a.fCaducidad !== b.fCaducidad) return a.fCaducidad < b.fCaducidad ? -1 : 1;
    return porEntrada(a, b);
  }
  if (a.fCaducidad && !b.fCaducidad) return -1;
  if (!a.fCaducidad && b.fCaducidad) return 1;
  return porEntrada(a, b);
};

/** Estrategias alternativas. La UI sólo expone FEFO hasta la fase de negocio. */
const compararFIFO: Comparador = (a, b) => porEntrada(a, b);
const compararLIFO: Comparador = (a, b) => -porEntrada(a, b);

const COMPARADORES: Record<Estrategia, Comparador> = {
  FEFO: compararFEFO,
  FIFO: compararFIFO,
  LIFO: compararLIFO,
};

/** Lotes con stock de un producto, en el orden en que se deben consumir. */
export function ordenarLotes(
  productoId: string,
  lotes: readonly Lote[],
  movimientos: readonly Movimiento[],
  estrategia: Estrategia = 'FEFO',
): LoteConStock[] {
  return lotesConStock(productoId, lotes, movimientos).sort(COMPARADORES[estrategia]);
}

/** El lote del que se descontará el próximo consumo. */
export function loteSiguiente(
  productoId: string,
  lotes: readonly Lote[],
  movimientos: readonly Movimiento[],
  estrategia: Estrategia = 'FEFO',
): LoteConStock | null {
  return ordenarLotes(productoId, lotes, movimientos, estrategia)[0] ?? null;
}

export interface Asignacion {
  lote: LoteConStock;
  cantidad: number;
}

export interface PlanConsumo {
  asignaciones: Asignacion[];
  /** Lo que se puede descontar de verdad. */
  servido: number;
  /** Lo que se pidió y no hay en casa. */
  pendiente: number;
}

/**
 * Reparte una cantidad entre los lotes disponibles siguiendo la estrategia.
 * No muta nada ni escribe movimientos: sólo dice de dónde saldría.
 */
export function planificarConsumo(
  productoId: string,
  cantidad: number,
  lotes: readonly Lote[],
  movimientos: readonly Movimiento[],
  estrategia: Estrategia = 'FEFO',
): PlanConsumo {
  if (!(cantidad > 0)) return { asignaciones: [], servido: 0, pendiente: 0 };

  const asignaciones: Asignacion[] = [];
  let queda = cantidad;

  for (const lote of ordenarLotes(productoId, lotes, movimientos, estrategia)) {
    if (queda <= 0) break;
    const toma = redondear(Math.min(lote.stock, queda));
    if (toma <= 0) continue;
    asignaciones.push({ lote, cantidad: toma });
    queda = redondear(queda - toma);
  }

  return {
    asignaciones,
    servido: redondear(cantidad - queda),
    pendiente: redondear(queda),
  };
}

export interface OpcionesMovimiento {
  nuevoId: () => string;
  fecha?: InstanteISO;
  usuarioId?: string | null;
  tipo?: 'consumo' | 'merma';
}

/** Traduce un plan a movimientos listos para persistir (append-only). */
export function movimientosDeConsumo(
  productoId: string,
  plan: PlanConsumo,
  opciones: OpcionesMovimiento,
): Movimiento[] {
  const fecha = opciones.fecha ?? new Date().toISOString();
  return plan.asignaciones.map((a) => ({
    id: opciones.nuevoId(),
    loteId: a.lote.id,
    productoId,
    tipo: opciones.tipo ?? 'consumo',
    cantidad: a.cantidad,
    fecha,
    usuarioId: opciones.usuarioId ?? null,
  }));
}

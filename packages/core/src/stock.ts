import { redondear } from './fechas';
import type { Lote, Movimiento, TipoMovimiento } from './tipos';

/**
 * El stock se calcula, no se guarda (principio 3 del stack).
 * Todo saldo sale de sumar el registro de movimientos.
 */

const SIGNO: Record<TipoMovimiento, number> = {
  entrada: 1,
  consumo: -1,
  merma: -1,
  ajuste: 1, // el ajuste ya viene con signo en `cantidad`
};

export function efectoDe(mov: Movimiento): number {
  return SIGNO[mov.tipo] * mov.cantidad;
}

/** Saldo de un lote concreto. */
export function stockDeLote(loteId: string, movimientos: readonly Movimiento[]): number {
  let total = 0;
  for (const m of movimientos) if (m.loteId === loteId) total += efectoDe(m);
  return redondear(total);
}

/** Saldo por lote en una sola pasada. Los lotes sin movimientos no aparecen. */
export function stockPorLote(movimientos: readonly Movimiento[]): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const m of movimientos) {
    mapa.set(m.loteId, (mapa.get(m.loteId) ?? 0) + efectoDe(m));
  }
  for (const [id, v] of mapa) mapa.set(id, redondear(v));
  return mapa;
}

/** Saldo total de un producto, sumando todos sus lotes. */
export function stockDeProducto(productoId: string, movimientos: readonly Movimiento[]): number {
  let total = 0;
  for (const m of movimientos) if (m.productoId === productoId) total += efectoDe(m);
  return redondear(total);
}

export interface LoteConStock extends Lote {
  stock: number;
}

/** Lotes de un producto que todavía tienen existencias. */
export function lotesConStock(
  productoId: string,
  lotes: readonly Lote[],
  movimientos: readonly Movimiento[],
): LoteConStock[] {
  const saldos = stockPorLote(movimientos);
  return lotes
    .filter((l) => l.productoId === productoId)
    .map((l) => ({ ...l, stock: saldos.get(l.id) ?? 0 }))
    .filter((l) => l.stock > 0);
}

import { sumarDias } from '../src/fechas';
import type {
  Categoria,
  FechaISO,
  Lote,
  Movimiento,
  OrigenLote,
  Producto,
  Ubicacion,
  Unidad,
} from '../src/tipos';

export const HOY: FechaISO = '2026-08-05';
export const HOGAR = 'h1';

/** Fecha relativa a HOY, para que los tests no caduquen con el calendario. */
export const dia = (n: number): FechaISO => sumarDias(HOY, n);

let n = 0;
export const nuevoId = () => `id${++n}`;
export const reiniciarIds = () => {
  n = 0;
};

export function producto(over: Partial<Producto> = {}): Producto {
  return {
    id: over.id ?? nuevoId(),
    hogarId: HOGAR,
    nombre: 'Yogur natural',
    categoria: 'Lácteos' as Categoria,
    unidad: 'unidades' as Unidad,
    stockMin: 4,
    autoCompra: true,
    ...over,
  };
}

/**
 * Crea un lote con su movimiento de entrada. En el dominio real nunca
 * existe un lote sin entrada, así que los tests tampoco lo simulan.
 */
export function entrada(
  productoId: string,
  cantidad: number,
  fCaducidad: FechaISO | null,
  fCompra: FechaISO = dia(-1),
  ubicacion: Ubicacion = 'Nevera',
  origen: OrigenLote = 'manual',
): { lote: Lote; movimiento: Movimiento } {
  const lote: Lote = {
    id: nuevoId(),
    productoId,
    cantidadInicial: cantidad,
    fCompra,
    fCaducidad,
    ubicacion,
    origen,
  };
  const movimiento: Movimiento = {
    id: nuevoId(),
    loteId: lote.id,
    productoId,
    tipo: 'entrada',
    cantidad,
    fecha: `${fCompra}T10:00:00.000Z`,
  };
  return { lote, movimiento };
}

export interface EntradaSpec {
  cantidad: number;
  caducidad: FechaISO | null;
  compra?: FechaISO;
  ubicacion?: Ubicacion;
}

/** Escenario mínimo: un producto con varios lotes. */
export function escenario(p: Producto, entradas: EntradaSpec[]) {
  const lotes: Lote[] = [];
  const movimientos: Movimiento[] = [];
  for (const e of entradas) {
    const { lote, movimiento } = entrada(
      p.id,
      e.cantidad,
      e.caducidad,
      e.compra ?? dia(-1),
      e.ubicacion ?? 'Nevera',
    );
    lotes.push(lote);
    movimientos.push(movimiento);
  }
  return { producto: p, lotes, movimientos };
}

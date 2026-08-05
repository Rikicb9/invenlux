import { diasHasta, hoyISO } from './fechas';
import { ordenarLotes } from './fefo';
import type { AjustesHogar, FechaISO, Lote, Movimiento, Producto } from './tipos';

export type ClaveEstado = 'caducado' | 'hoy' | 'aviso' | 'en-plazo' | 'sin-fecha';

export interface EstadoCaducidad {
  clave: ClaveEstado;
  dias: number | null;
  /** Si debe salir en "Caduca pronto" y contar en el aviso. */
  urgente: boolean;
}

/**
 * Estado de un lote respecto a su fecha. El umbral es del hogar, así que
 * el mismo lote puede ser "urgente" en una casa y no en otra.
 */
export function estadoCaducidad(
  fCaducidad: FechaISO | null,
  diasAviso: number,
  hoy: FechaISO = hoyISO(),
): EstadoCaducidad {
  const dias = diasHasta(fCaducidad, hoy);
  if (dias === null) return { clave: 'sin-fecha', dias: null, urgente: false };
  if (dias < 0) return { clave: 'caducado', dias, urgente: true };
  if (dias === 0) return { clave: 'hoy', dias, urgente: true };
  if (dias <= diasAviso) return { clave: 'aviso', dias, urgente: true };
  return { clave: 'en-plazo', dias, urgente: false };
}

/** Texto corto para badges. La UI no debe recalcular esto por su cuenta. */
export function etiquetaEstado(estado: EstadoCaducidad): string {
  switch (estado.clave) {
    case 'sin-fecha':
      return 'Sin fecha';
    case 'caducado':
      return estado.dias === -1 ? 'Caducó ayer' : `Caducó hace ${Math.abs(estado.dias!)} días`;
    case 'hoy':
      return 'Caduca hoy';
    default:
      return estado.dias === 1 ? 'Queda 1 día' : `Quedan ${estado.dias} días`;
  }
}

export interface ProductoUrgente {
  producto: Producto;
  lote: Lote;
  cantidad: number;
  estado: EstadoCaducidad;
}

/**
 * Lo que hay que consumir ya: para cada producto con stock, su lote más
 * urgente según FEFO, filtrado por el umbral de aviso y ordenado por fecha.
 */
export function productosUrgentes(
  productos: readonly Producto[],
  lotes: readonly Lote[],
  movimientos: readonly Movimiento[],
  ajustes: AjustesHogar,
  hoy: FechaISO = hoyISO(),
): ProductoUrgente[] {
  const salida: ProductoUrgente[] = [];

  for (const producto of productos) {
    for (const lote of ordenarLotes(producto.id, lotes, movimientos, ajustes.estrategia)) {
      const estado = estadoCaducidad(lote.fCaducidad, ajustes.diasAviso, hoy);
      if (!estado.urgente) break; // van ordenados: si este no urge, los siguientes tampoco
      salida.push({ producto, lote, cantidad: lote.stock, estado });
    }
  }

  return salida.sort((a, b) => (a.estado.dias ?? 0) - (b.estado.dias ?? 0));
}

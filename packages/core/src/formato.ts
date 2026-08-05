import { redondear } from './fechas';
import type { FechaISO, Unidad } from './tipos';

/** "3 unidades" se lee mal en una cocina: se muestra "3 ud". */
const ABREVIATURA: Record<Unidad, string> = {
  unidades: 'ud',
  g: 'g',
  kg: 'kg',
  ml: 'ml',
  l: 'l',
};

export function abreviarUnidad(unidad: Unidad): string {
  return ABREVIATURA[unidad];
}

/** Número en formato español, sin ceros decimales de relleno. */
export function formatearNumero(n: number): string {
  return String(redondear(n)).replace('.', ',');
}

export function formatearCantidad(cantidad: number, unidad: Unidad): string {
  return `${formatearNumero(cantidad)} ${abreviarUnidad(unidad)}`;
}

/** 2026-08-14 → 14/08 */
export function formatearFechaCorta(fecha: FechaISO | null): string {
  if (!fecha) return 'sin fecha';
  return `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;
}

/** 2026-08-14 → 14/08/2026 */
export function formatearFecha(fecha: FechaISO | null): string {
  if (!fecha) return 'sin fecha';
  return `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}/${fecha.slice(0, 4)}`;
}

/** Sugerencias de consumo rápido según la unidad (menos fricción que teclear). */
export function pasosRapidos(unidad: Unidad): number[] {
  switch (unidad) {
    case 'unidades':
      return [1, 2, 3, 4];
    case 'g':
      return [50, 100, 200, 500];
    case 'ml':
      return [100, 250, 500, 1000];
    default:
      return [0.1, 0.25, 0.5, 1];
  }
}

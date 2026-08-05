import type { FechaISO } from './tipos';

const MS_DIA = 86_400_000;

/**
 * Redondeo a 3 decimales. Las cantidades de despensa (0,1 l, 250 g) se
 * suman y se restan muchas veces; sin esto el stock acaba en 0.30000000004.
 */
export function redondear(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Convierte una fecha de calendario en un instante UTC a medianoche. */
export function aDia(fecha: FechaISO): number {
  return Date.parse(`${fecha}T00:00:00Z`);
}

/** La fecha de calendario de "hoy" en la zona horaria local del usuario. */
export function hoyISO(ahora: Date = new Date()): FechaISO {
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Días naturales que faltan para `fecha`. Negativo si ya pasó,
 * 0 si es hoy, `null` si el lote no tiene fecha de caducidad.
 */
export function diasHasta(fecha: FechaISO | null, hoy: FechaISO = hoyISO()): number | null {
  if (!fecha) return null;
  return Math.round((aDia(fecha) - aDia(hoy)) / MS_DIA);
}

/** Suma días a una fecha de calendario (útil en tests y en seeds). */
export function sumarDias(fecha: FechaISO, dias: number): FechaISO {
  return new Date(aDia(fecha) + dias * MS_DIA).toISOString().slice(0, 10);
}

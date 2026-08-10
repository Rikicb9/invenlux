import { UBICACION_SUGERIDA } from './catalogo';
import { diasHasta, hoyISO } from './fechas';
import { loteSiguiente } from './fefo';
import { formatearCantidad } from './formato';
import { stockDeProducto } from './stock';
import { normalizar, parecido } from './texto';
import type { AjustesHogar, Lote, Movimiento, Producto, Unidad } from './tipos';

/**
 * Planificador de menú semanal.
 *
 * En el Sprint 3 la generación la hará el asistente de IA; estas reglas son
 * las que se le pedirá que respete y las que permiten validar el flujo hoy
 * sin depender de red: aprovechar lo que caduca, equilibrar la semana y
 * atender lo que pide el usuario.
 */

export type BaseReceta = 'carne' | 'pescado' | 'legumbre' | 'verdura' | 'huevo' | 'pasta';
export type EtiquetaReceta = 'rapido' | 'ligero' | 'vegetariano' | 'horno' | 'batch';

export interface Ingrediente {
  nombre: string;
  cantidad: number;
  unidad: Unidad;
}

export interface Receta {
  nombre: string;
  base: BaseReceta;
  etiquetas: EtiquetaReceta[];
  minutos: number;
  ingredientes: Ingrediente[];
}

const r = (
  nombre: string,
  base: BaseReceta,
  etiquetas: EtiquetaReceta[],
  minutos: number,
  ingredientes: Array<[string, number, Unidad]>,
): Receta => ({
  nombre,
  base,
  etiquetas,
  minutos,
  ingredientes: ingredientes.map(([n, c, u]) => ({ nombre: n, cantidad: c, unidad: u })),
});

export const RECETAS: Receta[] = [
  r('Pollo al horno con patatas', 'carne', ['horno'], 60, [['Pollo', 600, 'g'], ['Patata', 500, 'g'], ['Cebolla', 1, 'unidades'], ['Aceite de oliva', 0.03, 'l']]),
  r('Merluza a la plancha con espinacas', 'pescado', ['rapido', 'ligero'], 20, [['Merluza', 400, 'g'], ['Espinacas', 200, 'g'], ['Ajo', 2, 'unidades'], ['Limón', 1, 'g']]),
  r('Lentejas guisadas', 'legumbre', ['batch'], 45, [['Lentejas', 300, 'g'], ['Zanahoria', 2, 'g'], ['Cebolla', 1, 'unidades'], ['Chorizo', 100, 'g']]),
  r('Tortilla de patatas con ensalada', 'huevo', ['rapido'], 30, [['Huevos', 6, 'unidades'], ['Patata', 500, 'g'], ['Cebolla', 1, 'unidades'], ['Lechuga', 1, 'unidades']]),
  r('Ensalada de garbanzos', 'legumbre', ['rapido', 'ligero', 'vegetariano'], 15, [['Garbanzos', 300, 'g'], ['Tomate', 200, 'g'], ['Pepino', 1, 'unidades'], ['Aceitunas', 50, 'g']]),
  r('Arroz con verduras', 'verdura', ['vegetariano', 'ligero'], 35, [['Arroz', 300, 'g'], ['Pimiento', 1, 'g'], ['Calabacín', 1, 'g'], ['Zanahoria', 1, 'g']]),
  r('Pasta con tomate y atún', 'pescado', ['rapido'], 20, [['Pasta', 300, 'g'], ['Tomate frito', 200, 'g'], ['Atún en lata', 2, 'unidades']]),
  r('Crema de calabacín', 'verdura', ['vegetariano', 'ligero', 'rapido'], 25, [['Calabacín', 3, 'g'], ['Patata', 1, 'kg'], ['Cebolla', 1, 'unidades'], ['Nata', 100, 'ml']]),
  r('Salmón al horno con pimientos', 'pescado', ['horno', 'ligero'], 35, [['Salmón', 400, 'g'], ['Pimiento', 2, 'g'], ['Cebolla', 1, 'unidades']]),
  r('Pollo al curry con arroz', 'carne', [], 40, [['Pollo', 500, 'g'], ['Arroz', 250, 'g'], ['Cebolla', 1, 'unidades'], ['Nata', 100, 'ml']]),
  r('Revuelto de champiñones', 'huevo', ['rapido', 'vegetariano', 'ligero'], 15, [['Huevos', 4, 'unidades'], ['Champiñones', 250, 'g'], ['Ajo', 2, 'unidades']]),
  r('Judías verdes con patata', 'verdura', ['vegetariano', 'ligero'], 30, [['Judías verdes', 400, 'g'], ['Patata', 300, 'g'], ['Aceite de oliva', 0.02, 'l']]),
  r('Sopa de verduras', 'verdura', ['vegetariano', 'ligero'], 35, [['Caldo', 1, 'l'], ['Zanahoria', 2, 'g'], ['Puerro', 1, 'g'], ['Patata', 2, 'kg']]),
  r('Berenjenas rellenas', 'carne', ['horno'], 50, [['Berenjena', 2, 'g'], ['Carne picada', 300, 'g'], ['Tomate frito', 150, 'g'], ['Queso', 80, 'g']]),
  r('Dorada al horno', 'pescado', ['horno', 'ligero'], 40, [['Dorada', 600, 'g'], ['Patata', 400, 'g'], ['Limón', 1, 'g']]),
  r('Pisto con huevo', 'verdura', ['vegetariano'], 45, [['Calabacín', 1, 'g'], ['Berenjena', 1, 'g'], ['Pimiento', 1, 'g'], ['Tomate', 400, 'g'], ['Huevos', 2, 'unidades']]),
  r('Macarrones gratinados', 'pasta', ['vegetariano'], 35, [['Pasta', 300, 'g'], ['Tomate triturado', 300, 'g'], ['Queso', 100, 'g']]),
  r('Guisantes con jamón', 'verdura', ['rapido'], 25, [['Guisantes congelados', 400, 'g'], ['Jamón serrano', 100, 'g'], ['Cebolla', 1, 'unidades']]),
  r('Pescado al horno con brócoli', 'pescado', ['horno', 'ligero'], 35, [['Pescado congelado', 400, 'g'], ['Brócoli', 300, 'g'], ['Ajo', 2, 'unidades']]),
  r('Ternera guisada', 'carne', ['batch'], 75, [['Ternera', 500, 'g'], ['Patata', 400, 'g'], ['Zanahoria', 2, 'g'], ['Cebolla', 1, 'unidades']]),
  r('Ensalada de pollo y queso', 'carne', ['rapido', 'ligero'], 15, [['Lechuga', 1, 'unidades'], ['Pollo', 300, 'g'], ['Queso', 50, 'g'], ['Tomate', 150, 'g']]),
  r('Alubias con verduras', 'legumbre', ['vegetariano', 'batch'], 45, [['Alubias', 300, 'g'], ['Zanahoria', 2, 'g'], ['Puerro', 1, 'g'], ['Pimiento', 1, 'g']]),
];

export const DIAS_SEMANA = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo',
] as const;

export interface Despensa {
  productos: readonly Producto[];
  lotes: readonly Lote[];
  movimientos: readonly Movimiento[];
  ajustes: AjustesHogar;
}

export type ClaveIngrediente = 'ok' | 'poco' | 'falta';

export interface EstadoIngrediente {
  clave: ClaveIngrediente;
  texto: string;
  producto: Producto | null;
}

/** Cruza un ingrediente de la receta con lo que hay en casa. */
export function estadoIngrediente(ing: Ingrediente, d: Despensa): EstadoIngrediente {
  const producto =
    d.productos.find((p) => normalizar(p.nombre) === normalizar(ing.nombre)) ??
    d.productos.find((p) => parecido(ing.nombre, p.nombre) >= 0.85) ??
    null;

  if (!producto) return { clave: 'falta', texto: 'no lo tienes', producto: null };

  const stock = stockDeProducto(producto.id, d.movimientos);
  if (stock <= 0) return { clave: 'falta', texto: 'sin stock', producto };
  if (producto.unidad === ing.unidad && stock < ing.cantidad) {
    return { clave: 'poco', texto: `sólo ${formatearCantidad(stock, producto.unidad)}`, producto };
  }
  return { clave: 'ok', texto: `${formatearCantidad(stock, producto.unidad)} en casa`, producto };
}

export interface Preferencias {
  vegetariano: boolean;
  rapido: boolean;
  ligero: boolean;
  pescado: boolean;
  horno: boolean;
}

/** Lectura de la petición del usuario. En Sprint 3 lo hará el modelo. */
export function leerPeticion(texto: string): Preferencias {
  const t = normalizar(texto);
  return {
    vegetariano: /(vegetarian|sin carne|sin pescado|verdur)/.test(t),
    rapido: /(rapid|facil|poco tiempo|sin complicar|15 min|20 min|30 min)/.test(t),
    ligero: /(liger|sano|saludable|dieta|bajo|adelgaz)/.test(t),
    pescado: /pescado/.test(t) && !/sin pescado/.test(t),
    horno: /horno/.test(t),
  };
}

export interface DiaMenu {
  dia: string;
  receta: Receta;
}

/** Cuánto ayuda una receta a gastar lo que está a punto de caducar. */
function urgenciaDe(receta: Receta, d: Despensa, hoy: string): number {
  let puntos = 0;
  for (const ing of receta.ingredientes) {
    const e = estadoIngrediente(ing, d);
    if (!e.producto || e.clave === 'falta') continue;
    const siguiente = loteSiguiente(e.producto.id, d.lotes, d.movimientos, d.ajustes.estrategia);
    const dias = diasHasta(siguiente?.fCaducidad ?? null, hoy);
    if (dias === null) continue;
    if (dias <= d.ajustes.diasAviso) puntos += 4;
    else if (dias <= 7) puntos += 2;
  }
  return puntos;
}

/**
 * Genera el plan. Equilibra la semana: no repite base dos días seguidos y
 * limita la carne a un 40% de los días.
 */
export function generarPlan(
  peticion: string,
  dias: number,
  d: Despensa,
  hoy: string = hoyISO(),
): { plan: DiaMenu[]; preferencias: Preferencias } {
  const pref = leerPeticion(peticion);

  const puntuadas = RECETAS.filter((rec) => !pref.vegetariano || rec.etiquetas.includes('vegetariano'))
    .map((rec) => {
      let puntos = urgenciaDe(rec, d, hoy);
      for (const ing of rec.ingredientes) {
        if (estadoIngrediente(ing, d).clave === 'ok') puntos += 1;
      }
      if (pref.rapido) puntos += rec.etiquetas.includes('rapido') ? 3 : rec.minutos <= 30 ? 1 : -2;
      if (pref.ligero) puntos += rec.etiquetas.includes('ligero') ? 3 : 0;
      if (pref.pescado) puntos += rec.base === 'pescado' ? 3 : 0;
      if (pref.horno) puntos += rec.etiquetas.includes('horno') ? 2 : 0;
      return { receta: rec, puntos };
    })
    .sort((a, b) => b.puntos - a.puntos);

  const plan: DiaMenu[] = [];
  const usadas = new Set<string>();
  const topeCarne = Math.max(2, Math.round(dias * 0.4));
  let carne = 0;
  let baseAnterior: BaseReceta | null = null;

  for (let i = 0; i < dias && i < DIAS_SEMANA.length; i++) {
    let elegida = puntuadas.find(
      ({ receta }) =>
        !usadas.has(receta.nombre) &&
        receta.base !== baseAnterior &&
        !(receta.base === 'carne' && carne >= topeCarne),
    );
    if (!elegida) elegida = puntuadas.find(({ receta }) => !usadas.has(receta.nombre));
    if (!elegida) break;

    usadas.add(elegida.receta.nombre);
    if (elegida.receta.base === 'carne') carne++;
    baseAnterior = elegida.receta.base;
    plan.push({ dia: DIAS_SEMANA[i], receta: elegida.receta });
  }

  return { plan, preferencias: pref };
}

export interface Faltante {
  nombre: string;
  producto: Producto | null;
  motivo: ClaveIngrediente;
}

/** Ingredientes del plan que no están o no llegan, sin repetir. */
export function faltantesDelPlan(plan: readonly DiaMenu[], d: Despensa): Faltante[] {
  const vistos = new Set<string>();
  const faltan: Faltante[] = [];

  for (const { receta } of plan) {
    for (const ing of receta.ingredientes) {
      const clave = normalizar(ing.nombre);
      if (vistos.has(clave)) continue;
      const e = estadoIngrediente(ing, d);
      if (e.clave === 'ok') continue;
      vistos.add(clave);
      faltan.push({ nombre: ing.nombre, producto: e.producto, motivo: e.clave });
    }
  }
  return faltan;
}

/** Productos a punto de caducar que el plan sí aprovecha. */
export function urgentesAprovechados(plan: readonly DiaMenu[], d: Despensa, hoy = hoyISO()): string[] {
  const nombres = new Set<string>();
  for (const { receta } of plan) {
    for (const ing of receta.ingredientes) {
      const e = estadoIngrediente(ing, d);
      if (!e.producto || e.clave === 'falta') continue;
      const siguiente = loteSiguiente(e.producto.id, d.lotes, d.movimientos, d.ajustes.estrategia);
      const dias = diasHasta(siguiente?.fCaducidad ?? null, hoy);
      if (dias !== null && dias <= d.ajustes.diasAviso) nombres.add(e.producto.nombre);
    }
  }
  return [...nombres];
}

/** Productos a punto de caducar que el plan deja fuera. */
function urgentesIgnorados(plan: readonly DiaMenu[], d: Despensa, hoy: string): string[] {
  const aprovechados = new Set(urgentesAprovechados(plan, d, hoy));
  const fuera: string[] = [];
  for (const p of d.productos) {
    if (aprovechados.has(p.nombre)) continue;
    if (stockDeProducto(p.id, d.movimientos) <= 0) continue;
    const siguiente = loteSiguiente(p.id, d.lotes, d.movimientos, d.ajustes.estrategia);
    const dias = diasHasta(siguiente?.fCaducidad ?? null, hoy);
    if (dias !== null && dias <= d.ajustes.diasAviso) fuera.push(p.nombre);
  }
  return fuera;
}

const enumerar = (xs: string[]): string =>
  xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`;

/** Respuesta del asistente: qué ha tenido en cuenta y qué falta. */
export function mensajeAsistente(
  plan: readonly DiaMenu[],
  pref: Preferencias,
  d: Despensa,
  hoy: string = hoyISO(),
): string {
  const criterios: string[] = [];
  if (pref.vegetariano) criterios.push('sin carne ni pescado');
  if (pref.rapido) criterios.push('recetas rápidas');
  if (pref.ligero) criterios.push('platos ligeros');
  if (pref.pescado) criterios.push('más pescado');
  if (pref.horno) criterios.push('al horno');

  let texto = `Menú de ${plan.length} días listo`;
  texto += criterios.length ? ` (${criterios.join(', ')}).` : '.';

  const aprovechados = urgentesAprovechados(plan, d, hoy);
  const ignorados = urgentesIgnorados(plan, d, hoy);

  if (aprovechados.length) {
    texto += ` He colocado primero lo que caduca pronto: ${enumerar(aprovechados)}.`;
  } else if (ignorados.length) {
    const v = ignorados.length === 1;
    texto += ` Ojo: ${enumerar(ignorados)} ${v ? 'caduca' : 'caducan'} pronto y no ${v ? 'encaja' : 'encajan'} con lo que me pides.`;
  } else {
    texto += ' No tienes nada a punto de caducar, así que he priorizado lo que ya hay en casa.';
  }

  const faltan = faltantesDelPlan(plan, d).length;
  texto += faltan
    ? ` Te faltan ${faltan} ingredientes: puedes mandarlos a la compra de una vez.`
    : ' Tienes todos los ingredientes en casa.';

  return texto;
}

export { UBICACION_SUGERIDA };

/**
 * Comparación de nombres de producto.
 * Sostiene dos cosas: que un fallo de escritura no cree un duplicado
 * ("Yogurt" vs "Yogur"), y el buscador del catálogo. En el Sprint 3 será
 * también lo que decida si una línea de ticket OCR es un producto que ya
 * existe o uno nuevo.
 */

/** Minúsculas, sin tildes, sin signos y con espacios colapsados. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Distancia de Levenshtein con dos filas, suficiente para nombres cortos. */
export function distanciaEdicion(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;

  let previa = Array.from({ length: n + 1 }, (_, j) => j);
  let actual = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    actual[0] = i;
    for (let j = 1; j <= n; j++) {
      actual[j] = Math.min(
        previa[j] + 1,
        actual[j - 1] + 1,
        previa[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    [previa, actual] = [actual, previa];
  }
  return previa[n];
}

/**
 * Parecido entre 0 y 1. Además de la distancia de edición contempla el
 * comienzo de palabra, para que "yogur" encuentre "Yogur natural".
 */
export function parecido(a: string, b: string): number {
  const x = normalizar(a);
  const y = normalizar(b);
  if (!x || !y) return 0;
  if (x === y) return 1;

  if (x.length >= 3 && y.split(' ').some((w) => w.startsWith(x) || x.startsWith(w))) return 0.88;

  // Contención sólo con trozos largos: evita que "té" case con "manTEquilla".
  const corto = x.length < y.length ? x : y;
  if (corto.length >= 4 && (x.includes(y) || y.includes(x))) return 0.9;

  return 1 - distanciaEdicion(x, y) / Math.max(x.length, y.length);
}

/** Por debajo de esto, dos nombres se consideran productos distintos. */
export const UMBRAL_SIMILITUD = 0.72;

export const mismoNombre = (a: string, b: string): boolean => normalizar(a) === normalizar(b);

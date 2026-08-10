import { formatearCantidad } from './formato';
import { normalizar, parecido, UMBRAL_SIMILITUD } from './texto';
import type { Categoria, Movimiento, Producto, Ubicacion, Unidad } from './tipos';
import { stockDeProducto } from './stock';

/**
 * Catálogo de productos comunes de supermercado.
 * Criterio: un producto básico por alimento ("Merluza", no "Merluza en
 * filetes"). Si el usuario necesita precisar, crea el suyo y pasa a formar
 * parte de su lista.
 */
export interface ProductoCatalogo {
  nombre: string;
  categoria: Categoria;
  unidad: Unidad;
  /** Vida útil típica en días desde la compra. `null` si no caduca. */
  vida: number | null;
}

type Fila = [string, Unidad, number | null];

const POR_CATEGORIA: Record<Categoria, Fila[]> = {
  'Lácteos': [
    ['Leche', 'l', 90], ['Yogur', 'unidades', 21], ['Queso', 'g', 30],
    ['Mantequilla', 'g', 60], ['Nata', 'ml', 60], ['Huevos', 'unidades', 28],
  ],
  'Carne y pescado': [
    ['Pollo', 'g', 3], ['Pavo', 'g', 3], ['Ternera', 'g', 3], ['Cerdo', 'g', 3],
    ['Cordero', 'g', 3], ['Conejo', 'g', 3], ['Carne picada', 'g', 2],
    ['Bacon', 'g', 14], ['Jamón cocido', 'g', 7], ['Jamón serrano', 'g', 30],
    ['Chorizo', 'g', 30], ['Salchichas', 'unidades', 5],
    ['Merluza', 'g', 2], ['Salmón', 'g', 2], ['Bacalao', 'g', 2], ['Dorada', 'g', 2],
    ['Lubina', 'g', 2], ['Atún', 'g', 2], ['Sardinas', 'g', 1], ['Boquerones', 'g', 1],
    ['Gambas', 'g', 2], ['Mejillones', 'kg', 2], ['Almejas', 'g', 2],
    ['Calamares', 'g', 2], ['Pulpo', 'g', 2],
  ],
  'Fruta y verdura': [
    ['Manzana', 'g', 20], ['Plátano', 'g', 6], ['Naranja', 'g', 14], ['Mandarina', 'g', 10],
    ['Pera', 'g', 12], ['Uva', 'g', 7], ['Fresa', 'g', 4], ['Melón', 'unidades', 10],
    ['Sandía', 'unidades', 10], ['Kiwi', 'g', 14], ['Limón', 'g', 21], ['Aguacate', 'unidades', 5],
    ['Piña', 'unidades', 7], ['Melocotón', 'g', 6], ['Ciruela', 'g', 7], ['Cereza', 'g', 5],
    ['Tomate', 'g', 7], ['Lechuga', 'unidades', 7], ['Espinacas', 'g', 4],
    ['Zanahoria', 'g', 21], ['Cebolla', 'g', 30], ['Ajo', 'unidades', 60], ['Patata', 'kg', 30],
    ['Pimiento', 'g', 10], ['Calabacín', 'g', 10], ['Berenjena', 'g', 10],
    ['Brócoli', 'g', 7], ['Coliflor', 'unidades', 7], ['Champiñones', 'g', 5],
    ['Judías verdes', 'g', 6], ['Pepino', 'unidades', 7], ['Puerro', 'g', 10],
    ['Apio', 'unidades', 10], ['Calabaza', 'g', 30], ['Jengibre', 'g', 21],
  ],
  'Despensa': [
    ['Arroz', 'kg', 730], ['Pasta', 'g', 730], ['Harina', 'kg', 365], ['Pan', 'unidades', 3],
    ['Pan de molde', 'unidades', 10], ['Pan rallado', 'g', 180],
    ['Azúcar', 'kg', 1095], ['Sal', 'kg', 1825], ['Pimienta', 'g', 730], ['Especias', 'g', 730],
    ['Aceite de oliva', 'l', 540], ['Aceite de girasol', 'l', 365], ['Vinagre', 'l', 730],
    ['Lentejas', 'g', 730], ['Garbanzos', 'g', 730], ['Alubias', 'g', 730],
    ['Tomate frito', 'g', 365], ['Tomate triturado', 'g', 540],
    ['Atún en lata', 'unidades', 1095], ['Aceitunas', 'g', 365],
    ['Galletas', 'g', 180], ['Cereales', 'g', 180], ['Café', 'g', 365], ['Té', 'unidades', 540],
    ['Cacao soluble', 'g', 365], ['Miel', 'g', 730], ['Mermelada', 'g', 540],
    ['Caldo', 'l', 365], ['Mayonesa', 'ml', 120], ['Kétchup', 'ml', 365], ['Mostaza', 'ml', 365],
    ['Levadura', 'g', 365], ['Chocolate', 'g', 365], ['Almendras', 'g', 180], ['Nueces', 'g', 180],
  ],
  'Congelados': [
    ['Guisantes congelados', 'g', 365], ['Verduras congeladas', 'g', 365],
    ['Patatas fritas congeladas', 'g', 365], ['Pescado congelado', 'g', 270],
    ['Marisco congelado', 'g', 270], ['Pizza congelada', 'unidades', 270],
    ['Croquetas', 'unidades', 270], ['Helado', 'l', 270], ['Hielo', 'kg', 365],
  ],
  'Bebidas': [
    ['Agua', 'l', 365], ['Agua con gas', 'l', 365], ['Zumo', 'l', 180],
    ['Refresco', 'l', 270], ['Cerveza', 'unidades', 270], ['Vino', 'unidades', 730],
    ['Bebida vegetal', 'l', 180],
  ],
  'Otros': [
    ['Papel de cocina', 'unidades', null], ['Papel higiénico', 'unidades', null],
    ['Servilletas', 'unidades', null], ['Bolsas de basura', 'unidades', null],
    ['Film transparente', 'unidades', null], ['Papel de aluminio', 'unidades', null],
    ['Papel de horno', 'unidades', null], ['Detergente', 'l', null], ['Suavizante', 'l', null],
    ['Lavavajillas', 'l', null], ['Limpiador multiusos', 'ml', null], ['Lejía', 'l', null],
    ['Esponjas', 'unidades', null], ['Jabón de manos', 'ml', null], ['Champú', 'ml', null],
    ['Gel de ducha', 'ml', null], ['Pasta de dientes', 'unidades', null],
    ['Desodorante', 'unidades', null], ['Comida para perro', 'kg', 180],
    ['Comida para gato', 'kg', 180], ['Pilas', 'unidades', null],
  ],
};

export const CATALOGO: ProductoCatalogo[] = (
  Object.entries(POR_CATEGORIA) as Array<[Categoria, Fila[]]>
).flatMap(([categoria, filas]) =>
  filas.map(([nombre, unidad, vida]) => ({ nombre, categoria, unidad, vida })),
);

/**
 * Dónde se guarda cada categoría por defecto. Es la regla que aplicará el
 * OCR de tickets del Sprint 3: guardar donde toca salvo indicación contraria.
 */
export const UBICACION_SUGERIDA: Record<Categoria, Ubicacion> = {
  'Lácteos': 'Nevera',
  'Carne y pescado': 'Nevera',
  'Fruta y verdura': 'Nevera',
  'Congelados': 'Congelador',
  'Despensa': 'Despensa',
  'Bebidas': 'Despensa',
  'Otros': 'Despensa',
};

/** Una fila del buscador: o un producto que ya tienes, o uno del catálogo. */
export interface OpcionProducto {
  /** `p:<id>` si ya existe en el inventario, `c:<índice>` si es del catálogo. */
  clave: string;
  nombre: string;
  categoria: Categoria;
  unidad: Unidad;
  stock: number;
  vida: number | null;
  /** Cuánto queda, ya formateado. Vacío si no hay stock. */
  detalle: string;
}

/** Une lo que hay en casa con el catálogo, sin duplicar. */
export function opcionesDeProducto(
  productos: readonly Producto[],
  movimientos: readonly Movimiento[],
): OpcionProducto[] {
  const mios = new Map(productos.map((p) => [normalizar(p.nombre), p]));
  const usados = new Set<string>();
  const filas: OpcionProducto[] = [];

  const desdeProducto = (p: Producto): OpcionProducto => {
    const stock = stockDeProducto(p.id, movimientos);
    return {
      clave: `p:${p.id}`,
      nombre: p.nombre,
      categoria: p.categoria,
      unidad: p.unidad,
      stock,
      vida: null,
      detalle: stock > 0 ? formatearCantidad(stock, p.unidad) : '',
    };
  };

  CATALOGO.forEach((c, i) => {
    const clave = normalizar(c.nombre);
    const mio = mios.get(clave);
    if (mio) {
      usados.add(clave);
      filas.push(desdeProducto(mio));
    } else {
      filas.push({
        clave: `c:${i}`,
        nombre: c.nombre,
        categoria: c.categoria,
        unidad: c.unidad,
        stock: 0,
        vida: c.vida,
        detalle: '',
      });
    }
  });

  // Lo que creó el usuario y no está en el catálogo
  for (const p of productos) {
    if (!usados.has(normalizar(p.nombre))) filas.push(desdeProducto(p));
  }

  return filas;
}

/**
 * Filtra por lo que se va escribiendo. Prioriza, de más a menos:
 * empieza por, empieza una palabra por, contiene, y por último tolera erratas.
 */
export function filtrarOpciones(
  opciones: readonly OpcionProducto[],
  consulta: string,
): OpcionProducto[] {
  const q = normalizar(consulta);
  if (!q) return [...opciones];

  return opciones
    .map((o) => {
      const m = normalizar(o.nombre);
      let peso = 0;
      if (m.startsWith(q)) peso = 4;
      else if (m.split(' ').some((w) => w.startsWith(q))) peso = 3;
      else if (m.includes(q)) peso = 2;
      else if (parecido(consulta, o.nombre) >= UMBRAL_SIMILITUD) peso = 1;
      return { o, peso };
    })
    .filter((x) => x.peso > 0)
    .sort((a, b) => b.peso - a.peso || a.o.nombre.localeCompare(b.o.nombre, 'es'))
    .map((x) => x.o);
}

/** Agrupa por categoría, alfabético dentro de cada una. Para la lista sin filtrar. */
export function agruparPorCategoria(
  opciones: readonly OpcionProducto[],
): Array<{ categoria: Categoria; opciones: OpcionProducto[] }> {
  const categorias = [...new Set(opciones.map((o) => o.categoria))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  );
  return categorias.map((categoria) => ({
    categoria,
    opciones: opciones
      .filter((o) => o.categoria === categoria)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
  }));
}

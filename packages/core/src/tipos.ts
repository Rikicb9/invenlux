/**
 * Tipos del dominio de Invenlux.
 * Espejo del modelo de datos de `Stack_Tecnico_Invenlux.md`.
 *
 * Convención: las fechas de calendario (compra, caducidad) son cadenas
 * ISO `YYYY-MM-DD` — un día natural, sin hora ni zona horaria. Los
 * instantes (cuándo se registró un movimiento) son ISO completos.
 */

export type FechaISO = string; // YYYY-MM-DD
export type InstanteISO = string; // YYYY-MM-DDTHH:mm:ss.sssZ

export type Ubicacion = 'Nevera' | 'Congelador' | 'Despensa';

export const UBICACIONES: readonly Ubicacion[] = ['Nevera', 'Congelador', 'Despensa'];

export type Unidad = 'unidades' | 'g' | 'kg' | 'ml' | 'l';

export const UNIDADES: readonly Unidad[] = ['unidades', 'g', 'kg', 'ml', 'l'];

export const CATEGORIAS = [
  'Lácteos',
  'Carne y pescado',
  'Fruta y verdura',
  'Despensa',
  'Congelados',
  'Bebidas',
  'Otros',
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

/** Cómo entró el lote en casa. Sprint 1 sólo produce 'manual'. */
export type OrigenLote = 'manual' | 'barcode' | 'ticket' | 'email';

/** Estrategia de salida de stock. Sprint 1 sólo implementa FEFO. */
export type Estrategia = 'FEFO' | 'FIFO' | 'LIFO';

export interface Producto {
  id: string;
  hogarId: string;
  nombre: string;
  categoria: Categoria;
  unidad: Unidad;
  stockMin: number;
  /** Si al bajar del mínimo entra solo en la lista de la compra. */
  autoCompra: boolean;
}

export interface Lote {
  id: string;
  productoId: string;
  cantidadInicial: number;
  fCompra: FechaISO;
  fCaducidad: FechaISO | null;
  ubicacion: Ubicacion;
  precio?: number | null;
  origen: OrigenLote;
}

export type TipoMovimiento = 'entrada' | 'consumo' | 'merma' | 'ajuste';

/**
 * Registro inmutable. Nunca se actualiza ni se borra: corregir un error
 * es un movimiento de tipo 'ajuste'.
 *
 * `cantidad` es positiva para 'entrada', positiva para 'consumo' y 'merma'
 * (la resta la aplica el signo del tipo) y con signo para 'ajuste'.
 */
export interface Movimiento {
  id: string;
  loteId: string;
  productoId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  fecha: InstanteISO;
  usuarioId?: string | null;
}

export type OrigenItemCompra = 'manual' | 'agotado' | 'stock-minimo' | 'menu';

export interface ItemCompra {
  id: string;
  hogarId: string;
  texto: string;
  productoId: string | null;
  origen: OrigenItemCompra;
  comprado: boolean;
}

export interface AjustesHogar {
  /** Días de antelación con los que avisar de una caducidad. */
  diasAviso: number;
  estrategia: Estrategia;
}

export const AJUSTES_POR_DEFECTO: AjustesHogar = {
  diasAviso: 3,
  estrategia: 'FEFO',
};

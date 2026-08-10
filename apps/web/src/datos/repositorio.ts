import type {
  AjustesHogar,
  Categoria,
  Estrategia,
  ItemCompra,
  Lote,
  Movimiento,
  Producto,
  Ubicacion,
  Unidad,
} from '@invenlux/core';
import { hogarActual, usuarioActual } from './sesion';
import { supabase } from './supabase';

/**
 * Acceso a datos contra Supabase (Postgres, región UE).
 *
 * La app escribe directamente en la nube, sin capa de sincronización local:
 * decisión consciente que aplaza el principio "offline desde el diseño" del
 * stack porque se da por buena la cobertura en la cocina. Los movimientos
 * siguen siendo append-only, que es lo que haría viable añadir sincronización
 * más adelante sin conflictos.
 */

/** Los ids son UUID porque las columnas de Postgres lo son. */
export const nuevoId = (): string => crypto.randomUUID();

export interface EstadoHogar {
  ajustes: AjustesHogar;
  productos: Producto[];
  lotes: Lote[];
  movimientos: Movimiento[];
  lista: ItemCompra[];
}

export async function leerHogar(): Promise<EstadoHogar> {
  const hogarId = hogarActual();

  const [hogar, productos, lista] = await Promise.all([
    supabase.from('hogar').select('dias_aviso, estrategia').eq('id', hogarId).single(),
    supabase.from('producto').select('*').eq('hogar_id', hogarId).order('nombre'),
    supabase.from('lista_compra').select('*').eq('hogar_id', hogarId),
  ]);

  if (hogar.error) throw hogar.error;
  if (productos.error) throw productos.error;
  if (lista.error) throw lista.error;

  const ids = (productos.data ?? []).map((p) => p.id as string);

  // Sin productos no hay lotes ni movimientos que pedir.
  const [lotes, movimientos] = ids.length
    ? await Promise.all([
        supabase.from('lote').select('*').in('producto_id', ids),
        supabase.from('movimiento').select('*').in('producto_id', ids).order('fecha', { ascending: false }),
      ])
    : [
        { data: [] as Record<string, unknown>[], error: null },
        { data: [] as Record<string, unknown>[], error: null },
      ];

  if (lotes.error) throw lotes.error;
  if (movimientos.error) throw movimientos.error;

  return {
    ajustes: {
      diasAviso: hogar.data.dias_aviso as number,
      estrategia: hogar.data.estrategia as Estrategia,
    },
    productos: (productos.data ?? []).map(
      (f): Producto => ({
        id: f.id as string,
        hogarId: f.hogar_id as string,
        nombre: f.nombre as string,
        categoria: f.categoria as Categoria,
        unidad: f.unidad as Unidad,
        stockMin: Number(f.stock_min),
        autoCompra: Boolean(f.auto_compra),
      }),
    ),
    lotes: (lotes.data ?? []).map(
      (f): Lote => ({
        id: f.id as string,
        productoId: f.producto_id as string,
        cantidadInicial: Number(f.cantidad_inicial),
        fCompra: f.f_compra as string,
        fCaducidad: (f.f_caducidad as string | null) ?? null,
        ubicacion: f.ubicacion as Ubicacion,
        precio: (f.precio as number | null) ?? null,
        origen: f.origen as Lote['origen'],
      }),
    ),
    movimientos: (movimientos.data ?? []).map(
      (f): Movimiento => ({
        id: f.id as string,
        loteId: f.lote_id as string,
        productoId: f.producto_id as string,
        tipo: f.tipo as Movimiento['tipo'],
        cantidad: Number(f.cantidad),
        fecha: f.fecha as string,
        usuarioId: (f.usuario_id as string | null) ?? null,
      }),
    ),
    lista: (lista.data ?? []).map(
      (f): ItemCompra => ({
        id: f.id as string,
        hogarId: f.hogar_id as string,
        texto: f.texto as string,
        productoId: (f.producto_id as string | null) ?? null,
        origen: f.origen as ItemCompra['origen'],
        comprado: Boolean(f.comprado),
      }),
    ),
  };
}

export async function guardarProducto(p: Producto): Promise<void> {
  const { error } = await supabase.from('producto').upsert({
    id: p.id,
    hogar_id: p.hogarId,
    nombre: p.nombre,
    categoria: p.categoria,
    unidad: p.unidad,
    stock_min: p.stockMin,
    auto_compra: p.autoCompra,
  });
  if (error) throw error;
}

export async function guardarLote(l: Lote): Promise<void> {
  const { error } = await supabase.from('lote').insert({
    id: l.id,
    producto_id: l.productoId,
    cantidad_inicial: l.cantidadInicial,
    f_compra: l.fCompra,
    f_caducidad: l.fCaducidad,
    ubicacion: l.ubicacion,
    precio: l.precio ?? null,
    origen: l.origen,
  });
  if (error) throw error;
}

/** Los movimientos sólo se insertan: corregir un error es un ajuste. */
export async function guardarMovimientos(movs: readonly Movimiento[]): Promise<void> {
  if (!movs.length) return;
  const { error } = await supabase.from('movimiento').insert(
    movs.map((m) => ({
      id: m.id,
      lote_id: m.loteId,
      producto_id: m.productoId,
      tipo: m.tipo,
      cantidad: m.cantidad,
      fecha: m.fecha,
      usuario_id: m.usuarioId ?? usuarioActual(),
    })),
  );
  if (error) throw error;
}

export async function guardarItemCompra(i: ItemCompra): Promise<void> {
  const { error } = await supabase.from('lista_compra').upsert({
    id: i.id,
    hogar_id: i.hogarId,
    texto: i.texto,
    producto_id: i.productoId,
    origen: i.origen,
    comprado: i.comprado,
  });
  if (error) throw error;
}

export async function borrarItemCompra(id: string): Promise<void> {
  const { error } = await supabase.from('lista_compra').delete().eq('id', id);
  if (error) throw error;
}

/** Borrado duro. Lotes y movimientos caen por ON DELETE CASCADE. */
export async function borrarProducto(productoId: string): Promise<void> {
  const { error } = await supabase.from('producto').delete().eq('id', productoId);
  if (error) throw error;
}

export async function guardarAjustes(a: AjustesHogar): Promise<void> {
  const { error } = await supabase
    .from('hogar')
    .update({ dias_aviso: a.diasAviso, estrategia: a.estrategia })
    .eq('id', hogarActual());
  if (error) throw error;
}

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
import * as SQLite from 'expo-sqlite';
import { migrar } from './esquema';

export const HOGAR_LOCAL = 'hogar-local';

let db: SQLite.SQLiteDatabase | null = null;

export async function abrirBD(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('invenlux.db');
  await migrar(db);
  await db.runAsync('INSERT OR IGNORE INTO hogar (id, nombre) VALUES (?, ?)', [
    HOGAR_LOCAL,
    'Mi casa',
  ]);
  return db;
}

/** Ids ordenables por tiempo: sirven de desempate estable en FEFO. */
export function nuevoId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface EstadoHogar {
  ajustes: AjustesHogar;
  productos: Producto[];
  lotes: Lote[];
  movimientos: Movimiento[];
  lista: ItemCompra[];
}

export async function leerHogar(): Promise<EstadoHogar> {
  const bd = await abrirBD();

  const hogar = await bd.getFirstAsync<{ dias_aviso: number; estrategia: string }>(
    'SELECT dias_aviso, estrategia FROM hogar WHERE id = ?',
    [HOGAR_LOCAL],
  );

  const productos = await bd.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM producto WHERE hogar_id = ? ORDER BY nombre COLLATE NOCASE',
    [HOGAR_LOCAL],
  );
  const lotes = await bd.getAllAsync<Record<string, unknown>>('SELECT * FROM lote');
  const movimientos = await bd.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM movimiento ORDER BY fecha DESC',
  );
  const lista = await bd.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM lista_compra WHERE hogar_id = ?',
    [HOGAR_LOCAL],
  );

  return {
    ajustes: {
      diasAviso: hogar?.dias_aviso ?? 3,
      estrategia: (hogar?.estrategia ?? 'FEFO') as Estrategia,
    },
    productos: productos.map(
      (f): Producto => ({
        id: f.id as string,
        hogarId: f.hogar_id as string,
        nombre: f.nombre as string,
        categoria: f.categoria as Categoria,
        unidad: f.unidad as Unidad,
        stockMin: f.stock_min as number,
        autoCompra: !!f.auto_compra,
      }),
    ),
    lotes: lotes.map(
      (f): Lote => ({
        id: f.id as string,
        productoId: f.producto_id as string,
        cantidadInicial: f.cantidad_inicial as number,
        fCompra: f.f_compra as string,
        fCaducidad: (f.f_caducidad as string | null) ?? null,
        ubicacion: f.ubicacion as Ubicacion,
        precio: (f.precio as number | null) ?? null,
        origen: f.origen as Lote['origen'],
      }),
    ),
    movimientos: movimientos.map(
      (f): Movimiento => ({
        id: f.id as string,
        loteId: f.lote_id as string,
        productoId: f.producto_id as string,
        tipo: f.tipo as Movimiento['tipo'],
        cantidad: f.cantidad as number,
        fecha: f.fecha as string,
        usuarioId: (f.usuario_id as string | null) ?? null,
      }),
    ),
    lista: lista.map(
      (f): ItemCompra => ({
        id: f.id as string,
        hogarId: f.hogar_id as string,
        texto: f.texto as string,
        productoId: (f.producto_id as string | null) ?? null,
        origen: f.origen as ItemCompra['origen'],
        comprado: !!f.comprado,
      }),
    ),
  };
}

export async function guardarProducto(p: Producto): Promise<void> {
  const bd = await abrirBD();
  await bd.runAsync(
    `INSERT INTO producto (id, hogar_id, nombre, categoria, unidad, stock_min, auto_compra)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       nombre = excluded.nombre, categoria = excluded.categoria, unidad = excluded.unidad,
       stock_min = excluded.stock_min, auto_compra = excluded.auto_compra`,
    [p.id, p.hogarId, p.nombre, p.categoria, p.unidad, p.stockMin, p.autoCompra ? 1 : 0],
  );
}

export async function guardarLote(l: Lote): Promise<void> {
  const bd = await abrirBD();
  await bd.runAsync(
    `INSERT INTO lote (id, producto_id, cantidad_inicial, f_compra, f_caducidad, ubicacion, precio, origen)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [l.id, l.productoId, l.cantidadInicial, l.fCompra, l.fCaducidad, l.ubicacion, l.precio ?? null, l.origen],
  );
}

/** Los movimientos sólo se insertan. No hay UPDATE ni DELETE en esta tabla. */
export async function guardarMovimientos(movs: readonly Movimiento[]): Promise<void> {
  if (!movs.length) return;
  const bd = await abrirBD();
  await bd.withTransactionAsync(async () => {
    for (const m of movs) {
      await bd.runAsync(
        `INSERT INTO movimiento (id, lote_id, producto_id, tipo, cantidad, fecha, usuario_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [m.id, m.loteId, m.productoId, m.tipo, m.cantidad, m.fecha, m.usuarioId ?? null],
      );
    }
  });
}

export async function guardarItemCompra(i: ItemCompra): Promise<void> {
  const bd = await abrirBD();
  await bd.runAsync(
    `INSERT INTO lista_compra (id, hogar_id, texto, producto_id, origen, comprado)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET texto = excluded.texto, comprado = excluded.comprado`,
    [i.id, i.hogarId, i.texto, i.productoId, i.origen, i.comprado ? 1 : 0],
  );
}

export async function borrarItemCompra(id: string): Promise<void> {
  const bd = await abrirBD();
  await bd.runAsync('DELETE FROM lista_compra WHERE id = ?', [id]);
}

export async function guardarAjustes(a: AjustesHogar): Promise<void> {
  const bd = await abrirBD();
  await bd.runAsync('UPDATE hogar SET dias_aviso = ?, estrategia = ? WHERE id = ?', [
    a.diasAviso,
    a.estrategia,
    HOGAR_LOCAL,
  ]);
}

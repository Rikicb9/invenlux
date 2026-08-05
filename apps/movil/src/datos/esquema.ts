import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Migraciones versionadas con `PRAGMA user_version`.
 * Nunca se edita una migración ya publicada: se añade la siguiente.
 */
const MIGRACIONES: Array<(db: SQLiteDatabase) => Promise<void>> = [
  // v1 — modelo del MVP (Sprint 1)
  async (db) => {
    await db.execAsync(`
      CREATE TABLE hogar (
        id           TEXT PRIMARY KEY NOT NULL,
        nombre       TEXT NOT NULL,
        zona_horaria TEXT NOT NULL DEFAULT 'Europe/Madrid',
        dias_aviso   INTEGER NOT NULL DEFAULT 3,
        estrategia   TEXT NOT NULL DEFAULT 'FEFO'
      );

      CREATE TABLE producto (
        id          TEXT PRIMARY KEY NOT NULL,
        hogar_id    TEXT NOT NULL REFERENCES hogar(id),
        nombre      TEXT NOT NULL,
        categoria   TEXT NOT NULL,
        unidad      TEXT NOT NULL,
        stock_min   REAL NOT NULL DEFAULT 0,
        auto_compra INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE lote (
        id               TEXT PRIMARY KEY NOT NULL,
        producto_id      TEXT NOT NULL REFERENCES producto(id),
        cantidad_inicial REAL NOT NULL,
        f_compra         TEXT NOT NULL,
        f_caducidad      TEXT,
        ubicacion        TEXT NOT NULL,
        precio           REAL,
        origen           TEXT NOT NULL DEFAULT 'manual'
      );

      -- Registro inmutable: sólo INSERT. Corregir es un movimiento de ajuste.
      CREATE TABLE movimiento (
        id          TEXT PRIMARY KEY NOT NULL,
        lote_id     TEXT NOT NULL REFERENCES lote(id),
        producto_id TEXT NOT NULL REFERENCES producto(id),
        tipo        TEXT NOT NULL,
        cantidad    REAL NOT NULL,
        fecha       TEXT NOT NULL,
        usuario_id  TEXT
      );

      CREATE TABLE lista_compra (
        id          TEXT PRIMARY KEY NOT NULL,
        hogar_id    TEXT NOT NULL REFERENCES hogar(id),
        texto       TEXT NOT NULL,
        producto_id TEXT REFERENCES producto(id),
        origen      TEXT NOT NULL,
        comprado    INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX idx_lote_producto ON lote(producto_id);
      CREATE INDEX idx_mov_lote      ON movimiento(lote_id);
      CREATE INDEX idx_mov_producto  ON movimiento(producto_id);
    `);
  },
];

export async function migrar(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = fila?.user_version ?? 0;

  for (let i = version; i < MIGRACIONES.length; i++) {
    await MIGRACIONES[i](db);
    version = i + 1;
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
}

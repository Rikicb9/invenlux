import {
  decidirAlta,
  decidirBaja,
  formatearCantidad,
  formatearFechaCorta,
  hoyISO,
  loteSiguiente,
  movimientosDeConsumo,
  planificarConsumo,
  productosUrgentes,
  stockDeProducto,
  type AjustesHogar,
  type ItemCompra,
  type Lote,
  type Movimiento,
  type Producto,
  type ProductoUrgente,
} from '@invenlux/core';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  HOGAR_LOCAL,
  borrarItemCompra,
  borrarProducto,
  guardarAjustes,
  guardarItemCompra,
  guardarLote,
  guardarMovimientos,
  guardarProducto,
  leerHogar,
  nuevoId,
} from '../datos/repositorio';
import { sembrarDespensa } from '../datos/semilla';

/**
 * Toda la escritura pasa por aquí: primero SQLite, después el estado en
 * memoria. El cálculo (stock, FEFO, urgencias) no se guarda nunca — se
 * deriva de los movimientos con `@invenlux/core`.
 */

export interface NuevoProducto {
  nombre: string;
  categoria: Producto['categoria'];
  unidad: Producto['unidad'];
  stockMin: number;
}

export interface NuevaEntrada {
  productoId: string;
  cantidad: number;
  fCompra: string;
  fCaducidad: string | null;
  ubicacion: Lote['ubicacion'];
  /** Si esta compra viene en otro formato, la unidad de la ficha se actualiza. */
  unidad?: Producto['unidad'];
}

export interface ResultadoConsumo {
  servido: number;
  pendiente: number;
  ubicacion?: string;
  caducidad?: string;
  añadidoALista: boolean;
}

interface Contexto {
  cargando: boolean;
  ajustes: AjustesHogar;
  productos: Producto[];
  lotes: Lote[];
  movimientos: Movimiento[];
  lista: ItemCompra[];
  stockDe: (productoId: string) => number;
  urgentes: ProductoUrgente[];
  crearProducto: (p: NuevoProducto) => Promise<Producto>;
  registrarEntrada: (e: NuevaEntrada) => Promise<void>;
  registrarConsumo: (productoId: string, cantidad: number) => Promise<ResultadoConsumo>;
  actualizarProducto: (p: Producto) => Promise<void>;
  eliminarProducto: (productoId: string) => Promise<void>;
  añadirALista: (texto: string) => Promise<void>;
  añadirVariosALista: (items: Array<{ texto: string; productoId: string | null }>) => Promise<number>;
  alternarComprado: (item: ItemCompra) => Promise<void>;
  quitarDeLista: (id: string) => Promise<void>;
  cambiarAjustes: (a: AjustesHogar) => Promise<void>;
}

const Ctx = createContext<Contexto | null>(null);

export function InventarioProvider({ children }: { children: React.ReactNode }) {
  const [cargando, setCargando] = useState(true);
  const [ajustes, setAjustes] = useState<AjustesHogar>({ diasAviso: 3, estrategia: 'FEFO' });
  const [productos, setProductos] = useState<Producto[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [lista, setLista] = useState<ItemCompra[]>([]);

  const recargar = useCallback(async () => {
    const e = await leerHogar();
    setAjustes(e.ajustes);
    setProductos(e.productos);
    setLotes(e.lotes);
    setMovimientos(e.movimientos);
    setLista(e.lista);
    return e;
  }, []);

  useEffect(() => {
    (async () => {
      const e = await recargar();
      if (e.productos.length === 0) {
        await sembrarDespensa();
        await recargar();
      }
      setCargando(false);
    })();
  }, [recargar]);

  const stockDe = useCallback(
    (productoId: string) => stockDeProducto(productoId, movimientos),
    [movimientos],
  );

  const urgentes = useMemo(
    () => productosUrgentes(productos, lotes, movimientos, ajustes),
    [productos, lotes, movimientos, ajustes],
  );

  // HU-01 · alta de producto
  const crearProducto = useCallback(async (datos: NuevoProducto) => {
    const producto: Producto = { id: nuevoId(), hogarId: HOGAR_LOCAL, autoCompra: true, ...datos };
    await guardarProducto(producto);
    setProductos((prev) => [...prev, producto].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return producto;
  }, []);

  const actualizarProducto = useCallback(async (producto: Producto) => {
    await guardarProducto(producto);
    setProductos((prev) => prev.map((p) => (p.id === producto.id ? producto : p)));
  }, []);

  // HU-02 · alta de lote + baja automática de la lista si ya hay repuesto
  const registrarEntrada = useCallback(
    async (datos: NuevaEntrada) => {
      const lote: Lote = {
        id: nuevoId(),
        productoId: datos.productoId,
        cantidadInicial: datos.cantidad,
        fCompra: datos.fCompra,
        fCaducidad: datos.fCaducidad,
        ubicacion: datos.ubicacion,
        origen: 'manual',
      };
      const movimiento: Movimiento = {
        id: nuevoId(),
        loteId: lote.id,
        productoId: datos.productoId,
        tipo: 'entrada',
        cantidad: datos.cantidad,
        fecha: new Date().toISOString(),
      };

      await guardarLote(lote);
      await guardarMovimientos([movimiento]);

      const movs = [movimiento, ...movimientos];
      setLotes((prev) => [...prev, lote]);
      setMovimientos(movs);

      const producto = productos.find((p) => p.id === datos.productoId);
      if (producto) {
        if (datos.unidad && datos.unidad !== producto.unidad) {
          const actualizado = { ...producto, unidad: datos.unidad };
          await guardarProducto(actualizado);
          setProductos((prev) => prev.map((p) => (p.id === producto.id ? actualizado : p)));
        }
        const baja = decidirBaja(producto, stockDeProducto(producto.id, movs), lista);
        if (baja) {
          await borrarItemCompra(baja.id);
          setLista((prev) => prev.filter((i) => i.id !== baja.id));
        }
      }
    },
    [movimientos, productos, lista],
  );

  // HU-04 + HU-05 · consumo con descuento FEFO, y HU-08 · alta en la lista
  const registrarConsumo = useCallback(
    async (productoId: string, cantidad: number): Promise<ResultadoConsumo> => {
      const producto = productos.find((p) => p.id === productoId);
      if (!producto) return { servido: 0, pendiente: cantidad, añadidoALista: false };

      const primero = loteSiguiente(productoId, lotes, movimientos, ajustes.estrategia);
      const plan = planificarConsumo(productoId, cantidad, lotes, movimientos, ajustes.estrategia);
      const movs = movimientosDeConsumo(productoId, plan, { nuevoId });

      await guardarMovimientos(movs);
      const todos = [...movs, ...movimientos];
      setMovimientos(todos);

      const stock = stockDeProducto(productoId, todos);
      const alta = decidirAlta(producto, stock, lista);
      let añadido = false;

      if (alta.añadir) {
        const item: ItemCompra = {
          id: nuevoId(),
          hogarId: HOGAR_LOCAL,
          texto: producto.nombre,
          productoId,
          origen: alta.origen,
          comprado: false,
        };
        await guardarItemCompra(item);
        setLista((prev) => [...prev, item]);
        añadido = true;
      }

      return {
        servido: plan.servido,
        pendiente: plan.pendiente,
        ubicacion: primero?.ubicacion,
        caducidad: formatearFechaCorta(primero?.fCaducidad ?? null),
        añadidoALista: añadido,
      };
    },
    [productos, lotes, movimientos, lista, ajustes.estrategia],
  );

  // HU-07 · lista de la compra manual
  const añadirALista = useCallback(async (texto: string) => {
    const limpio = texto.trim();
    if (!limpio) return;
    const item: ItemCompra = {
      id: nuevoId(),
      hogarId: HOGAR_LOCAL,
      texto: limpio,
      productoId: null,
      origen: 'manual',
      comprado: false,
    };
    await guardarItemCompra(item);
    setLista((prev) => [...prev, item]);
  }, []);

  const alternarComprado = useCallback(async (item: ItemCompra) => {
    const actualizado = { ...item, comprado: !item.comprado };
    await guardarItemCompra(actualizado);
    setLista((prev) => prev.map((i) => (i.id === item.id ? actualizado : i)));
  }, []);

  const quitarDeLista = useCallback(async (id: string) => {
    await borrarItemCompra(id);
    setLista((prev) => prev.filter((i) => i.id !== id));
  }, []);

  /**
   * Borrado duro: el producto se creó por error o ya no se compra. Se lleva
   * por delante sus lotes y su histórico, así que no es lo mismo que
   * "se acabó", que sí es un consumo y deja rastro.
   */
  const eliminarProducto = useCallback(async (productoId: string) => {
    await borrarProducto(productoId);
    setLotes((prev) => prev.filter((l) => l.productoId !== productoId));
    setMovimientos((prev) => prev.filter((m) => m.productoId !== productoId));
    setLista((prev) => prev.filter((i) => i.productoId !== productoId));
    setProductos((prev) => prev.filter((p) => p.id !== productoId));
  }, []);

  const añadirVariosALista = useCallback(
    async (items: Array<{ texto: string; productoId: string | null }>) => {
      const nuevos: ItemCompra[] = [];
      const pendientes = new Set(
        lista.filter((i) => !i.comprado).map((i) => i.productoId ?? i.texto.toLowerCase()),
      );

      for (const it of items) {
        const clave = it.productoId ?? it.texto.toLowerCase();
        if (pendientes.has(clave)) continue;
        pendientes.add(clave);
        const item: ItemCompra = {
          id: nuevoId(),
          hogarId: HOGAR_LOCAL,
          texto: it.texto,
          productoId: it.productoId,
          origen: 'menu',
          comprado: false,
        };
        await guardarItemCompra(item);
        nuevos.push(item);
      }

      if (nuevos.length) setLista((prev) => [...prev, ...nuevos]);
      return nuevos.length;
    },
    [lista],
  );

  const cambiarAjustes = useCallback(async (a: AjustesHogar) => {
    await guardarAjustes(a);
    setAjustes(a);
  }, []);

  const valor: Contexto = {
    cargando,
    ajustes,
    productos,
    lotes,
    movimientos,
    lista,
    stockDe,
    urgentes,
    crearProducto,
    registrarEntrada,
    registrarConsumo,
    actualizarProducto,
    eliminarProducto,
    añadirALista,
    añadirVariosALista,
    alternarComprado,
    quitarDeLista,
    cambiarAjustes,
  };

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useInventario(): Contexto {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useInventario debe usarse dentro de <InventarioProvider>');
  return ctx;
}

/** Texto del aviso tras un consumo: dice de qué lote ha salido y por qué. */
export function mensajeConsumo(
  nombre: string,
  cantidad: number,
  unidad: Producto['unidad'],
  r: ResultadoConsumo,
): string {
  const base = `−${formatearCantidad(cantidad, unidad)} de ${nombre}. FEFO: del lote de ${
    r.ubicacion ?? 'la despensa'
  } (cad. ${r.caducidad}).`;
  return r.añadidoALista ? `${base} Añadido a la compra.` : base;
}

export { hoyISO };

import type { ItemCompra, OrigenItemCompra, Producto } from './tipos';

/**
 * La lista de la compra es dinámica en las dos direcciones:
 * lo que se acaba entra solo, y lo que se repone sale solo.
 */

export interface DecisionAlta {
  /** Si procede añadirlo. */
  añadir: boolean;
  origen: OrigenItemCompra;
}

function pendienteDe(productoId: string, lista: readonly ItemCompra[]): ItemCompra | undefined {
  return lista.find((i) => i.productoId === productoId && !i.comprado);
}

/**
 * Tras un consumo: ¿entra el producto en la lista?
 * Sí cuando tiene reposición automática activada, el stock ha llegado al
 * mínimo y no está ya pendiente (no se duplica).
 */
export function decidirAlta(
  producto: Producto,
  stockActual: number,
  lista: readonly ItemCompra[],
): DecisionAlta {
  const origen: OrigenItemCompra = stockActual <= 0 ? 'agotado' : 'stock-minimo';
  if (!producto.autoCompra) return { añadir: false, origen };
  if (stockActual > producto.stockMin) return { añadir: false, origen };
  if (pendienteDe(producto.id, lista)) return { añadir: false, origen };
  return { añadir: true, origen };
}

/**
 * Tras una entrada: ¿se retira de la lista?
 * Sólo se retiran los ítems que puso el sistema. Si el usuario lo apuntó a
 * mano, sigue siendo decisión suya quitarlo.
 */
export function decidirBaja(
  producto: Producto,
  stockActual: number,
  lista: readonly ItemCompra[],
): ItemCompra | null {
  if (stockActual <= producto.stockMin) return null;
  const item = pendienteDe(producto.id, lista);
  if (!item || item.origen === 'manual') return null;
  return item;
}

export function textoOrigen(origen: OrigenItemCompra): string {
  switch (origen) {
    case 'manual':
      return 'Lo apuntaste tú';
    case 'agotado':
      return 'Se acabó en casa';
    case 'stock-minimo':
      return 'Por debajo del mínimo';
  }
}

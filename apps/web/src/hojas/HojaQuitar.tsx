import { formatearCantidad } from '@invenlux/core';
import { Hoja } from '../componentes/Hoja';
import { mensajeConsumo, useInventario } from '../estado/InventarioProvider';

/**
 * Dos salidas que no son lo mismo. "Se acabó" es un consumo real: descuenta
 * por FEFO, deja histórico y entra en la compra. "Eliminar" borra la ficha
 * entera: es para productos creados por error.
 */
export function HojaQuitar({
  productoId,
  onCerrar,
  onAviso,
}: {
  productoId: string | null;
  onCerrar: () => void;
  onAviso: (t: string) => void;
}) {
  const { productos, stockDe, registrarConsumo, eliminarProducto } = useInventario();
  const producto = productos.find((p) => p.id === productoId);
  if (!producto) return null;

  const stock = stockDe(producto.id);

  const acabar = async () => {
    onCerrar();
    if (stock > 0) {
      const r = await registrarConsumo(producto.id, stock);
      onAviso(mensajeConsumo(producto.nombre, r.servido, producto.unidad, r));
    } else {
      onAviso(`${producto.nombre} ya estaba a cero.`);
    }
  };

  const eliminar = async () => {
    onCerrar();
    await eliminarProducto(producto.id);
    onAviso(`${producto.nombre} eliminado del inventario.`);
  };

  return (
    <Hoja
      abierta
      onCerrar={onCerrar}
      titulo={producto.nombre}
      entradilla={`Quedan ${formatearCantidad(stock, producto.unidad)} · ${producto.categoria}`}
    >
      <div className="block">
        <h3>¿Qué ha pasado?</h3>
        <p className="hint" style={{ margin: '0 0 9px' }}>
          <strong>Se acabó</strong> — lo has consumido. Se descuenta todo el stock por FEFO, queda
          registrado en el histórico y el producto entra en la lista de la compra.
        </p>
        <p className="hint" style={{ margin: 0 }}>
          <strong>Eliminar producto</strong> — lo creaste por error o ya no lo compras. Se borra la
          ficha, sus lotes y su histórico. No se puede deshacer.
        </p>
      </div>

      <div className="btn-row">
        <button className="btn btn-ghost" onClick={eliminar}>
          Eliminar producto
        </button>
        <button className="btn btn-danger" onClick={acabar}>
          Se acabó
        </button>
      </div>
    </Hoja>
  );
}

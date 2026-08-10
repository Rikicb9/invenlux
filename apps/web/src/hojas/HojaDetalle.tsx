import {
  estadoCaducidad,
  etiquetaEstado,
  formatearCantidad,
  formatearFecha,
  ordenarLotes,
} from '@invenlux/core';
import { Hoja } from '../componentes/Hoja';
import { useInventario } from '../estado/InventarioProvider';

const CLASE: Record<string, string> = {
  caducado: 'u',
  hoy: 'u',
  aviso: 'w',
  'en-plazo': 'f',
  'sin-fecha': 'n',
};

/** HU-03 + HU-05 · lotes en orden FEFO, histórico y reposición. */
export function HojaDetalle({
  productoId,
  onCerrar,
  onConsumir,
  onEntrada,
}: {
  productoId: string | null;
  onCerrar: () => void;
  onConsumir: (id: string) => void;
  onEntrada: (id: string) => void;
}) {
  const { productos, lotes, movimientos, ajustes, stockDe, actualizarProducto } = useInventario();
  const producto = productos.find((p) => p.id === productoId);
  if (!producto) return null;

  const orden = ordenarLotes(producto.id, lotes, movimientos, ajustes.estrategia);
  const consumos = movimientos
    .filter((m) => m.productoId === producto.id && m.tipo === 'consumo')
    .slice(0, 6);

  return (
    <Hoja
      abierta
      onCerrar={onCerrar}
      titulo={producto.nombre}
      entradilla={`${producto.categoria} · ${formatearCantidad(stockDe(producto.id), producto.unidad)} en total`}
    >
      <div className="block">
        <h3>Lotes en orden FEFO</h3>
        {orden.length === 0 && <p className="hint">Sin stock.</p>}
        {orden.map((l, i) => {
          const e = estadoCaducidad(l.fCaducidad, ajustes.diasAviso);
          return (
            <div className="lote" key={l.id}>
              <div className="lote-l">
                <div className="lote-q">
                  {formatearCantidad(l.stock, producto.unidad)}
                  {i === 0 && <span className="fefo">SIGUIENTE</span>}
                </div>
                <div className="lote-d">
                  {l.ubicacion} · {l.fCaducidad ? `caduca ${formatearFecha(l.fCaducidad)}` : 'sin fecha'}
                </div>
              </div>
              <span className={`badge b-${CLASE[e.clave]}`}>{etiquetaEstado(e)}</span>
            </div>
          );
        })}
      </div>

      <div className="block">
        <h3>Historial de consumo</h3>
        {consumos.length === 0 && <p className="hint">Todavía no has registrado consumos.</p>}
        {consumos.map((m) => {
          const lote = lotes.find((l) => l.id === m.loteId);
          const h = new Date(m.fecha);
          return (
            <div className="mov" key={m.id}>
              <span>
                −{formatearCantidad(m.cantidad, producto.unidad)} · {lote?.ubicacion ?? '—'}
              </span>
              <span>
                {h.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}{' '}
                {h.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
      </div>

      <div className="block">
        <h3>Reposición</h3>
        <label style={{ marginBottom: 12 }}>
          <span className="lbl">Stock mínimo ({producto.unidad})</span>
          <input
            type="number"
            min="0"
            step="any"
            defaultValue={producto.stockMin}
            onBlur={(e) =>
              actualizarProducto({ ...producto, stockMin: Number(e.target.value.replace(',', '.')) || 0 })
            }
          />
        </label>
        <div className="switch">
          <div>
            <span className="lbl">Añadir solo a la compra</span>
            <small>Al terminarse o bajar del mínimo, entra en la lista.</small>
          </div>
          <button
            className="tgl"
            role="switch"
            aria-checked={producto.autoCompra}
            onClick={() => actualizarProducto({ ...producto, autoCompra: !producto.autoCompra })}
          >
            <i />
          </button>
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-ghost" onClick={() => onEntrada(producto.id)}>
          Añadir entrada
        </button>
        <button className="btn btn-primary" onClick={() => onConsumir(producto.id)}>
          Registrar consumo
        </button>
      </div>
    </Hoja>
  );
}

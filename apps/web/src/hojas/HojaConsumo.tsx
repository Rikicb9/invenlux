import { formatearCantidad, pasosRapidos } from '@invenlux/core';
import { useState } from 'react';
import { Hoja } from '../componentes/Hoja';
import { mensajeConsumo, useInventario } from '../estado/InventarioProvider';

/** HU-04 · registro de consumo con la menor fricción posible. */
export function HojaConsumo({
  productoId,
  onCerrar,
  onAviso,
}: {
  productoId: string | null;
  onCerrar: () => void;
  onAviso: (t: string) => void;
}) {
  const { productos, stockDe, registrarConsumo } = useInventario();
  const [otra, setOtra] = useState('');

  const producto = productos.find((p) => p.id === productoId);
  if (!producto) return null;

  const stock = stockDe(producto.id);

  const consumir = async (q: number) => {
    const cantidad = Math.min(q, stock);
    if (!(cantidad > 0)) return;
    const r = await registrarConsumo(producto.id, cantidad);
    onAviso(mensajeConsumo(producto.nombre, r.servido, producto.unidad, r));
    setOtra('');
    onCerrar();
  };

  return (
    <Hoja
      abierta
      onCerrar={onCerrar}
      titulo={producto.nombre}
      entradilla={`Quedan ${formatearCantidad(stock, producto.unidad)} · se descuenta por FEFO`}
    >
      <div className="quick">
        {pasosRapidos(producto.unidad).map((n) => (
          <button key={n} onClick={() => consumir(n)}>
            −{String(n).replace('.', ',')}
          </button>
        ))}
      </div>

      <div className="two" style={{ alignItems: 'end' }}>
        <label style={{ marginBottom: 10 }}>
          <span className="lbl">Otra cantidad</span>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="0"
            value={otra}
            onChange={(e) => setOtra(e.target.value)}
          />
        </label>
        <button
          className="btn btn-ghost"
          style={{ marginBottom: 10 }}
          onClick={() => consumir(Number(otra.replace(',', '.')) || 0)}
        >
          Descontar
        </button>
      </div>

      <button className="btn btn-danger" onClick={() => consumir(stock)}>
        Se acabó — vaciar y añadir a la compra
      </button>
    </Hoja>
  );
}

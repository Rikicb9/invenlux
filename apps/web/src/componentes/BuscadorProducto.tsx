import {
  agruparPorCategoria,
  filtrarOpciones,
  formatearCantidad,
  normalizar,
  type OpcionProducto,
} from '@invenlux/core';
import { useMemo, useState } from 'react';

/**
 * Buscador de producto: la lista sale desplegada y se filtra a medida que se
 * escribe. Si nada encaja, ofrece crear el producto ahí mismo.
 */
export function BuscadorProducto({
  opciones,
  onElegir,
  onCrear,
}: {
  opciones: readonly OpcionProducto[];
  onElegir: (o: OpcionProducto) => void;
  onCrear: (nombre: string) => void;
}) {
  const [consulta, setConsulta] = useState('');
  const q = consulta.trim();

  const filtradas = useMemo(() => filtrarOpciones(opciones, q), [opciones, q]);
  const grupos = useMemo(() => (q ? [] : agruparPorCategoria(filtradas)), [filtradas, q]);
  const hayExacta = filtradas.some((o) => normalizar(o.nombre) === normalizar(q));

  const fila = (o: OpcionProducto) => (
    <button key={o.clave} className={`opt ${o.stock > 0 ? 'opt-tengo' : ''}`} onClick={() => onElegir(o)}>
      <strong>{o.nombre}</strong>
      <small>
        {o.categoria}
        {o.stock > 0 ? ` · ${formatearCantidad(o.stock, o.unidad)}` : ''}
      </small>
    </button>
  );

  return (
    <>
      <label>
        <span className="lbl">Producto</span>
        <input
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            if (filtradas.length) onElegir(filtradas[0]);
            else if (q) onCrear(q);
          }}
          placeholder="Busca o escribe un producto"
          autoComplete="off"
          autoFocus
        />
      </label>

      <div className="combo">
        {q ? (
          <>
            {!filtradas.length && <div className="combo-vacio">Nada coincide con «{q}».</div>}
            {filtradas.slice(0, 30).map(fila)}
            {!hayExacta && (
              <button className="opt opt-new" onClick={() => onCrear(q)}>
                <strong>Crear «{q}»</strong>
                <small>Se añadirá a tu lista de productos</small>
              </button>
            )}
          </>
        ) : (
          grupos.map((g) => (
            <div key={g.categoria}>
              <div className="opt-h">{g.categoria}</div>
              {g.opciones.map(fila)}
            </div>
          ))
        )}
      </div>
    </>
  );
}

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
  etiqueta = 'Producto',
  marcador = 'Busca o escribe un producto',
  limpiarAlElegir = false,
}: {
  opciones: readonly OpcionProducto[];
  onElegir: (o: OpcionProducto) => void;
  onCrear: (nombre: string) => void;
  etiqueta?: string;
  marcador?: string;
  /** En la lista de la compra se sigue añadiendo, así que el campo se vacía. */
  limpiarAlElegir?: boolean;
}) {
  const [consulta, setConsulta] = useState('');
  const q = consulta.trim();

  const filtradas = useMemo(() => filtrarOpciones(opciones, q), [opciones, q]);
  const grupos = useMemo(() => (q ? [] : agruparPorCategoria(filtradas)), [filtradas, q]);
  const hayExacta = filtradas.some((o) => normalizar(o.nombre) === normalizar(q));

  const elegir = (o: OpcionProducto) => {
    if (limpiarAlElegir) setConsulta('');
    onElegir(o);
  };
  const crear = (nombre: string) => {
    if (limpiarAlElegir) setConsulta('');
    onCrear(nombre);
  };

  const fila = (o: OpcionProducto) => (
    <button key={o.clave} className={`opt ${o.stock > 0 ? 'opt-tengo' : ''}`} onClick={() => elegir(o)}>
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
        <span className="lbl">{etiqueta}</span>
        <input
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            if (filtradas.length) elegir(filtradas[0]);
            else if (q) crear(q);
          }}
          placeholder={marcador}
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
              <button className="opt opt-new" onClick={() => crear(q)}>
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

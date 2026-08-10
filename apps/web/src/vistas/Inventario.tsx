import {
  UBICACIONES,
  abreviarUnidad,
  diasHasta,
  estadoCaducidad,
  etiquetaEstado,
  formatearNumero,
  loteSiguiente,
  lotesConStock,
} from '@invenlux/core';
import { useMemo, useState } from 'react';
import { Horizonte } from '../componentes/Horizonte';
import { Vacio } from '../componentes/Hoja';
import { useInventario } from '../estado/InventarioProvider';

const CLASE: Record<string, string> = {
  caducado: 'u',
  hoy: 'u',
  aviso: 'w',
  'en-plazo': 'f',
  'sin-fecha': 'n',
};

export function Inventario({
  onAbrir,
  onQuitar,
}: {
  onAbrir: (id: string) => void;
  onQuitar: (id: string) => void;
}) {
  const { productos, lotes, movimientos, ajustes, stockDe } = useInventario();
  const [filtro, setFiltro] = useState<string>('Todo');

  const visibles = useMemo(
    () =>
      productos
        .map((p) => ({ producto: p, suyos: lotesConStock(p.id, lotes, movimientos) }))
        .filter((x) => x.suyos.length > 0)
        .filter((x) => filtro === 'Todo' || x.suyos.some((l) => l.ubicacion === filtro))
        .sort((a, b) => {
          const da = diasHasta(loteSiguiente(a.producto.id, lotes, movimientos)?.fCaducidad ?? null);
          const db = diasHasta(loteSiguiente(b.producto.id, lotes, movimientos)?.fCaducidad ?? null);
          if (da === null) return 1;
          if (db === null) return -1;
          return da - db;
        }),
    [productos, lotes, movimientos, filtro],
  );

  return (
    <>
      <Horizonte />

      <div className="filters">
        {['Todo', ...UBICACIONES].map((f) => (
          <button key={f} className="chip" aria-pressed={filtro === f} onClick={() => setFiltro(f)}>
            {f}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <Vacio
          titulo="Nada por aquí todavía"
          texto={filtro === 'Todo' ? 'Añade tu primer producto con el botón +.' : `No hay productos en ${filtro}.`}
        />
      ) : (
        visibles.map(({ producto, suyos }) => {
          const siguiente = loteSiguiente(producto.id, lotes, movimientos);
          const e = estadoCaducidad(siguiente?.fCaducidad ?? null, ajustes.diasAviso);
          const ubicaciones = [...new Set(suyos.map((l) => l.ubicacion))];

          return (
            <div className="card" key={producto.id}>
              <div className="card-main" role="button" tabIndex={0} onClick={() => onAbrir(producto.id)}>
                <div className="card-top">
                  <div>
                    <p className="p-name">{producto.nombre}</p>
                    <p className="p-meta">
                      {producto.categoria}
                      {suyos.length > 1 ? ` · ${suyos.length} lotes` : ''}
                    </p>
                  </div>
                  <span className="p-qty">
                    {formatearNumero(stockDe(producto.id))}
                    <small>{abreviarUnidad(producto.unidad)}</small>
                  </span>
                </div>
              </div>

              <div className="p-foot">
                <div className="p-tags">
                  <span className={`badge b-${CLASE[e.clave]}`}>{etiquetaEstado(e)}</span>
                  {ubicaciones.map((u) => (
                    <span className={`loc ${u}`} key={u}>
                      {u}
                    </span>
                  ))}
                </div>
                <button
                  className="card-x"
                  aria-label={`Quitar ${producto.nombre} del inventario`}
                  onClick={() => onQuitar(producto.id)}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })
      )}
    </>
  );
}

import {
  abreviarUnidad,
  diasHasta,
  estadoCaducidad,
  etiquetaEstado,
  formatearNumero,
  loteSiguiente,
  lotesConStock,
  type ClaveEstado,
} from '@invenlux/core';
import { useMemo, useState } from 'react';
import { Vacio } from '../componentes/Hoja';
import {
  FILTROS_VACIOS,
  PanelFiltros,
  hayFiltros,
  type FiltroEstado,
  type Filtros,
} from '../componentes/PanelFiltros';
import { useInventario } from '../estado/InventarioProvider';

const CLASE: Record<ClaveEstado, string> = {
  caducado: 'u',
  hoy: 'u',
  aviso: 'w',
  'en-plazo': 'f',
  'sin-fecha': 'n',
};

/** El estado del producto, agrupado tal como se filtra en el panel. */
function grupoEstado(clave: ClaveEstado): FiltroEstado {
  if (clave === 'caducado' || clave === 'hoy') return 'Caducado';
  if (clave === 'aviso') return 'Pronto';
  if (clave === 'en-plazo') return 'En plazo';
  return 'Sin fecha';
}

export function Inventario({
  onAbrir,
  onQuitar,
}: {
  onAbrir: (id: string) => void;
  onQuitar: (id: string) => void;
}) {
  const { productos, lotes, movimientos, ajustes, stockDe } = useInventario();
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);

  const visibles = useMemo(
    () =>
      productos
        .map((p) => {
          const suyos = lotesConStock(p.id, lotes, movimientos);
          const siguiente = loteSiguiente(p.id, lotes, movimientos, ajustes.estrategia);
          return {
            producto: p,
            suyos,
            estado: estadoCaducidad(siguiente?.fCaducidad ?? null, ajustes.diasAviso),
          };
        })
        .filter((x) => x.suyos.length > 0)
        .filter((x) => filtros.ubicacion === 'Todo' || x.suyos.some((l) => l.ubicacion === filtros.ubicacion))
        .filter((x) => filtros.categoria === 'Todas' || x.producto.categoria === filtros.categoria)
        .filter((x) => filtros.estado === 'Todos' || grupoEstado(x.estado.clave) === filtros.estado)
        .sort((a, b) => {
          // Por nombre y por categoría el desempate es alfabético; por
          // caducidad, lo que antes caduca primero y lo que no tiene fecha
          // al final, que es el mismo criterio que usa FEFO.
          const alfabetico = a.producto.nombre.localeCompare(b.producto.nombre, 'es');

          if (filtros.orden === 'Nombre') return alfabetico;

          if (filtros.orden === 'Categoría') {
            const cat = a.producto.categoria.localeCompare(b.producto.categoria, 'es');
            return cat !== 0 ? cat : alfabetico;
          }

          const da = a.estado.dias;
          const db = b.estado.dias;
          if (da === null && db === null) return alfabetico;
          if (da === null) return 1;
          if (db === null) return -1;
          return da !== db ? da - db : alfabetico;
        }),
    [productos, lotes, movimientos, ajustes, filtros],
  );

  return (
    <>
      <PanelFiltros
        filtros={filtros}
        onCambio={setFiltros}
        diasAviso={ajustes.diasAviso}
        resultados={visibles.length}
      />

      {visibles.length === 0 ? (
        <Vacio
          titulo="Nada por aquí"
          texto={
            hayFiltros(filtros)
              ? 'Ningún producto cumple estos filtros. Prueba a quitarlos.'
              : 'Añade tu primer producto con el botón +.'
          }
        />
      ) : (
        visibles.map(({ producto, suyos, estado }) => {
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
                  <span className={`badge b-${CLASE[estado.clave]}`}>{etiquetaEstado(estado)}</span>
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

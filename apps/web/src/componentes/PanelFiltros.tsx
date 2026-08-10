import { CATEGORIAS, UBICACIONES, type Categoria, type Ubicacion } from '@invenlux/core';
import { useState } from 'react';

export type FiltroUbicacion = 'Todo' | Ubicacion;
export type FiltroCategoria = 'Todas' | Categoria;
export type FiltroEstado = 'Todos' | 'Caducado' | 'Pronto' | 'En plazo' | 'Sin fecha';
export type Orden = 'Caducidad' | 'Categoría' | 'Nombre';

export const ORDENES: readonly Orden[] = ['Caducidad', 'Categoría', 'Nombre'];

/**
 * "Despensa" y "Congelados" son a la vez categoría y ubicación. Como la
 * ubicación ya se filtra arriba, se ocultan aquí para no ofrecer dos fichas
 * que parecen lo mismo. Los productos de esas categorías siguen apareciendo:
 * simplemente se filtran por dónde están guardados, no por su categoría.
 */
const CATEGORIAS_FILTRABLES = CATEGORIAS.filter(
  (c) => c !== 'Despensa' && c !== 'Congelados',
);

export interface Filtros {
  ubicacion: FiltroUbicacion;
  categoria: FiltroCategoria;
  estado: FiltroEstado;
  orden: Orden;
}

export const FILTROS_VACIOS: Filtros = {
  ubicacion: 'Todo',
  categoria: 'Todas',
  estado: 'Todos',
  orden: 'Caducidad',
};

/** Cuántos filtros hay puestos. El orden no cuenta: siempre hay uno activo. */
export const hayFiltros = (f: Filtros): number =>
  (f.ubicacion !== 'Todo' ? 1 : 0) + (f.categoria !== 'Todas' ? 1 : 0) + (f.estado !== 'Todos' ? 1 : 0);

/**
 * Panel de filtros del inventario.
 * La ubicación queda siempre visible porque es el filtro de uso diario
 * ("qué hay en la nevera"); categoría y estado se despliegan bajo demanda
 * para no llenar la pantalla de fichas.
 */
export function PanelFiltros({
  filtros,
  onCambio,
  diasAviso,
  resultados,
}: {
  filtros: Filtros;
  onCambio: (f: Filtros) => void;
  diasAviso: number;
  resultados: number;
}) {
  const [abierto, setAbierto] = useState(false);
  const activos = hayFiltros(filtros);
  const ordenCambiado = filtros.orden !== FILTROS_VACIOS.orden;

  const grupo = <T extends string>(
    titulo: string,
    valores: readonly T[],
    actual: T,
    aplicar: (v: T) => void,
  ) => (
    <div className="filtro-grupo">
      <h4>{titulo}</h4>
      <div className="filters">
        {valores.map((v) => (
          <button key={v} className="chip" aria-pressed={actual === v} onClick={() => aplicar(v)}>
            {v === 'Pronto' ? `≤ ${diasAviso} días` : v}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <section className="panel-filtros">
      <div className="filters">
        {(['Todo', ...UBICACIONES] as FiltroUbicacion[]).map((u) => (
          <button
            key={u}
            className="chip"
            aria-pressed={filtros.ubicacion === u}
            onClick={() => onCambio({ ...filtros, ubicacion: u })}
          >
            {u}
          </button>
        ))}
        <button
          className="chip chip-mas"
          aria-pressed={abierto || activos > 0 || ordenCambiado}
          onClick={() => setAbierto(!abierto)}
        >
          Filtros{activos ? ` · ${activos}` : ''}
        </button>
      </div>

      {abierto && (
        <div className="filtros-detalle">
          {grupo(
            'Categoría',
            ['Todas', ...CATEGORIAS_FILTRABLES] as FiltroCategoria[],
            filtros.categoria,
            (categoria) => onCambio({ ...filtros, categoria }),
          )}
          {grupo(
            'Estado',
            ['Todos', 'Caducado', 'Pronto', 'En plazo', 'Sin fecha'] as FiltroEstado[],
            filtros.estado,
            (estado) => onCambio({ ...filtros, estado }),
          )}
          {grupo('Ordenar por', ORDENES, filtros.orden, (orden) => onCambio({ ...filtros, orden }))}

          <div className="filtros-pie">
            <span>
              {resultados} {resultados === 1 ? 'producto' : 'productos'} · orden por{' '}
              {filtros.orden.toLowerCase()}
            </span>
            {(activos > 0 || ordenCambiado) && (
              <button className="filtros-limpiar" onClick={() => onCambio(FILTROS_VACIOS)}>
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

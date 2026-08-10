import { diasHasta, stockPorLote } from '@invenlux/core';
import { useMemo } from 'react';
import { useInventario } from '../estado/InventarioProvider';

/**
 * Elemento distintivo: los 30 días siguientes en una línea, un punto por
 * lote. De un vistazo se ve si la despensa aprieta por la izquierda.
 */
const DIAS_VISTA = 30;
const MARGEN = 2;

export function Horizonte() {
  const { lotes, movimientos, ajustes } = useInventario();

  const puntos = useMemo(() => {
    const saldos = stockPorLote(movimientos);
    return lotes
      .filter((l) => (saldos.get(l.id) ?? 0) > 0)
      .map((l) => ({ id: l.id, dias: diasHasta(l.fCaducidad) }))
      .filter((p): p is { id: string; dias: number } => p.dias !== null && p.dias <= DIAS_VISTA)
      .map((p) => ({
        ...p,
        clase: p.dias <= 0 ? 'u' : p.dias <= ajustes.diasAviso ? 'w' : 'f',
      }));
  }, [lotes, movimientos, ajustes.diasAviso]);

  const porConsumir = puntos.filter((p) => p.clase !== 'f').length;
  const posicion = (dias: number) =>
    `${Math.max(0, Math.min(100, ((Math.max(dias, -MARGEN) + MARGEN) / (DIAS_VISTA + MARGEN)) * 100))}%`;

  const marcas = [
    { d: -MARGEN, t: 'ya' },
    { d: ajustes.diasAviso, t: `${ajustes.diasAviso}d` },
    { d: 10, t: '10d' },
    { d: 20, t: '20d' },
    { d: 30, t: '30d' },
  ];

  return (
    <section className="horizon">
      <div className="horizon-head">
        <span>Horizonte de caducidad</span>
        <span>
          {porConsumir ? (
            <>
              <strong>{porConsumir}</strong> por consumir ya
            </>
          ) : (
            'Todo bajo control'
          )}
        </span>
      </div>

      <div className="track">
        <div className="axis" />
        {marcas.map((m) => (
          <span key={m.t} className="tick" style={{ left: posicion(m.d) }}>
            <i />
            <span>{m.t}</span>
          </span>
        ))}
        {puntos.map((p, i) => (
          <span
            key={p.id}
            className={`pip ${p.clase}`}
            style={{ left: posicion(p.dias), animationDelay: `${i * 28}ms` }}
          />
        ))}
      </div>

      <div className="horizon-legend">
        <div>
          <b style={{ background: 'var(--urgent)' }} />
          Caducado / hoy
        </div>
        <div>
          <b style={{ background: 'var(--warn)' }} />≤ {ajustes.diasAviso} días
        </div>
        <div>
          <b style={{ background: 'var(--fresh)' }} />
          En plazo
        </div>
      </div>
    </section>
  );
}

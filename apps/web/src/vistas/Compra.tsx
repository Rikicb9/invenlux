import { textoOrigen } from '@invenlux/core';
import { useState } from 'react';
import { Vacio } from '../componentes/Hoja';
import { useInventario } from '../estado/InventarioProvider';

/** HU-07 + HU-08 · lista de la compra, manual y automática. */
export function Compra({ onReponer }: { onReponer: (productoId: string) => void }) {
  const { lista, añadirALista, alternarComprado, quitarDeLista } = useInventario();
  const [texto, setTexto] = useState('');

  const pendientes = lista.filter((i) => !i.comprado);
  const enCarro = lista.filter((i) => i.comprado);

  const añadir = async () => {
    await añadirALista(texto);
    setTexto('');
  };

  const fila = (i: (typeof lista)[number]) => (
    <div className={`buy ${i.comprado ? 'done' : ''}`} key={i.id}>
      <button
        className="check"
        aria-label={`Marcar ${i.texto} como comprado`}
        onClick={async () => {
          await alternarComprado(i);
          // Al marcar comprado un producto conocido, se abre su alta de lote:
          // es el momento natural de decir cuánto, dónde y cuándo caduca.
          if (!i.comprado && i.productoId) onReponer(i.productoId);
        }}
      >
        <svg viewBox="0 0 24 24">
          <path d="M4 12l6 6L20 6" />
        </svg>
      </button>
      <div className="buy-l">
        <div className="buy-n">{i.texto}</div>
        <div className="buy-o">{textoOrigen(i.origen)}</div>
      </div>
      <button className="buy-x" aria-label={`Quitar ${i.texto}`} onClick={() => quitarDeLista(i.id)}>
        ×
      </button>
    </div>
  );

  return (
    <>
      <div className="add-row">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && añadir()}
          placeholder="Añadir a la lista…"
          autoComplete="off"
        />
        <button className="btn btn-primary" onClick={añadir}>
          Añadir
        </button>
      </div>

      {pendientes.length ? (
        pendientes.map(fila)
      ) : (
        <Vacio titulo="Lista vacía" texto="Cuando algo se acabe o baje del mínimo, aparecerá aquí solo." />
      )}

      {enCarro.length > 0 && (
        <>
          <h3
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9.5,
              letterSpacing: '.09em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
              margin: '20px 0 9px',
            }}
          >
            En el carro
          </h3>
          {enCarro.map(fila)}
        </>
      )}
    </>
  );
}

import {
  estadoIngrediente,
  faltantesDelPlan,
  formatearCantidad,
  generarPlan,
  mensajeAsistente,
  type DiaMenu,
  type Preferencias,
} from '@invenlux/core';
import { useMemo, useState } from 'react';
import { Vacio } from '../componentes/Hoja';
import { useInventario } from '../estado/InventarioProvider';

const SUGERENCIAS = [
  'Menú equilibrado para toda la semana',
  'Algo rápido, tengo poco tiempo',
  'Sin carne, ligero',
  'Aprovecha lo que caduca',
];

/**
 * Menú semanal — adelanto del Sprint 3, simulado en local.
 * La generación la hará el asistente de IA con estas mismas reglas
 * (`@invenlux/core/menu`).
 */
export function Menu({ onAviso }: { onAviso: (t: string) => void }) {
  const { productos, lotes, movimientos, ajustes, añadirVariosALista } = useInventario();
  const [dias, setDias] = useState(7);
  const [plan, setPlan] = useState<DiaMenu[]>([]);
  const [chat, setChat] = useState<Array<{ rol: 'usuario' | 'ia'; texto: string }>>([]);
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState<number | null>(null);

  const despensa = useMemo(
    () => ({ productos, lotes, movimientos, ajustes }),
    [productos, lotes, movimientos, ajustes],
  );
  const faltan = useMemo(() => faltantesDelPlan(plan, despensa), [plan, despensa]);

  const pedir = (peticion: string) => {
    const { plan: nuevo, preferencias } = generarPlan(peticion, dias, despensa);
    setPlan(nuevo);
    setAbierto(null);
    setTexto('');
    setChat([
      { rol: 'usuario', texto: peticion },
      { rol: 'ia', texto: mensajeAsistente(nuevo, preferencias as Preferencias, despensa) },
    ]);
  };

  const mandarALaCompra = async () => {
    const n = await añadirVariosALista(
      faltan.map((f) => ({ texto: f.nombre, productoId: f.producto?.id ?? null })),
    );
    onAviso(
      n
        ? `${n} ${n === 1 ? 'ingrediente añadido' : 'ingredientes añadidos'} a la lista de la compra.`
        : 'Ya estaban todos en la lista.',
    );
  };

  return (
    <>
      <div className="mock">Simulación local · en el Sprint 3 la genera el asistente de IA</div>

      <section className="chat">
        <div className="chat-h">
          <span>Asistente de menú</span>
          <div className="seg">
            {[5, 7].map((n) => (
              <button key={n} aria-pressed={dias === n} onClick={() => setDias(n)}>
                {n === 5 ? 'L-V' : 'Semana'}
              </button>
            ))}
          </div>
        </div>

        {chat.length ? (
          <div className="msgs">
            {chat.map((m, i) => (
              <div className={`msg ${m.rol === 'usuario' ? 'user' : 'ia'}`} key={i}>
                {m.texto}
              </div>
            ))}
          </div>
        ) : (
          <>
            <p className="hint" style={{ margin: '0 0 10px' }}>
              Dime qué quieres comer esta semana y te lo planifico con lo que tienes.
            </p>
            <div className="chips-sug">
              {SUGERENCIAS.map((s) => (
                <button className="chip" key={s} onClick={() => pedir(s)}>
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="add-row" style={{ margin: 0 }}>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && pedir(texto.trim() || SUGERENCIAS[0])}
            placeholder="Ej. sin carne y rápido…"
            autoComplete="off"
          />
          <button className="btn btn-primary" onClick={() => pedir(texto.trim() || SUGERENCIAS[0])}>
            Generar
          </button>
        </div>
      </section>

      {plan.length === 0 ? (
        <Vacio titulo="Todavía no hay menú" texto="Escribe lo que te apetece o toca una de las sugerencias." />
      ) : (
        plan.map((d, i) => {
          const pendientes = d.receta.ingredientes.filter(
            (ing) => estadoIngrediente(ing, despensa).clave !== 'ok',
          ).length;

          return (
            <div className="dia" key={d.dia}>
              <button className="dia-top" onClick={() => setAbierto(abierto === i ? null : i)}>
                <div className="dia-l">
                  <span className="dia-d">{d.dia}</span>
                  <span className="dia-r">{d.receta.nombre}</span>
                  <span className="dia-m">
                    {d.receta.minutos} min · {pendientes ? `${pendientes} por comprar` : 'todo en casa'}
                  </span>
                </div>
                <span className="dia-x">{abierto === i ? '−' : '+'}</span>
              </button>

              {abierto === i && (
                <div className="ings">
                  {d.receta.ingredientes.map((ing) => {
                    const e = estadoIngrediente(ing, despensa);
                    const k = e.clave;
                    return (
                      <div className="ing" key={ing.nombre}>
                        <span className={`ing-i i-${k}`}>
                          {k === 'ok' ? '✓' : k === 'poco' ? '!' : '✕'}
                        </span>
                        <span className="ing-n">{ing.nombre}</span>
                        <span className="ing-q">{formatearCantidad(ing.cantidad, ing.unidad)}</span>
                        <span className={`ing-s s-${k}`}>{e.texto}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}

      {faltan.length > 0 && (
        <>
          <button className="btn btn-primary" style={{ marginTop: 6 }} onClick={mandarALaCompra}>
            Añadir {faltan.length} ingredientes a la compra
          </button>
          <p className="hint">{faltan.map((f) => f.nombre).join(', ')}.</p>
        </>
      )}
    </>
  );
}

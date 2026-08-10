import { useState } from 'react';
import { Aviso } from './componentes/Hoja';
import { useInventario } from './estado/InventarioProvider';
import { HojaConsumo } from './hojas/HojaConsumo';
import { HojaDetalle } from './hojas/HojaDetalle';
import { HojaEntrada } from './hojas/HojaEntrada';
import { HojaQuitar } from './hojas/HojaQuitar';
import { Ajustes } from './vistas/Ajustes';
import { Compra } from './vistas/Compra';
import { Inventario } from './vistas/Inventario';
import { Menu } from './vistas/Menu';

type Vista = 'inv' | 'menu' | 'buy' | 'cfg';

const TITULOS: Record<Vista, string> = {
  inv: 'Inventario',
  menu: 'Menú semanal',
  buy: 'Lista de la compra',
  cfg: 'Ajustes',
};

export function App() {
  const { cargando, error, productos, lista, stockDe } = useInventario();
  const [vista, setVista] = useState<Vista>('inv');
  const [entrada, setEntrada] = useState(false);
  const [entradaDe, setEntradaDe] = useState<string | null>(null);
  const [detalleDe, setDetalleDe] = useState<string | null>(null);
  const [consumoDe, setConsumoDe] = useState<string | null>(null);
  const [quitarDe, setQuitarDe] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const pendientes = lista.filter((i) => !i.comprado).length;
  const conStock = productos.filter((p) => stockDe(p.id) > 0).length;

  const subtitulo: Record<Vista, string> = {
    inv: cargando ? 'Abriendo la despensa…' : `${conStock} productos con stock · orden FEFO`,
    menu: 'Planifica la semana con lo que tienes',
    buy: `${pendientes} pendientes`,
    cfg: 'Umbrales y preferencias del hogar',
  };

  if (error) {
    return (
      <div id="app">
        <main style={{ padding: 28, marginTop: 60 }}>
          <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: 8 }}>
            No se ha podido conectar
          </h2>
          <p className="hint">{error}</p>
        </main>
      </div>
    );
  }

  return (
    <div id="app">
      <header>
        <div className="brand">
          <h1>Invenlux</h1>
          <span className="tag">Sprint 1 · FEFO</span>
        </div>
        <h2 className="view-title">{TITULOS[vista]}</h2>
        <p className="view-sub">{subtitulo[vista]}</p>
      </header>

      <main>
        {vista === 'inv' && <Inventario onAbrir={setDetalleDe} onQuitar={setQuitarDe} />}
        {vista === 'menu' && <Menu onAviso={setAviso} />}
        {vista === 'buy' && <Compra onReponer={setEntradaDe} />}
        {vista === 'cfg' && <Ajustes />}
      </main>

      {vista === 'inv' && (
        <button className="fab" aria-label="Nueva entrada" onClick={() => setEntrada(true)}>
          +
        </button>
      )}

      <nav>
        <button data-nav="inv" aria-current={vista === 'inv' ? 'page' : undefined} onClick={() => setVista('inv')}>
          <svg viewBox="0 0 24 24">
            <path d="M3 7h18M3 12h18M3 17h18" />
          </svg>
          Inventario
        </button>
        <button data-nav="menu" aria-current={vista === 'menu' ? 'page' : undefined} onClick={() => setVista('menu')}>
          <svg viewBox="0 0 24 24">
            <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
            <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
          </svg>
          Menú
        </button>
        <button data-nav="buy" aria-current={vista === 'buy' ? 'page' : undefined} onClick={() => setVista('buy')}>
          <svg viewBox="0 0 24 24">
            <path d="M6 6h15l-1.7 8.4a2 2 0 0 1-2 1.6H9.3a2 2 0 0 1-2-1.6L5.5 4H3" />
            <circle cx="9.5" cy="20" r="1.3" />
            <circle cx="18" cy="20" r="1.3" />
          </svg>
          Compra
          {pendientes > 0 && <span className="dot">{pendientes}</span>}
        </button>
        <button data-nav="cfg" aria-current={vista === 'cfg' ? 'page' : undefined} onClick={() => setVista('cfg')}>
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.5 15H3a2 2 0 1 1 0-4h.2A1.6 1.6 0 0 0 4.3 8.2l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3 1.6 1.6 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z" />
          </svg>
          Ajustes
        </button>
      </nav>

      <HojaEntrada abierta={entrada} onCerrar={() => setEntrada(false)} onAviso={setAviso} />
      <HojaEntrada
        abierta={!!entradaDe}
        productoId={entradaDe}
        onCerrar={() => setEntradaDe(null)}
        onAviso={setAviso}
      />
      <HojaDetalle
        productoId={detalleDe}
        onCerrar={() => setDetalleDe(null)}
        onConsumir={(id) => {
          setDetalleDe(null);
          setConsumoDe(id);
        }}
        onEntrada={(id) => {
          setDetalleDe(null);
          setEntradaDe(id);
        }}
      />
      <HojaConsumo productoId={consumoDe} onCerrar={() => setConsumoDe(null)} onAviso={setAviso} />
      <HojaQuitar productoId={quitarDe} onCerrar={() => setQuitarDe(null)} onAviso={setAviso} />
      <Aviso texto={aviso} onFin={() => setAviso(null)} />
    </div>
  );
}

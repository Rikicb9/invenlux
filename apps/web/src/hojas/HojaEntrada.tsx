import {
  CATALOGO,
  CATEGORIAS,
  UBICACION_SUGERIDA,
  UBICACIONES,
  UNIDADES,
  hoyISO,
  opcionesDeProducto,
  sumarDias,
  type Categoria,
  type OpcionProducto,
  type Ubicacion,
  type Unidad,
} from '@invenlux/core';
import { useMemo, useState } from 'react';
import { BuscadorProducto } from '../componentes/BuscadorProducto';
import { Hoja } from '../componentes/Hoja';
import { useInventario } from '../estado/InventarioProvider';

/**
 * HU-01 + HU-02 · alta unificada.
 * Un único paso: si el producto ya existe se le añade el lote; si no, se crea
 * su ficha y su primera entrada en la misma acción de guardado.
 */
export function HojaEntrada({
  abierta,
  productoId,
  onCerrar,
  onAviso,
}: {
  abierta: boolean;
  productoId?: string | null;
  onCerrar: () => void;
  onAviso: (t: string) => void;
}) {
  const { productos, movimientos, stockDe, crearProducto, registrarEntrada } = useInventario();

  const [elegido, setElegido] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<Categoria>('Otros');
  const [stockMin, setStockMin] = useState('1');
  const [unidad, setUnidad] = useState<Unidad>('unidades');
  const [vida, setVida] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [ubicacion, setUbicacion] = useState<Ubicacion>('Nevera');
  const [fCompra, setFCompra] = useState(hoyISO());
  const [fCaducidad, setFCaducidad] = useState('');
  const [error, setError] = useState('');

  const opciones = useMemo(() => opcionesDeProducto(productos, movimientos), [productos, movimientos]);
  const producto = productos.find((p) => p.id === (elegido ?? productoId));

  const limpiar = () => {
    setElegido(null);
    setPendiente(null);
    setVida(null);
    setFCaducidad('');
    setCantidad('');
    setError('');
  };

  const cerrar = () => {
    limpiar();
    onCerrar();
  };

  const elegir = (o: OpcionProducto) => {
    setCategoria(o.categoria);
    setUnidad(o.unidad);
    setUbicacion(UBICACION_SUGERIDA[o.categoria]);
    setError('');

    if (o.clave.startsWith('p:')) {
      setElegido(o.clave.slice(2));
      setPendiente(null);
      setVida(null);
      return;
    }
    const cat = CATALOGO[Number(o.clave.slice(2))];
    setElegido(null);
    setPendiente(cat.nombre);
    setVida(cat.vida);
    setFCaducidad(cat.vida ? sumarDias(hoyISO(), cat.vida) : '');
  };

  const crear = (nombre: string) => {
    setElegido(null);
    setPendiente(nombre);
    setVida(null);
    setFCaducidad('');
    setError('');
  };

  const guardar = async () => {
    if (!producto && !pendiente) {
      setError('Elige un producto de la lista o créalo desde el buscador.');
      return;
    }
    const q = Number(cantidad.replace(',', '.'));
    if (!(q > 0)) {
      setError('Indica una cantidad mayor que cero.');
      return;
    }

    const destino =
      producto ??
      (await crearProducto({
        nombre: pendiente!,
        categoria,
        unidad,
        stockMin: Number(stockMin.replace(',', '.')) || 0,
      }));

    await registrarEntrada({
      productoId: destino.id,
      cantidad: q,
      fCompra: fCompra || hoyISO(),
      fCaducidad: fCaducidad || null,
      ubicacion,
      unidad,
    });

    onAviso(
      producto
        ? `Entrada guardada: ${q} ${unidad} de ${destino.nombre}.`
        : `${destino.nombre} añadido a tu lista de productos.`,
    );
    cerrar();
  };

  return (
    <Hoja
      abierta={abierta}
      onCerrar={cerrar}
      titulo="Nueva entrada"
      entradilla="Busca el producto en la lista. Si no está, puedes crearlo desde el buscador."
    >
      {producto || pendiente ? (
        <>
          <span className="lbl">Producto</span>
          <div className="pick">
            <div className="pick-l">
              <strong>{producto ? producto.nombre : pendiente}</strong>
              <small>
                {producto
                  ? `${producto.categoria} · ${stockDe(producto.id) > 0 ? `${stockDe(producto.id)} ${producto.unidad} en casa` : 'sin stock ahora'}`
                  : `${categoria} · primera vez en casa`}
              </small>
            </div>
            <button className="pick-x" onClick={limpiar}>
              Cambiar
            </button>
          </div>

          {!producto && (
            <div className="nuevo">
              <p>Primera vez — se creará su ficha al guardar</p>
              <div className="two">
                <label>
                  <span className="lbl">Categoría</span>
                  <select
                    value={categoria}
                    onChange={(e) => {
                      const c = e.target.value as Categoria;
                      setCategoria(c);
                      setUbicacion(UBICACION_SUGERIDA[c]);
                    }}
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="lbl">Stock mínimo</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={stockMin}
                    onChange={(e) => setStockMin(e.target.value)}
                  />
                </label>
              </div>
            </div>
          )}
        </>
      ) : (
        <BuscadorProducto opciones={opciones} onElegir={elegir} onCrear={crear} />
      )}

      <div className="two">
        <label>
          <span className="lbl">
            Cantidad <em>({unidad})</em>
          </span>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="0"
            value={cantidad}
            onChange={(e) => {
              setCantidad(e.target.value);
              setError('');
            }}
          />
        </label>
        <label>
          <span className="lbl">Unidad</span>
          <select value={unidad} onChange={(e) => setUnidad(e.target.value as Unidad)}>
            {UNIDADES.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="err">{error}</p>}
      {producto && unidad !== producto.unidad && (
        <p className="hint">
          Cambiarás la unidad de <strong>{producto.nombre}</strong> de {producto.unidad} a {unidad} en
          toda su ficha.
        </p>
      )}

      <label>
        <span className="lbl">Ubicación</span>
        <select value={ubicacion} onChange={(e) => setUbicacion(e.target.value as Ubicacion)}>
          {UBICACIONES.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </label>

      <div className="two">
        <label>
          <span className="lbl">Fecha de compra</span>
          <input type="date" value={fCompra} onChange={(e) => setFCompra(e.target.value)} />
        </label>
        <label>
          <span className="lbl">Caducidad</span>
          <input
            type="date"
            value={fCaducidad}
            onChange={(e) => {
              setFCaducidad(e.target.value);
              setVida(null);
            }}
          />
        </label>
      </div>

      <p className="hint">
        {vida
          ? `Caducidad estimada por vida útil típica (${vida} ${vida === 1 ? 'día' : 'días'}). Ajústala si el envase indica otra.`
          : 'Puedes dejar la caducidad en blanco: el lote se guarda como «sin fecha».'}
      </p>

      <button className="btn btn-primary" onClick={guardar}>
        {producto ? 'Guardar entrada' : 'Crear producto y guardar entrada'}
      </button>
    </Hoja>
  );
}

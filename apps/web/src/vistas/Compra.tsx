import {
  CATALOGO,
  opcionesDeProducto,
  textoOrigen,
  type ItemCompra,
  type OpcionProducto,
} from '@invenlux/core';
import { useMemo } from 'react';
import { BuscadorProducto } from '../componentes/BuscadorProducto';
import { Vacio } from '../componentes/Hoja';
import { useInventario } from '../estado/InventarioProvider';

/**
 * HU-07 + HU-08 · lista de la compra.
 *
 * Se apunta con el mismo buscador que el alta de inventario: reconoce lo que
 * ya tienes y el catálogo común, y si escribes algo que no existe crea la
 * ficha del producto. Así lo que se apunta queda siempre vinculado a un
 * producto, y al marcarlo comprado se puede dar de alta su lote directamente.
 */
export function Compra({ onReponer }: { onReponer: (productoId: string) => void }) {
  const { productos, movimientos, lista, añadirALista, alternarComprado, quitarDeLista, crearProducto } =
    useInventario();

  const opciones = useMemo(() => opcionesDeProducto(productos, movimientos), [productos, movimientos]);

  const pendientes = lista.filter((i) => !i.comprado);
  const enCarro = lista.filter((i) => i.comprado);

  const elegir = async (o: OpcionProducto) => {
    if (o.clave.startsWith('p:')) {
      await añadirALista(o.nombre, o.clave.slice(2));
      return;
    }
    // Del catálogo: se crea la ficha para que quede vinculada, aún sin stock.
    const cat = CATALOGO[Number(o.clave.slice(2))];
    const producto = await crearProducto({
      nombre: cat.nombre,
      categoria: cat.categoria,
      unidad: cat.unidad,
      stockMin: 1,
    });
    await añadirALista(producto.nombre, producto.id);
  };

  const crear = async (nombre: string) => {
    const producto = await crearProducto({
      nombre,
      categoria: 'Otros',
      unidad: 'unidades',
      stockMin: 1,
    });
    await añadirALista(producto.nombre, producto.id);
  };

  const fila = (i: ItemCompra) => (
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
      <BuscadorProducto
        opciones={opciones}
        onElegir={elegir}
        onCrear={crear}
        etiqueta="Añadir a la lista"
        marcador="Busca o escribe un producto"
        limpiarAlElegir
      />

      {pendientes.length ? (
        pendientes.map(fila)
      ) : (
        <Vacio titulo="Lista vacía" texto="Cuando algo se acabe o baje del mínimo, aparecerá aquí solo." />
      )}

      {enCarro.length > 0 && (
        <>
          <h3 className="titulo-seccion">En el carro</h3>
          {enCarro.map(fila)}
        </>
      )}
    </>
  );
}

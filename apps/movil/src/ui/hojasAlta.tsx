import {
  CATEGORIAS,
  UBICACIONES,
  UNIDADES,
  hoyISO,
  type Categoria,
  type Ubicacion,
  type Unidad,
} from '@invenlux/core';
import React, { useState } from 'react';
import { View } from 'react-native';
import { useInventario } from '../estado/InventarioProvider';
import { Boton, Campo, Hoja, Opciones } from './componentes';

const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

/** HU-01 · alta de producto. Al crearlo encadena con su primera entrada. */
export function HojaNuevoProducto({
  visible,
  onCerrar,
  onCreado,
}: {
  visible: boolean;
  onCerrar: () => void;
  onCreado: (productoId: string) => void;
}) {
  const { crearProducto } = useInventario();
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<Categoria>('Lácteos');
  const [unidad, setUnidad] = useState<Unidad>('unidades');
  const [stockMin, setStockMin] = useState('1');
  const [error, setError] = useState('');

  const limpiar = () => {
    setNombre('');
    setCategoria('Lácteos');
    setUnidad('unidades');
    setStockMin('1');
    setError('');
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      setError('Escribe un nombre para el producto.');
      return;
    }
    const producto = await crearProducto({
      nombre: nombre.trim(),
      categoria,
      unidad,
      stockMin: Number(stockMin.replace(',', '.')) || 0,
    });
    limpiar();
    onCreado(producto.id);
  };

  return (
    <Hoja
      visible={visible}
      onCerrar={onCerrar}
      titulo="Nuevo producto"
      entradilla="Crea la ficha. Después añades la primera entrada con su fecha de caducidad."
    >
      <Campo
        etiqueta="Nombre"
        value={nombre}
        onChangeText={(t) => {
          setNombre(t);
          setError('');
        }}
        placeholder="Ej. Yogur natural"
        error={error}
      />
      <Opciones etiqueta="Categoría" valor={categoria} opciones={CATEGORIAS} onCambio={setCategoria} />
      <Opciones etiqueta="Unidad" valor={unidad} opciones={UNIDADES} onCambio={setUnidad} />
      <Campo
        etiqueta={`Stock mínimo (${unidad})`}
        value={stockMin}
        onChangeText={setStockMin}
        keyboardType="decimal-pad"
        ayuda="Cuando el stock baje de aquí, el producto entra solo en la lista de la compra."
      />
      <Boton onPress={guardar}>Crear producto</Boton>
    </Hoja>
  );
}

/** HU-02 · alta de lote/entrada. */
export function HojaEntrada({
  productoId,
  onCerrar,
}: {
  productoId: string | null;
  onCerrar: () => void;
}) {
  const { productos, registrarEntrada } = useInventario();
  const producto = productos.find((p) => p.id === productoId);

  const [cantidad, setCantidad] = useState('');
  const [ubicacion, setUbicacion] = useState<Ubicacion>('Nevera');
  const [fCompra, setFCompra] = useState(hoyISO());
  const [fCaducidad, setFCaducidad] = useState('');
  const [error, setError] = useState('');

  const guardar = async () => {
    const q = Number(cantidad.replace(',', '.'));
    if (!(q > 0)) {
      setError('Indica una cantidad mayor que cero.');
      return;
    }
    if (fCaducidad && !FECHA_VALIDA.test(fCaducidad)) {
      setError('La caducidad debe ir en formato AAAA-MM-DD.');
      return;
    }
    await registrarEntrada({
      productoId: producto!.id,
      cantidad: q,
      fCompra: FECHA_VALIDA.test(fCompra) ? fCompra : hoyISO(),
      fCaducidad: fCaducidad || null,
      ubicacion,
    });
    setCantidad('');
    setFCaducidad('');
    setError('');
    onCerrar();
  };

  return (
    <Hoja
      visible={!!producto}
      onCerrar={onCerrar}
      titulo="Nueva entrada"
      entradilla={producto ? `${producto.nombre} · registra lo que acabas de comprar.` : ''}
    >
      <Campo
        etiqueta={`Cantidad (${producto?.unidad ?? ''})`}
        value={cantidad}
        onChangeText={(t) => {
          setCantidad(t);
          setError('');
        }}
        keyboardType="decimal-pad"
        placeholder="0"
        error={error}
      />
      <Opciones etiqueta="Ubicación" valor={ubicacion} opciones={UBICACIONES} onCambio={setUbicacion} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Campo etiqueta="Fecha de compra" value={fCompra} onChangeText={setFCompra} placeholder="AAAA-MM-DD" />
        </View>
        <View style={{ flex: 1 }}>
          <Campo
            etiqueta="Caducidad"
            value={fCaducidad}
            onChangeText={setFCaducidad}
            placeholder="AAAA-MM-DD"
            ayuda="Déjala en blanco y el lote queda «sin fecha»: se consumirá el último."
          />
        </View>
      </View>
      <Boton onPress={guardar}>Guardar entrada</Boton>
    </Hoja>
  );
}

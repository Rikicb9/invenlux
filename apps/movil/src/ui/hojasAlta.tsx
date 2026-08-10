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
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useInventario } from '../estado/InventarioProvider';
import { BuscadorProducto } from './BuscadorProducto';
import { Boton, Campo, Etiqueta, Hoja, Opciones } from './componentes';
import { color, fuente, radio } from './tema';

const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * HU-01 + HU-02 · alta unificada.
 * Un único paso: si el producto ya existe se le añade el lote; si no, se crea
 * su ficha y su primera entrada en la misma acción de guardado.
 */
export function HojaEntrada({
  visible,
  productoId,
  onCerrar,
}: {
  visible: boolean;
  /** Preselección al venir del detalle o de la lista de la compra. */
  productoId?: string | null;
  onCerrar: () => void;
}) {
  const { productos, movimientos, crearProducto, registrarEntrada } = useInventario();

  const [seleccionado, setSeleccionado] = useState<string | null>(productoId ?? null);
  const [pendiente, setPendiente] = useState<{ nombre: string; deCatalogo: boolean } | null>(null);
  const [categoria, setCategoria] = useState<Categoria>('Otros');
  const [stockMin, setStockMin] = useState('1');
  const [unidad, setUnidad] = useState<Unidad>('unidades');
  const [vida, setVida] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [ubicacion, setUbicacion] = useState<Ubicacion>('Nevera');
  const [fCompra, setFCompra] = useState(hoyISO());
  const [fCaducidad, setFCaducidad] = useState('');
  const [error, setError] = useState('');

  const opciones = useMemo(
    () => opcionesDeProducto(productos, movimientos),
    [productos, movimientos],
  );

  const producto = productos.find((p) => p.id === (seleccionado ?? productoId));

  const reiniciar = () => {
    setSeleccionado(null);
    setPendiente(null);
    setVida(null);
    setFCaducidad('');
    setCantidad('');
    setError('');
  };

  const elegir = (o: OpcionProducto) => {
    setCategoria(o.categoria);
    setUnidad(o.unidad);
    setUbicacion(UBICACION_SUGERIDA[o.categoria]);
    setError('');

    if (o.clave.startsWith('p:')) {
      setSeleccionado(o.clave.slice(2));
      setPendiente(null);
      setVida(null);
      return;
    }
    const cat = CATALOGO[Number(o.clave.slice(2))];
    setSeleccionado(null);
    setPendiente({ nombre: cat.nombre, deCatalogo: true });
    setVida(cat.vida);
    setFCaducidad(cat.vida ? sumarDias(hoyISO(), cat.vida) : '');
  };

  const crear = (nombre: string) => {
    setSeleccionado(null);
    setPendiente({ nombre, deCatalogo: false });
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
    if (fCaducidad && !FECHA_VALIDA.test(fCaducidad)) {
      setError('La caducidad debe ir en formato AAAA-MM-DD.');
      return;
    }

    const destino =
      producto ??
      (await crearProducto({
        nombre: pendiente!.nombre,
        categoria,
        unidad,
        stockMin: Number(stockMin.replace(',', '.')) || 0,
      }));

    await registrarEntrada({
      productoId: destino.id,
      cantidad: q,
      fCompra: FECHA_VALIDA.test(fCompra) ? fCompra : hoyISO(),
      fCaducidad: fCaducidad || null,
      ubicacion,
      unidad,
    });

    reiniciar();
    onCerrar();
  };

  const cabecera = producto ?? pendiente;

  return (
    <Hoja
      visible={visible}
      onCerrar={onCerrar}
      titulo="Nueva entrada"
      entradilla="Busca el producto en la lista. Si no está, puedes crearlo desde el buscador."
    >
      {cabecera ? (
        <View>
          <Etiqueta>Producto</Etiqueta>
          <View style={est.elegido}>
            <View style={{ flex: 1 }}>
              <Text style={est.elegidoNombre}>{producto ? producto.nombre : pendiente!.nombre}</Text>
              <Text style={est.elegidoMeta}>
                {producto ? `${producto.categoria} · ya en tu inventario` : `${categoria} · primera vez en casa`}
              </Text>
            </View>
            <Boton variante="suave" style={{ paddingHorizontal: 14 }} onPress={reiniciar}>
              Cambiar
            </Boton>
          </View>

          {!producto && (
            <View style={est.nuevo}>
              <Text style={est.nuevoTitulo}>Se creará su ficha al guardar</Text>
              <Opciones etiqueta="Categoría" valor={categoria} opciones={CATEGORIAS} onCambio={(c) => {
                setCategoria(c);
                setUbicacion(UBICACION_SUGERIDA[c]);
              }} />
              <Campo
                etiqueta={`Stock mínimo (${unidad})`}
                value={stockMin}
                onChangeText={setStockMin}
                keyboardType="decimal-pad"
              />
            </View>
          )}
        </View>
      ) : (
        <BuscadorProducto opciones={opciones} onElegir={elegir} onCrear={crear} />
      )}

      <Campo
        etiqueta={`Cantidad (${unidad})`}
        value={cantidad}
        onChangeText={(t) => {
          setCantidad(t);
          setError('');
        }}
        keyboardType="decimal-pad"
        placeholder="0"
        error={error}
      />
      <Opciones etiqueta="Unidad" valor={unidad} opciones={UNIDADES} onCambio={setUnidad} />
      {!!producto && unidad !== producto.unidad && (
        <Text style={est.aviso}>
          Cambiarás la unidad de {producto.nombre} de {producto.unidad} a {unidad} en toda su ficha.
        </Text>
      )}

      <Opciones etiqueta="Ubicación" valor={ubicacion} opciones={UBICACIONES} onCambio={setUbicacion} />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Campo etiqueta="Fecha de compra" value={fCompra} onChangeText={setFCompra} placeholder="AAAA-MM-DD" />
        </View>
        <View style={{ flex: 1 }}>
          <Campo
            etiqueta="Caducidad"
            value={fCaducidad}
            onChangeText={(t) => {
              setFCaducidad(t);
              setVida(null);
            }}
            placeholder="AAAA-MM-DD"
          />
        </View>
      </View>
      <Text style={est.pista}>
        {vida
          ? `Caducidad estimada por vida útil típica (${vida} ${vida === 1 ? 'día' : 'días'}). Ajústala si el envase indica otra.`
          : 'Puedes dejar la caducidad en blanco: el lote se guarda como «sin fecha».'}
      </Text>

      <Boton onPress={guardar}>
        {producto ? 'Guardar entrada' : 'Crear producto y guardar entrada'}
      </Boton>
    </Hoja>
  );
}

const est = StyleSheet.create({
  elegido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: color.superficie,
    borderWidth: 1,
    borderColor: color.linea,
    borderRadius: radio.m,
    padding: 12,
    marginBottom: 12,
  },
  elegidoNombre: { fontFamily: fuente.textoFuerte, fontSize: 14.5, color: color.tinta },
  elegidoMeta: { fontFamily: fuente.texto, fontSize: 11.5, color: color.tintaSuave, marginTop: 2 },
  nuevo: { backgroundColor: color.frescoSuave, borderRadius: radio.m, padding: 12, marginBottom: 12 },
  nuevoTitulo: { fontFamily: fuente.textoFuerte, fontSize: 12, color: color.fresco, marginBottom: 10 },
  aviso: { fontFamily: fuente.texto, fontSize: 11.5, color: color.tintaSuave, marginTop: -6, marginBottom: 12, lineHeight: 16 },
  pista: { fontFamily: fuente.texto, fontSize: 11.5, color: color.tintaSuave, marginTop: -6, marginBottom: 14, lineHeight: 16 },
});

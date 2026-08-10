import {
  estadoCaducidad,
  etiquetaEstado,
  formatearCantidad,
  formatearFecha,
  ordenarLotes,
  pasosRapidos,
} from '@invenlux/core';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { mensajeConsumo, useInventario } from '../estado/InventarioProvider';
import { Badge, Boton, Campo, Etiqueta, Hoja, Interruptor, Ubicacion } from './componentes';
import { color, espacio, fuente, radio } from './tema';

/** HU-04 · registro de consumo con la menor fricción posible. */
export function HojaConsumo({
  productoId,
  onCerrar,
  onAviso,
}: {
  productoId: string | null;
  onCerrar: () => void;
  onAviso: (texto: string) => void;
}) {
  const { productos, registrarConsumo, stockDe } = useInventario();
  const producto = productos.find((p) => p.id === productoId);
  const [otra, setOtra] = useState('');

  if (!producto) return <Hoja visible={false} onCerrar={onCerrar} titulo="" children={null} />;

  const stock = stockDe(producto.id);

  const consumir = async (cantidad: number) => {
    const q = Math.min(cantidad, stock);
    if (!(q > 0)) return;
    const r = await registrarConsumo(producto.id, q);
    onAviso(mensajeConsumo(producto.nombre, r.servido, producto.unidad, r));
    setOtra('');
    onCerrar();
  };

  return (
    <Hoja
      visible
      onCerrar={onCerrar}
      titulo={producto.nombre}
      entradilla={`Quedan ${formatearCantidad(stock, producto.unidad)} · se descuenta por FEFO`}
    >
      <View style={est.rejilla}>
        {pasosRapidos(producto.unidad).map((n) => (
          <Pressable key={n} onPress={() => consumir(n)} style={est.paso} accessibilityRole="button">
            <Text style={est.pasoTexto}>−{String(n).replace('.', ',')}</Text>
          </Pressable>
        ))}
      </View>

      <Campo
        etiqueta="Otra cantidad"
        value={otra}
        onChangeText={setOtra}
        keyboardType="decimal-pad"
        placeholder="0"
      />
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: espacio.m }}>
        <Boton variante="suave" style={{ flex: 1 }} onPress={() => consumir(Number(otra.replace(',', '.')) || 0)}>
          Descontar
        </Boton>
      </View>

      <Boton variante="peligro" onPress={() => consumir(stock)}>
        Se acabó — vaciar y añadir a la compra
      </Boton>
    </Hoja>
  );
}

/** HU-03 + HU-05 · detalle: lotes en orden FEFO, histórico y reposición. */
export function HojaDetalle({
  productoId,
  onCerrar,
  onConsumir,
  onEntrada,
}: {
  productoId: string | null;
  onCerrar: () => void;
  onConsumir: (id: string) => void;
  onEntrada: (id: string) => void;
}) {
  const { productos, lotes, movimientos, ajustes, stockDe, actualizarProducto } = useInventario();
  const producto = productos.find((p) => p.id === productoId);
  if (!producto) return <Hoja visible={false} onCerrar={onCerrar} titulo="" children={null} />;

  const orden = ordenarLotes(producto.id, lotes, movimientos, ajustes.estrategia);
  const consumos = movimientos
    .filter((m) => m.productoId === producto.id && m.tipo === 'consumo')
    .slice(0, 6);

  return (
    <Hoja
      visible
      onCerrar={onCerrar}
      titulo={producto.nombre}
      entradilla={`${producto.categoria} · ${formatearCantidad(stockDe(producto.id), producto.unidad)} en total`}
    >
      <View style={est.bloque}>
        <Etiqueta>Lotes en orden FEFO</Etiqueta>
        {orden.length === 0 && <Text style={est.tenue}>Sin stock.</Text>}
        {orden.map((l, i) => {
          const e = estadoCaducidad(l.fCaducidad, ajustes.diasAviso);
          return (
            <View key={l.id} style={[est.fila, i === orden.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={est.cantidad}>{formatearCantidad(l.stock, producto.unidad)}</Text>
                  {i === 0 && (
                    <View style={est.siguiente}>
                      <Text style={est.siguienteTexto}>SIGUIENTE</Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Ubicacion nombre={l.ubicacion} />
                  <Text style={est.tenue}>caduca {formatearFecha(l.fCaducidad)}</Text>
                </View>
              </View>
              <Badge clave={e.clave} texto={etiquetaEstado(e)} />
            </View>
          );
        })}
      </View>

      <View style={est.bloque}>
        <Etiqueta>Historial de consumo</Etiqueta>
        {consumos.length === 0 && <Text style={est.tenue}>Todavía no has registrado consumos.</Text>}
        {consumos.map((m) => {
          const lote = lotes.find((l) => l.id === m.loteId);
          const h = new Date(m.fecha);
          return (
            <View key={m.id} style={est.filaMov}>
              <Text style={est.movTexto}>
                −{formatearCantidad(m.cantidad, producto.unidad)} · {lote?.ubicacion ?? '—'}
              </Text>
              <Text style={est.movFecha}>
                {h.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}{' '}
                {h.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={est.bloque}>
        <Etiqueta>Reposición</Etiqueta>
        <Campo
          etiqueta={`Stock mínimo (${producto.unidad})`}
          defaultValue={String(producto.stockMin)}
          keyboardType="decimal-pad"
          onEndEditing={(ev) =>
            actualizarProducto({
              ...producto,
              stockMin: Number(ev.nativeEvent.text.replace(',', '.')) || 0,
            })
          }
        />
        <Interruptor
          activo={producto.autoCompra}
          onCambio={(v) => actualizarProducto({ ...producto, autoCompra: v })}
          titulo="Añadir solo a la compra"
          descripcion="Al terminarse o bajar del mínimo, entra en la lista."
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Boton variante="suave" style={{ flex: 1 }} onPress={() => onEntrada(producto.id)}>
          Añadir entrada
        </Boton>
        <Boton style={{ flex: 1 }} onPress={() => onConsumir(producto.id)}>
          Registrar consumo
        </Boton>
      </View>
    </Hoja>
  );
}

const est = StyleSheet.create({
  rejilla: { flexDirection: 'row', gap: 7, marginBottom: espacio.m },
  paso: {
    flex: 1,
    backgroundColor: color.superficie,
    borderWidth: 1,
    borderColor: color.linea,
    borderRadius: radio.m,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pasoTexto: { fontFamily: fuente.monoFuerte, fontSize: 14, color: color.tinta },
  bloque: {
    backgroundColor: color.superficie,
    borderRadius: radio.l,
    padding: 14,
    marginBottom: 10,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: color.linea,
  },
  cantidad: { fontFamily: fuente.monoFuerte, fontSize: 14, color: color.tinta },
  siguiente: { backgroundColor: color.tinta, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  siguienteTexto: { fontFamily: fuente.monoFuerte, fontSize: 8.5, color: '#fff', letterSpacing: 0.7 },
  tenue: { fontFamily: fuente.texto, fontSize: 12, color: color.tintaSuave, lineHeight: 17 },
  fuerte: { fontFamily: fuente.textoFuerte, color: color.tinta },
  filaMov: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: color.linea,
  },
  movTexto: { fontFamily: fuente.texto, fontSize: 12.5, color: color.tinta },
  movFecha: { fontFamily: fuente.mono, fontSize: 11.5, color: color.tintaSuave },
});

/**
 * Quitar del inventario: dos salidas que no son lo mismo.
 * "Se acabó" es un consumo real (descuenta por FEFO, deja histórico y entra
 * en la compra). "Eliminar" borra la ficha entera: es para errores.
 */
export function HojaQuitar({
  productoId,
  onCerrar,
  onAviso,
}: {
  productoId: string | null;
  onCerrar: () => void;
  onAviso: (texto: string) => void;
}) {
  const { productos, stockDe, registrarConsumo, eliminarProducto } = useInventario();
  const producto = productos.find((p) => p.id === productoId);
  if (!producto) return <Hoja visible={false} onCerrar={onCerrar} titulo="" children={null} />;

  const stock = stockDe(producto.id);

  const acabar = async () => {
    onCerrar();
    if (stock > 0) {
      const r = await registrarConsumo(producto.id, stock);
      onAviso(mensajeConsumo(producto.nombre, r.servido, producto.unidad, r));
    } else {
      onAviso(`${producto.nombre} ya estaba a cero.`);
    }
  };

  const eliminar = async () => {
    onCerrar();
    await eliminarProducto(producto.id);
    onAviso(`${producto.nombre} eliminado del inventario.`);
  };

  return (
    <Hoja
      visible
      onCerrar={onCerrar}
      titulo={producto.nombre}
      entradilla={`Quedan ${formatearCantidad(stock, producto.unidad)} · ${producto.categoria}`}
    >
      <View style={est.bloque}>
        <Etiqueta>¿Qué ha pasado?</Etiqueta>
        <Text style={est.tenue}>
          <Text style={est.fuerte}>Se acabó</Text> — lo has consumido. Se descuenta todo el stock por
          FEFO, queda en el histórico y el producto entra en la lista de la compra.
        </Text>
        <Text style={[est.tenue, { marginTop: 9 }]}>
          <Text style={est.fuerte}>Eliminar producto</Text> — lo creaste por error o ya no lo compras.
          Se borra la ficha, sus lotes y su histórico. No se puede deshacer.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Boton variante="suave" style={{ flex: 1 }} onPress={eliminar}>
          Eliminar producto
        </Boton>
        <Boton variante="peligro" style={{ flex: 1 }} onPress={acabar}>
          Se acabó
        </Boton>
      </View>
    </Hoja>
  );
}

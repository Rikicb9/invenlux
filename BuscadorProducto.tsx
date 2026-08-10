import {
  agruparPorCategoria,
  filtrarOpciones,
  normalizar,
  type OpcionProducto,
} from '@invenlux/core';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { color, espacio, fuente, radio } from './tema';

/**
 * Buscador de producto: la lista sale desplegada al abrir y se filtra a
 * medida que se escribe. Si nada encaja, ofrece crear el producto ahí mismo.
 */
export function BuscadorProducto({
  opciones,
  onElegir,
  onCrear,
}: {
  opciones: readonly OpcionProducto[];
  onElegir: (opcion: OpcionProducto) => void;
  onCrear: (nombre: string) => void;
}) {
  const [consulta, setConsulta] = useState('');
  const q = consulta.trim();

  const filtradas = useMemo(() => filtrarOpciones(opciones, q), [opciones, q]);
  const grupos = useMemo(() => (q ? [] : agruparPorCategoria(filtradas)), [filtradas, q]);
  const hayExacta = filtradas.some((o) => normalizar(o.nombre) === normalizar(q));

  const fila = (o: OpcionProducto) => (
    <Pressable
      key={o.clave}
      onPress={() => onElegir(o)}
      accessibilityRole="button"
      style={({ pressed }) => [est.opcion, pressed && { backgroundColor: color.superficie2 }]}
    >
      <View style={est.opcionCabecera}>
        <Text style={est.opcionNombre}>{o.nombre}</Text>
        {o.stock > 0 && (
          <View style={est.sello}>
            <Text style={est.selloTexto}>EN CASA</Text>
          </View>
        )}
      </View>
      <Text style={est.opcionMeta}>
        {o.categoria}
        {o.detalle ? ` · ${o.detalle}` : ''}
      </Text>
    </Pressable>
  );

  return (
    <View>
      <Text style={est.etiqueta}>PRODUCTO</Text>
      <TextInput
        value={consulta}
        onChangeText={setConsulta}
        placeholder="Busca o escribe un producto"
        placeholderTextColor={color.tintaTenue}
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={() => {
          if (filtradas.length) onElegir(filtradas[0]);
          else if (q) onCrear(q);
        }}
        style={est.input}
      />

      <ScrollView style={est.lista} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
        {q ? (
          <>
            {filtradas.slice(0, 30).map(fila)}
            {!filtradas.length && (
              <Text style={est.vacio}>Nada coincide con «{q}».</Text>
            )}
            {!hayExacta && (
              <Pressable onPress={() => onCrear(q)} style={[est.opcion, est.opcionNueva]}>
                <Text style={[est.opcionNombre, { color: color.fresco }]}>Crear «{q}»</Text>
                <Text style={est.opcionMeta}>Se añadirá a tu lista de productos</Text>
              </Pressable>
            )}
          </>
        ) : (
          grupos.map((g) => (
            <View key={g.categoria}>
              <Text style={est.grupo}>{g.categoria.toUpperCase()}</Text>
              {g.opciones.map(fila)}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const est = StyleSheet.create({
  etiqueta: {
    fontFamily: fuente.monoFuerte,
    fontSize: 9.5,
    letterSpacing: 0.9,
    color: color.tintaSuave,
    marginBottom: 5,
  },
  input: {
    backgroundColor: color.superficie,
    borderWidth: 1,
    borderColor: color.linea,
    borderRadius: radio.m,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: fuente.texto,
    fontSize: 15,
    color: color.tinta,
  },
  lista: {
    maxHeight: 252,
    backgroundColor: color.superficie,
    borderWidth: 1,
    borderColor: color.linea,
    borderRadius: radio.m,
    marginTop: espacio.s,
    marginBottom: espacio.m,
  },
  opcion: { paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: color.linea },
  opcionNueva: { backgroundColor: color.frescoSuave },
  opcionCabecera: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  opcionNombre: { fontFamily: fuente.textoFuerte, fontSize: 14, color: color.tinta },
  opcionMeta: { fontFamily: fuente.texto, fontSize: 11, color: color.tintaSuave, marginTop: 2 },
  sello: { backgroundColor: color.frescoSuave, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  selloTexto: { fontFamily: fuente.monoFuerte, fontSize: 8.5, letterSpacing: 0.5, color: color.fresco },
  grupo: {
    fontFamily: fuente.monoFuerte,
    fontSize: 9.5,
    letterSpacing: 0.9,
    color: color.tintaTenue,
    backgroundColor: color.superficie2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: color.linea,
  },
  vacio: { fontFamily: fuente.texto, fontSize: 12.5, color: color.tintaSuave, padding: 14 },
});

import { textoOrigen, type ItemCompra } from '@invenlux/core';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useInventario } from '../../src/estado/InventarioProvider';
import { Boton, Etiqueta, Vacio } from '../../src/ui/componentes';
import { Pantalla } from '../../src/ui/Pantalla';
import { color, espacio, fuente, radio, sombra } from '../../src/ui/tema';

export default function Compra() {
  const { lista, añadirALista, alternarComprado, quitarDeLista } = useInventario();
  const [texto, setTexto] = useState('');

  const pendientes = lista.filter((i) => !i.comprado);
  const enCarro = lista.filter((i) => i.comprado);

  const añadir = async () => {
    await añadirALista(texto);
    setTexto('');
  };

  return (
    <Pantalla titulo="Lista de la compra" subtitulo={`${pendientes.length} pendientes`}>
      <View style={est.añadir}>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          onSubmitEditing={añadir}
          returnKeyType="done"
          placeholder="Añadir a la lista…"
          placeholderTextColor={color.tintaTenue}
          style={est.input}
        />
        <Boton onPress={añadir} style={{ paddingHorizontal: 18 }}>
          Añadir
        </Boton>
      </View>

      {pendientes.length === 0 ? (
        <Vacio
          titulo="Lista vacía"
          texto="Cuando algo se acabe o baje del mínimo, aparecerá aquí solo."
        />
      ) : (
        pendientes.map((i) => (
          <Fila key={i.id} item={i} onAlternar={alternarComprado} onQuitar={quitarDeLista} />
        ))
      )}

      {enCarro.length > 0 && (
        <View style={{ marginTop: espacio.l }}>
          <Etiqueta>En el carro</Etiqueta>
          {enCarro.map((i) => (
            <Fila key={i.id} item={i} onAlternar={alternarComprado} onQuitar={quitarDeLista} />
          ))}
        </View>
      )}
    </Pantalla>
  );
}

function Fila({
  item,
  onAlternar,
  onQuitar,
}: {
  item: ItemCompra;
  onAlternar: (i: ItemCompra) => void;
  onQuitar: (id: string) => void;
}) {
  return (
    <View style={est.fila}>
      <Pressable
        onPress={() => onAlternar(item)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.comprado }}
        accessibilityLabel={`Marcar ${item.texto} como comprado`}
        style={[est.casilla, item.comprado && { backgroundColor: color.fresco, borderColor: color.fresco }]}
      >
        {item.comprado && <Text style={est.tick}>✓</Text>}
      </Pressable>

      <View style={{ flex: 1 }}>
        <Text style={[est.nombre, item.comprado && est.tachado]}>{item.texto}</Text>
        <Text style={est.origen}>{textoOrigen(item.origen)}</Text>
      </View>

      <Pressable
        onPress={() => onQuitar(item.id)}
        accessibilityLabel={`Quitar ${item.texto} de la lista`}
        hitSlop={8}
      >
        <Text style={est.quitar}>×</Text>
      </Pressable>
    </View>
  );
}

const est = StyleSheet.create({
  añadir: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  input: {
    flex: 1,
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
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: color.superficie,
    borderRadius: radio.l,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    ...sombra,
  },
  casilla: {
    width: 21,
    height: 21,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: color.linea,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: { color: '#fff', fontSize: 12, lineHeight: 14 },
  nombre: { fontFamily: fuente.textoFuerte, fontSize: 14.5, color: color.tinta },
  tachado: { textDecorationLine: 'line-through', color: color.tintaTenue },
  origen: { fontFamily: fuente.texto, fontSize: 11, color: color.tintaSuave, marginTop: 2 },
  quitar: { fontSize: 20, color: color.tintaTenue, paddingHorizontal: 3 },
});

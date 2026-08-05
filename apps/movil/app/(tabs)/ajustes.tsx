import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useInventario } from '../../src/estado/InventarioProvider';
import { Badge, Etiqueta } from '../../src/ui/componentes';
import { Pantalla } from '../../src/ui/Pantalla';
import { color, fuente, radio } from '../../src/ui/tema';

const UMBRALES = [1, 2, 3, 5, 7];

export default function Ajustes() {
  const { ajustes, cambiarAjustes } = useInventario();

  return (
    <Pantalla titulo="Ajustes" subtitulo="Umbrales y preferencias del hogar">
      <View style={est.bloque}>
        <Etiqueta>Aviso de caducidad</Etiqueta>
        <Text style={est.texto}>Avisar con antelación de</Text>
        <View style={est.opciones}>
          {UMBRALES.map((n) => {
            const activo = ajustes.diasAviso === n;
            return (
              <Pressable
                key={n}
                onPress={() => cambiarAjustes({ ...ajustes, diasAviso: n })}
                accessibilityRole="radio"
                accessibilityState={{ selected: activo }}
                style={[est.chip, activo && { backgroundColor: color.tinta, borderColor: color.tinta }]}
              >
                <Text style={[est.chipTexto, activo && { color: '#fff' }]}>
                  {n} {n === 1 ? 'día' : 'días'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={est.ayuda}>
          Lo que quede por debajo de este umbral se marca en ámbar y aparece en «Caduca pronto».
        </Text>
      </View>

      <View style={est.bloque}>
        <Etiqueta>Método de salida de stock</Etiqueta>
        <View style={est.filaMetodo}>
          <View style={{ flex: 1 }}>
            <Text style={est.metodo}>FEFO</Text>
            <Text style={est.ayuda}>First Expired, First Out</Text>
          </View>
          <Badge clave="en-plazo" texto="Activo" />
        </View>
        <Text style={est.ayuda}>
          Al registrar un consumo se descuenta primero del lote que antes caduca. FIFO y LIFO ya
          existen en el motor, pero se activan en la fase de negocio.
        </Text>
      </View>

      <View style={est.bloque}>
        <Etiqueta>Alcance de esta versión</Etiqueta>
        <Text style={est.ayuda}>
          Sprint 1 cubre el bloque «Must have» del MVP: alta de productos y lotes, ubicaciones,
          consumo con FEFO, avisos de caducidad y lista de la compra dinámica. Escaneo, OCR de
          tickets, importación por email, recetas y voz llegan en los sprints 2 y 3.
        </Text>
      </View>
    </Pantalla>
  );
}

const est = StyleSheet.create({
  bloque: { backgroundColor: color.superficie, borderRadius: radio.l, padding: 14, marginBottom: 10 },
  texto: { fontFamily: fuente.texto, fontSize: 14, color: color.tinta },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: color.superficie2,
    borderWidth: 1,
    borderColor: color.linea,
  },
  chipTexto: { fontFamily: fuente.textoMedio, fontSize: 12.5, color: color.tintaSuave },
  ayuda: { fontFamily: fuente.texto, fontSize: 11.5, color: color.tintaSuave, marginTop: 8, lineHeight: 16 },
  filaMetodo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  metodo: { fontFamily: fuente.textoFuerte, fontSize: 14.5, color: color.tinta },
});

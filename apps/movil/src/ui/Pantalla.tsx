import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, espacio, fuente, radio } from './tema';

export function Pantalla({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo: string;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={est.raiz} edges={['top']}>
      <View style={est.cabecera}>
        <View style={est.marca}>
          <Text style={est.logo}>Invenlux</Text>
          <View style={est.sello}>
            <Text style={est.selloTexto}>SPRINT 1 · FEFO</Text>
          </View>
        </View>
        <Text style={est.titulo}>{titulo}</Text>
        <Text style={est.subtitulo}>{subtitulo}</Text>
      </View>
      <ScrollView
        contentContainerStyle={est.contenido}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const est = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: color.fondo },
  cabecera: { paddingHorizontal: espacio.l, paddingTop: espacio.m, paddingBottom: espacio.s },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logo: { fontFamily: fuente.displayFuerte, fontSize: 25, color: color.tinta, letterSpacing: -0.7 },
  sello: {
    borderWidth: 1,
    borderColor: color.linea,
    borderRadius: radio.s,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
  },
  selloTexto: { fontFamily: fuente.monoFuerte, fontSize: 9.5, letterSpacing: 1, color: color.tintaTenue },
  titulo: { fontFamily: fuente.display, fontSize: 17, color: color.tinta, marginTop: 16, letterSpacing: -0.3 },
  subtitulo: { fontFamily: fuente.texto, fontSize: 12.5, color: color.tintaSuave, marginTop: 2 },
  contenido: { paddingHorizontal: espacio.l, paddingBottom: 120 },
});

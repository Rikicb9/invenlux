import type { ClaveEstado } from '@invenlux/core';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { color, colorEstado, colorUbicacion, espacio, fuente, radio, sombra } from './tema';

export function Titulo({ children }: { children: React.ReactNode }) {
  return <Text style={est.titulo}>{children}</Text>;
}

export function Etiqueta({ children }: { children: React.ReactNode }) {
  return <Text style={est.etiqueta}>{children}</Text>;
}

export function Tarjeta({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[est.tarjeta, style]}>{children}</View>;
}

export function Badge({ clave, texto }: { clave: ClaveEstado; texto: string }) {
  const c = colorEstado(clave);
  return (
    <View style={[est.badge, { backgroundColor: c.fondo }]}>
      <Text style={[est.badgeTexto, { color: c.texto }]}>{texto.toUpperCase()}</Text>
    </View>
  );
}

export function Ubicacion({ nombre }: { nombre: string }) {
  const c = colorUbicacion(nombre);
  return (
    <View style={[est.ubicacion, { backgroundColor: c.fondo }]}>
      <Text style={[est.ubicacionTexto, { color: c.texto }]}>{nombre}</Text>
    </View>
  );
}

type VarianteBoton = 'primario' | 'suave' | 'peligro';

export function Boton({
  children,
  onPress,
  variante = 'primario',
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  variante?: VarianteBoton;
  style?: ViewStyle;
}) {
  const fondo =
    variante === 'primario'
      ? color.tinta
      : variante === 'peligro'
        ? color.urgenteSuave
        : color.superficie2;
  const texto =
    variante === 'primario' ? '#fff' : variante === 'peligro' ? color.urgente : color.tinta;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        est.boton,
        { backgroundColor: fondo, opacity: pressed ? 0.85 : 1 },
        variante === 'suave' && { borderWidth: 1, borderColor: color.linea },
        style,
      ]}
    >
      <Text style={[est.botonTexto, { color: texto }]}>{children}</Text>
    </Pressable>
  );
}

export function Campo({
  etiqueta,
  ayuda,
  error,
  ...props
}: TextInputProps & { etiqueta: string; ayuda?: string; error?: string }) {
  return (
    <View style={{ marginBottom: espacio.m }}>
      <Etiqueta>{etiqueta}</Etiqueta>
      <TextInput
        {...props}
        placeholderTextColor={color.tintaTenue}
        style={[est.input, !!error && { borderColor: color.urgente }]}
      />
      {!!error && <Text style={est.error}>{error}</Text>}
      {!!ayuda && !error && <Text style={est.ayuda}>{ayuda}</Text>}
    </View>
  );
}

/** Selector en línea: en la cocina se toca, no se despliega un picker. */
export function Opciones<T extends string>({
  etiqueta,
  valor,
  opciones,
  onCambio,
}: {
  etiqueta?: string;
  valor: T;
  opciones: readonly T[];
  onCambio: (v: T) => void;
}) {
  return (
    <View style={{ marginBottom: espacio.m }}>
      {!!etiqueta && <Etiqueta>{etiqueta}</Etiqueta>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {opciones.map((o) => {
            const activa = o === valor;
            return (
              <Pressable
                key={o}
                onPress={() => onCambio(o)}
                accessibilityRole="radio"
                accessibilityState={{ selected: activa }}
                style={[est.chip, activa && { backgroundColor: color.tinta, borderColor: color.tinta }]}
              >
                <Text style={[est.chipTexto, activa && { color: '#fff' }]}>{o}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export function Interruptor({
  activo,
  onCambio,
  titulo,
  descripcion,
}: {
  activo: boolean;
  onCambio: (v: boolean) => void;
  titulo: string;
  descripcion?: string;
}) {
  return (
    <Pressable
      onPress={() => onCambio(!activo)}
      accessibilityRole="switch"
      accessibilityState={{ checked: activo }}
      style={est.interruptorFila}
    >
      <View style={{ flex: 1 }}>
        <Text style={est.interruptorTitulo}>{titulo}</Text>
        {!!descripcion && <Text style={est.ayuda}>{descripcion}</Text>}
      </View>
      <View style={[est.pista, activo && { backgroundColor: color.fresco }]}>
        <View style={[est.pomo, activo && { left: 21 }]} />
      </View>
    </Pressable>
  );
}

/** Hoja inferior. Reemplaza al `<dialog>` del prototipo. */
export function Hoja({
  visible,
  onCerrar,
  titulo,
  entradilla,
  children,
}: {
  visible: boolean;
  onCerrar: () => void;
  titulo: string;
  entradilla?: string;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable style={est.velo} onPress={onCerrar} accessibilityLabel="Cerrar" />
      <View style={est.hoja}>
        <View style={est.asa} />
        <ScrollView keyboardShouldPersistTaps="handled">
          <Text style={est.hojaTitulo}>{titulo}</Text>
          {!!entradilla && <Text style={est.hojaEntradilla}>{entradilla}</Text>}
          {children}
          <View style={{ height: espacio.xl }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

/** Aviso efímero. Es donde la app explica qué ha hecho FEFO. */
export function Aviso({ texto, onFin }: { texto: string | null; onFin: () => void }) {
  const opacidad = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!texto) return;
    opacidad.setValue(0);
    Animated.timing(opacidad, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(opacidad, { toValue: 0, duration: 220, useNativeDriver: true }).start(onFin);
    }, 3600);
    return () => clearTimeout(t);
  }, [texto, opacidad, onFin]);

  if (!texto) return null;
  return (
    <Animated.View style={[est.aviso, { opacity: opacidad }]} accessibilityLiveRegion="polite">
      <Text style={est.avisoTexto}>{texto}</Text>
    </Animated.View>
  );
}

export function Vacio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <View style={est.vacio}>
      <Text style={est.vacioTitulo}>{titulo}</Text>
      <Text style={est.vacioTexto}>{texto}</Text>
    </View>
  );
}

const est = StyleSheet.create({
  titulo: { fontFamily: fuente.display, fontSize: 17, color: color.tinta, letterSpacing: -0.3 },
  etiqueta: {
    fontFamily: fuente.monoFuerte,
    fontSize: 9.5,
    letterSpacing: 0.9,
    color: color.tintaSuave,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  tarjeta: {
    backgroundColor: color.superficie,
    borderRadius: radio.l,
    padding: 14,
    marginBottom: 9,
    ...sombra,
  },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: radio.s },
  badgeTexto: { fontFamily: fuente.monoFuerte, fontSize: 9.5, letterSpacing: 0.5 },
  ubicacion: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: radio.s },
  ubicacionTexto: { fontFamily: fuente.textoMedio, fontSize: 10.5 },
  boton: {
    borderRadius: radio.m,
    alignSelf: 'stretch',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonTexto: { fontFamily: fuente.textoFuerte, fontSize: 14 },
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
  error: { fontFamily: fuente.textoMedio, fontSize: 12, color: color.urgente, marginTop: 5 },
  ayuda: { fontFamily: fuente.texto, fontSize: 11.5, color: color.tintaSuave, marginTop: 5, lineHeight: 16 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: color.superficie,
    borderWidth: 1,
    borderColor: color.linea,
  },
  chipTexto: { fontFamily: fuente.textoMedio, fontSize: 12.5, color: color.tintaSuave },
  interruptorFila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  interruptorTitulo: { fontFamily: fuente.textoFuerte, fontSize: 14, color: color.tinta },
  pista: { width: 44, height: 25, borderRadius: 13, backgroundColor: color.linea },
  pomo: {
    position: 'absolute',
    top: 2.5,
    left: 2.5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  velo: { flex: 1, backgroundColor: 'rgba(15,31,27,0.42)' },
  hoja: {
    backgroundColor: color.fondo,
    borderTopLeftRadius: radio.xl,
    borderTopRightRadius: radio.xl,
    paddingHorizontal: espacio.l,
    paddingTop: espacio.s,
    paddingBottom: espacio.xl,
    maxHeight: '88%',
  },
  asa: { width: 34, height: 4, borderRadius: 2, backgroundColor: color.linea, alignSelf: 'center', marginBottom: 14 },
  hojaTitulo: { fontFamily: fuente.display, fontSize: 19, color: color.tinta, letterSpacing: -0.4 },
  hojaEntradilla: { fontFamily: fuente.texto, fontSize: 12.5, color: color.tintaSuave, marginTop: 2, marginBottom: 16 },
  aviso: {
    position: 'absolute',
    left: espacio.l,
    right: espacio.l,
    bottom: 24,
    backgroundColor: color.tinta,
    borderRadius: radio.m,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avisoTexto: { fontFamily: fuente.textoMedio, fontSize: 13, color: '#fff', lineHeight: 18 },
  vacio: { alignItems: 'center', paddingHorizontal: espacio.xl, paddingVertical: 44 },
  vacioTitulo: { fontFamily: fuente.textoFuerte, fontSize: 14.5, color: color.tinta, marginBottom: 4 },
  vacioTexto: { fontFamily: fuente.texto, fontSize: 12.5, color: color.tintaSuave, textAlign: 'center', lineHeight: 18 },
});

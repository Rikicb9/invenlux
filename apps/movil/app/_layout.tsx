import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
} from '@expo-google-fonts/inter-tight';
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { InventarioProvider, useInventario } from '../src/estado/InventarioProvider';
import { color } from '../src/ui/tema';

export default function Raiz() {
  const [fuentesListas] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  if (!fuentesListas) {
    return (
      <View style={{ flex: 1, backgroundColor: color.fondo, justifyContent: 'center' }}>
        <ActivityIndicator color={color.fresco} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <InventarioProvider>
        <StatusBar style="dark" />
        <Contenido />
      </InventarioProvider>
    </SafeAreaProvider>
  );
}

/**
 * Si Supabase no responde, la app enseña el motivo. Sin esto, un fallo de
 * conexión o de RLS se vería como un inventario vacío, que es peor: parece
 * que se han perdido los datos.
 */
function Contenido() {
  const { error } = useInventario();
  if (!error) return <Stack screenOptions={{ headerShown: false }} />;

  return (
    <SafeAreaView style={est.aviso}>
      <Text style={est.avisoTitulo}>No se ha podido conectar</Text>
      <Text style={est.avisoTexto}>{error}</Text>
    </SafeAreaView>
  );
}

const est = StyleSheet.create({
  aviso: { flex: 1, backgroundColor: color.fondo, justifyContent: 'center', paddingHorizontal: 28, gap: 8 },
  avisoTitulo: { fontSize: 18, fontWeight: '700', color: color.tinta },
  avisoTexto: { fontSize: 14, color: color.tintaSuave, lineHeight: 20 },
});

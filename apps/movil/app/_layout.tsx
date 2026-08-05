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
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { InventarioProvider } from '../src/estado/InventarioProvider';
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
        <Stack screenOptions={{ headerShown: false }} />
      </InventarioProvider>
    </SafeAreaProvider>
  );
}

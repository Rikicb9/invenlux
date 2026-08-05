import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useInventario } from '../../src/estado/InventarioProvider';
import { color, fuente } from '../../src/ui/tema';

export default function Pestañas() {
  const { urgentes, lista } = useInventario();
  const pendientes = lista.filter((i) => !i.comprado).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.tinta,
        tabBarInactiveTintColor: color.tintaTenue,
        tabBarStyle: { backgroundColor: color.superficie, borderTopColor: color.linea },
        tabBarLabelStyle: { fontFamily: fuente.textoMedio, fontSize: 10.5 },
        tabBarBadgeStyle: { backgroundColor: color.urgente, fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inventario',
          tabBarIcon: ({ color: c, size }: { color: string; size: number }) => <Feather name="list" color={c} size={size} />,
        }}
      />
      <Tabs.Screen
        name="caduca"
        options={{
          title: 'Caduca',
          tabBarBadge: urgentes.length || undefined,
          tabBarIcon: ({ color: c, size }: { color: string; size: number }) => <Feather name="clock" color={c} size={size} />,
        }}
      />
      <Tabs.Screen
        name="compra"
        options={{
          title: 'Compra',
          tabBarBadge: pendientes || undefined,
          tabBarIcon: ({ color: c, size }: { color: string; size: number }) => <Feather name="shopping-cart" color={c} size={size} />,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color: c, size }: { color: string; size: number }) => <Feather name="settings" color={c} size={size} />,
        }}
      />
    </Tabs>
  );
}

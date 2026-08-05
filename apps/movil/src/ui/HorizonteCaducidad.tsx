import { diasHasta, stockPorLote } from '@invenlux/core';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useInventario } from '../estado/InventarioProvider';
import { color, colorEstado, espacio, fuente, radio, sombra } from './tema';

/**
 * Elemento distintivo de la app: los 30 días siguientes en una sola línea,
 * un punto por lote. De un vistazo se ve si la despensa está apretada por la
 * izquierda (hay que cocinar) o repartida (todo en plazo).
 */
const DIAS_VISTA = 30;
const MARGEN_PASADO = 2; // deja sitio a lo ya caducado

export function HorizonteCaducidad() {
  const { lotes, movimientos, ajustes } = useInventario();

  const puntos = useMemo(() => {
    const saldos = stockPorLote(movimientos);
    return lotes
      .filter((l) => (saldos.get(l.id) ?? 0) > 0)
      .map((l) => ({ id: l.id, dias: diasHasta(l.fCaducidad) }))
      .filter((p): p is { id: string; dias: number } => p.dias !== null && p.dias <= DIAS_VISTA)
      .map((p) => ({ ...p, clave: claveDe(p.dias, ajustes.diasAviso) }));
  }, [lotes, movimientos, ajustes.diasAviso]);

  const porConsumir = puntos.filter((p) => p.clave !== 'en-plazo').length;

  const posicion = (dias: number): `${number}%` => {
    const bruto = ((Math.max(dias, -MARGEN_PASADO) + MARGEN_PASADO) / (DIAS_VISTA + MARGEN_PASADO)) * 100;
    return `${Math.max(0, Math.min(100, bruto))}%`;
  };

  const marcas = [
    { d: -MARGEN_PASADO, t: 'ya' },
    { d: ajustes.diasAviso, t: `${ajustes.diasAviso}d` },
    { d: 10, t: '10d' },
    { d: 20, t: '20d' },
    { d: 30, t: '30d' },
  ];

  return (
    <View style={est.caja}>
      <View style={est.cabecera}>
        <Text style={est.titulo}>HORIZONTE DE CADUCIDAD</Text>
        <Text style={est.resumen}>
          {porConsumir ? `${porConsumir} por consumir ya` : 'Todo bajo control'}
        </Text>
      </View>

      <View style={est.pista}>
        <View style={est.eje} />
        {marcas.map((m) => (
          <View key={m.t} style={[est.marca, { left: posicion(m.d) }]}>
            <View style={est.marcaLinea} />
            <Text style={est.marcaTexto}>{m.t}</Text>
          </View>
        ))}
        {puntos.map((p) => (
          <View
            key={p.id}
            style={[est.punto, { left: posicion(p.dias), backgroundColor: colorEstado(p.clave).punto }]}
          />
        ))}
      </View>

      <View style={est.leyenda}>
        <Leyenda color={color.urgente} texto="Caducado / hoy" />
        <Leyenda color={color.aviso} texto={`≤ ${ajustes.diasAviso} días`} />
        <Leyenda color={color.fresco} texto="En plazo" />
      </View>
    </View>
  );
}

function claveDe(dias: number, diasAviso: number) {
  if (dias <= 0) return 'caducado' as const;
  if (dias <= diasAviso) return 'aviso' as const;
  return 'en-plazo' as const;
}

function Leyenda({ color: c, texto }: { color: string; texto: string }) {
  return (
    <View style={est.leyendaItem}>
      <View style={[est.leyendaPunto, { backgroundColor: c }]} />
      <Text style={est.leyendaTexto}>{texto}</Text>
    </View>
  );
}

const est = StyleSheet.create({
  caja: {
    backgroundColor: color.superficie,
    borderRadius: radio.l,
    padding: 15,
    marginBottom: espacio.m,
    ...sombra,
  },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  titulo: { fontFamily: fuente.monoFuerte, fontSize: 9.5, letterSpacing: 1, color: color.tintaTenue },
  resumen: { fontFamily: fuente.texto, fontSize: 11.5, color: color.tintaSuave },
  pista: { height: 56, marginHorizontal: 2 },
  eje: { position: 'absolute', left: 0, right: 0, top: 26, height: 1, backgroundColor: color.linea },
  marca: { position: 'absolute', top: 31, alignItems: 'center', marginLeft: -14, width: 28 },
  marcaLinea: { width: 1, height: 5, backgroundColor: color.linea, marginBottom: 4 },
  marcaTexto: { fontFamily: fuente.mono, fontSize: 9, color: color.tintaTenue },
  punto: {
    position: 'absolute',
    top: 21.5,
    width: 9,
    height: 9,
    borderRadius: 5,
    marginLeft: -4.5,
    borderWidth: 2,
    borderColor: color.superficie,
  },
  leyenda: {
    flexDirection: 'row',
    gap: 13,
    marginTop: 9,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: color.linea,
  },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  leyendaPunto: { width: 7, height: 7, borderRadius: 4 },
  leyendaTexto: { fontFamily: fuente.texto, fontSize: 10.5, color: color.tintaSuave },
});

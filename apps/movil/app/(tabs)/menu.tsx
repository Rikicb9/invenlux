import {
  estadoIngrediente,
  faltantesDelPlan,
  formatearCantidad,
  generarPlan,
  mensajeAsistente,
  type DiaMenu,
  type Preferencias,
} from '@invenlux/core';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useInventario } from '../../src/estado/InventarioProvider';
import { Aviso, Boton, Tarjeta, Vacio } from '../../src/ui/componentes';
import { Pantalla } from '../../src/ui/Pantalla';
import { color, espacio, fuente, radio } from '../../src/ui/tema';

const SUGERENCIAS = [
  'Menú equilibrado para toda la semana',
  'Algo rápido, tengo poco tiempo',
  'Sin carne, ligero',
  'Aprovecha lo que caduca',
];

interface Mensaje {
  rol: 'usuario' | 'asistente';
  texto: string;
}

/**
 * Menú semanal — Sprint 3, simulado en local.
 * La generación la hará el asistente de IA con estas mismas reglas
 * (`@invenlux/core/menu`): aprovechar lo que caduca, equilibrar la semana y
 * respetar lo que pide el usuario.
 */
export default function Menu() {
  const { productos, lotes, movimientos, ajustes, añadirVariosALista } = useInventario();
  const [dias, setDias] = useState(7);
  const [plan, setPlan] = useState<DiaMenu[]>([]);
  const [chat, setChat] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const despensa = useMemo(
    () => ({ productos, lotes, movimientos, ajustes }),
    [productos, lotes, movimientos, ajustes],
  );

  const faltan = useMemo(() => faltantesDelPlan(plan, despensa), [plan, despensa]);

  const pedir = (peticion: string) => {
    const { plan: nuevo, preferencias } = generarPlan(peticion, dias, despensa);
    setPlan(nuevo);
    setAbierto(null);
    setTexto('');
    setChat([
      { rol: 'usuario', texto: peticion },
      { rol: 'asistente', texto: mensajeAsistente(nuevo, preferencias as Preferencias, despensa) },
    ]);
  };

  const mandarALaCompra = async () => {
    const n = await añadirVariosALista(
      faltan.map((f) => ({ texto: f.nombre, productoId: f.producto?.id ?? null })),
    );
    setAviso(
      n
        ? `${n} ${n === 1 ? 'ingrediente añadido' : 'ingredientes añadidos'} a la lista de la compra.`
        : 'Ya estaban todos en la lista.',
    );
  };

  return (
    <>
      <Pantalla
        titulo="Menú semanal"
        subtitulo={
          plan.length
            ? `${plan.length} días planificados · ${faltan.length} ingredientes por comprar`
            : 'Genera un menú con lo que tienes en casa'
        }
      >
        <View style={est.simulacion}>
          <Text style={est.simulacionTexto}>
            Simulación local · en el Sprint 3 la genera el asistente de IA
          </Text>
        </View>

        <Tarjeta>
          <View style={est.chatCabecera}>
            <Text style={est.chatTitulo}>ASISTENTE DE MENÚ</Text>
            <View style={est.segmento}>
              {[5, 7].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setDias(n)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: dias === n }}
                  style={[est.segBoton, dias === n && { backgroundColor: color.tinta }]}
                >
                  <Text style={[est.segTexto, dias === n && { color: '#fff' }]}>
                    {n === 5 ? 'L-V' : 'Semana'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {chat.length ? (
            <View style={{ gap: 7, marginBottom: 11 }}>
              {chat.map((m, i) => (
                <View
                  key={i}
                  style={[est.burbuja, m.rol === 'usuario' ? est.burbujaUsuario : est.burbujaIA]}
                >
                  <Text style={m.rol === 'usuario' ? est.textoUsuario : est.textoIA}>{m.texto}</Text>
                </View>
              ))}
            </View>
          ) : (
            <>
              <Text style={est.pista}>
                Dime qué quieres comer esta semana y te lo planifico con lo que tienes.
              </Text>
              <View style={est.sugerencias}>
                {SUGERENCIAS.map((sg) => (
                  <Pressable key={sg} onPress={() => pedir(sg)} style={est.chip}>
                    <Text style={est.chipTexto}>{sg}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              value={texto}
              onChangeText={setTexto}
              onSubmitEditing={() => pedir(texto.trim() || SUGERENCIAS[0])}
              returnKeyType="send"
              placeholder="Ej. sin carne y rápido…"
              placeholderTextColor={color.tintaTenue}
              style={est.input}
            />
            <Boton
              onPress={() => pedir(texto.trim() || SUGERENCIAS[0])}
              style={{ paddingHorizontal: 16 }}
            >
              Generar
            </Boton>
          </View>
        </Tarjeta>

        {plan.length === 0 ? (
          <Vacio
            titulo="Todavía no hay menú"
            texto="Escribe lo que te apetece o toca una de las sugerencias."
          />
        ) : (
          plan.map((d, i) => {
            const pendientes = d.receta.ingredientes.filter(
              (ing) => estadoIngrediente(ing, despensa).clave !== 'ok',
            ).length;

            return (
              <Tarjeta key={d.dia} style={{ padding: 0, overflow: 'hidden' }}>
                <Pressable
                  onPress={() => setAbierto(abierto === i ? null : i)}
                  style={est.dia}
                  accessibilityRole="button"
                >
                  <View style={{ flex: 1 }}>
                    <Text style={est.diaNombre}>{d.dia.toUpperCase()}</Text>
                    <Text style={est.receta}>{d.receta.nombre}</Text>
                    <Text style={est.recetaMeta}>
                      {d.receta.minutos} min ·{' '}
                      {pendientes ? `${pendientes} por comprar` : 'todo en casa'}
                    </Text>
                  </View>
                  <Text style={est.chevron}>{abierto === i ? '−' : '+'}</Text>
                </Pressable>

                {abierto === i && (
                  <View style={est.ingredientes}>
                    {d.receta.ingredientes.map((ing) => {
                      const e = estadoIngrediente(ing, despensa);
                      const tono =
                        e.clave === 'ok' ? color.fresco : e.clave === 'poco' ? color.aviso : color.urgente;
                      const fondo =
                        e.clave === 'ok'
                          ? color.frescoSuave
                          : e.clave === 'poco'
                            ? color.avisoSuave
                            : color.urgenteSuave;
                      return (
                        <View key={ing.nombre} style={est.ingrediente}>
                          <View style={[est.marca, { backgroundColor: fondo }]}>
                            <Text style={[est.marcaTexto, { color: tono }]}>
                              {e.clave === 'ok' ? '✓' : e.clave === 'poco' ? '!' : '✕'}
                            </Text>
                          </View>
                          <Text style={est.ingNombre}>{ing.nombre}</Text>
                          <Text style={est.ingCantidad}>
                            {formatearCantidad(ing.cantidad, ing.unidad)}
                          </Text>
                          <Text style={[est.ingEstado, { color: tono }]}>{e.texto}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </Tarjeta>
            );
          })
        )}

        {faltan.length > 0 && (
          <>
            <Boton onPress={mandarALaCompra}>
              Añadir {faltan.length} ingredientes a la compra
            </Boton>
            <Text style={est.pista}>{faltan.map((f) => f.nombre).join(', ')}.</Text>
          </>
        )}
      </Pantalla>

      <Aviso texto={aviso} onFin={() => setAviso(null)} />
    </>
  );
}

const est = StyleSheet.create({
  simulacion: {
    backgroundColor: color.avisoSuave,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 8,
    marginBottom: 10,
  },
  simulacionTexto: { fontFamily: fuente.textoFuerte, fontSize: 11, color: color.aviso, lineHeight: 15 },
  chatCabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  chatTitulo: { fontFamily: fuente.monoFuerte, fontSize: 9.5, letterSpacing: 1, color: color.tintaTenue },
  segmento: { flexDirection: 'row', gap: 3, backgroundColor: color.superficie2, borderRadius: 9, padding: 2 },
  segBoton: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7 },
  segTexto: { fontFamily: fuente.textoFuerte, fontSize: 11.5, color: color.tintaSuave },
  burbuja: { paddingHorizontal: 11, paddingVertical: 9, borderRadius: radio.m, maxWidth: '92%' },
  burbujaUsuario: { backgroundColor: color.tinta, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  burbujaIA: { backgroundColor: color.superficie2, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  textoUsuario: { fontFamily: fuente.texto, fontSize: 13, color: '#fff', lineHeight: 19 },
  textoIA: { fontFamily: fuente.texto, fontSize: 13, color: color.tinta, lineHeight: 19 },
  pista: { fontFamily: fuente.texto, fontSize: 11.5, color: color.tintaSuave, marginTop: 8, lineHeight: 16 },
  sugerencias: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 11 },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: color.superficie2,
    borderWidth: 1,
    borderColor: color.linea,
  },
  chipTexto: { fontFamily: fuente.textoMedio, fontSize: 12, color: color.tintaSuave },
  input: {
    flex: 1,
    backgroundColor: color.superficie2,
    borderWidth: 1,
    borderColor: color.linea,
    borderRadius: radio.m,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: fuente.texto,
    fontSize: 14,
    color: color.tinta,
  },
  dia: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  diaNombre: { fontFamily: fuente.monoFuerte, fontSize: 9.5, letterSpacing: 1, color: color.tintaTenue },
  receta: { fontFamily: fuente.textoFuerte, fontSize: 14.5, color: color.tinta, marginTop: 3 },
  recetaMeta: { fontFamily: fuente.texto, fontSize: 11.5, color: color.tintaSuave, marginTop: 2 },
  chevron: { fontSize: 19, color: color.tintaTenue, width: 20, textAlign: 'center' },
  ingredientes: { paddingHorizontal: 14, paddingBottom: 12, borderTopWidth: 1, borderTopColor: color.linea },
  ingrediente: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7 },
  marca: { width: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  marcaTexto: { fontSize: 10, fontFamily: fuente.textoFuerte },
  ingNombre: { flex: 1, fontFamily: fuente.textoMedio, fontSize: 13, color: color.tinta },
  ingCantidad: { fontFamily: fuente.mono, fontSize: 11.5, color: color.tintaSuave },
  ingEstado: { fontFamily: fuente.texto, fontSize: 10.5 },
});

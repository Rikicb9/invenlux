import {
  UBICACIONES,
  abreviarUnidad,
  diasHasta,
  estadoCaducidad,
  etiquetaEstado,
  formatearNumero,
  loteSiguiente,
  lotesConStock,
  type Producto,
} from '@invenlux/core';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useInventario } from '../../src/estado/InventarioProvider';
import { Aviso, Badge, Tarjeta, Ubicacion, Vacio } from '../../src/ui/componentes';
import { HorizonteCaducidad } from '../../src/ui/HorizonteCaducidad';
import { Pantalla } from '../../src/ui/Pantalla';
import { HojaEntrada, HojaNuevoProducto } from '../../src/ui/hojasAlta';
import { HojaConsumo, HojaDetalle } from '../../src/ui/hojasProducto';
import { color, espacio, fuente } from '../../src/ui/tema';

type Filtro = 'Todo' | (typeof UBICACIONES)[number];

export default function Inventario() {
  const { productos, lotes, movimientos, ajustes, stockDe, cargando } = useInventario();
  const [filtro, setFiltro] = useState<Filtro>('Todo');
  const [nuevo, setNuevo] = useState(false);
  const [entradaDe, setEntradaDe] = useState<string | null>(null);
  const [detalleDe, setDetalleDe] = useState<string | null>(null);
  const [consumoDe, setConsumoDe] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const visibles = useMemo(() => {
    return productos
      .map((p) => ({ producto: p, lotes: lotesConStock(p.id, lotes, movimientos) }))
      .filter((x) => x.lotes.length > 0)
      .filter((x) => filtro === 'Todo' || x.lotes.some((l) => l.ubicacion === filtro))
      .sort((a, b) => {
        const da = diasHasta(loteSiguiente(a.producto.id, lotes, movimientos)?.fCaducidad ?? null);
        const db = diasHasta(loteSiguiente(b.producto.id, lotes, movimientos)?.fCaducidad ?? null);
        if (da === null) return 1;
        if (db === null) return -1;
        return da - db;
      });
  }, [productos, lotes, movimientos, filtro]);

  return (
    <>
      <Pantalla
        titulo="Inventario"
        subtitulo={
          cargando
            ? 'Abriendo la despensa…'
            : `${visibles.length} productos con stock · orden FEFO`
        }
      >
        <HorizonteCaducidad />

        <View style={est.filtros}>
          {(['Todo', ...UBICACIONES] as Filtro[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFiltro(f)}
              accessibilityRole="tab"
              accessibilityState={{ selected: filtro === f }}
              style={[est.chip, filtro === f && { backgroundColor: color.tinta, borderColor: color.tinta }]}
            >
              <Text style={[est.chipTexto, filtro === f && { color: '#fff' }]}>{f}</Text>
            </Pressable>
          ))}
        </View>

        {visibles.length === 0 ? (
          <Vacio
            titulo="Nada por aquí todavía"
            texto={
              filtro === 'Todo'
                ? 'Añade tu primer producto con el botón +.'
                : `No hay productos en ${filtro}.`
            }
          />
        ) : (
          visibles.map(({ producto, lotes: suyos }) => (
            <TarjetaProducto
              key={producto.id}
              producto={producto}
              stock={stockDe(producto.id)}
              caducidad={suyos.length ? loteSiguiente(producto.id, lotes, movimientos)!.fCaducidad : null}
              ubicaciones={[...new Set(suyos.map((l) => l.ubicacion))]}
              numLotes={suyos.length}
              diasAviso={ajustes.diasAviso}
              onPress={() => setDetalleDe(producto.id)}
            />
          ))
        )}
      </Pantalla>

      <Pressable style={est.fab} onPress={() => setNuevo(true)} accessibilityLabel="Añadir producto">
        <Text style={est.fabTexto}>+</Text>
      </Pressable>

      <HojaNuevoProducto
        visible={nuevo}
        onCerrar={() => setNuevo(false)}
        onCreado={(id) => {
          setNuevo(false);
          setEntradaDe(id);
        }}
      />
      <HojaEntrada productoId={entradaDe} onCerrar={() => setEntradaDe(null)} />
      <HojaDetalle
        productoId={detalleDe}
        onCerrar={() => setDetalleDe(null)}
        onConsumir={(id) => {
          setDetalleDe(null);
          setConsumoDe(id);
        }}
        onEntrada={(id) => {
          setDetalleDe(null);
          setEntradaDe(id);
        }}
      />
      <HojaConsumo productoId={consumoDe} onCerrar={() => setConsumoDe(null)} onAviso={setAviso} />
      <Aviso texto={aviso} onFin={() => setAviso(null)} />
    </>
  );
}

function TarjetaProducto({
  producto,
  stock,
  caducidad,
  ubicaciones,
  numLotes,
  diasAviso,
  onPress,
}: {
  producto: Producto;
  stock: number;
  caducidad: string | null;
  ubicaciones: string[];
  numLotes: number;
  diasAviso: number;
  onPress: () => void;
}) {
  const e = estadoCaducidad(caducidad, diasAviso);
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Tarjeta>
        <View style={est.filaSuperior}>
          <View style={{ flex: 1 }}>
            <Text style={est.nombre}>{producto.nombre}</Text>
            <Text style={est.meta}>
              {producto.categoria}
              {numLotes > 1 ? ` · ${numLotes} lotes` : ''}
            </Text>
          </View>
          <Text style={est.cantidad}>
            {formatearNumero(stock)}
            <Text style={est.unidad}> {abreviarUnidad(producto.unidad)}</Text>
          </Text>
        </View>
        <View style={est.pie}>
          <Badge clave={e.clave} texto={etiquetaEstado(e)} />
          {ubicaciones.map((u) => (
            <Ubicacion key={u} nombre={u} />
          ))}
        </View>
      </Tarjeta>
    </Pressable>
  );
}

const est = StyleSheet.create({
  filtros: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: color.superficie,
    borderWidth: 1,
    borderColor: color.linea,
  },
  chipTexto: { fontFamily: fuente.textoMedio, fontSize: 12.5, color: color.tintaSuave },
  filaSuperior: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  nombre: { fontFamily: fuente.textoFuerte, fontSize: 15, color: color.tinta },
  meta: { fontFamily: fuente.texto, fontSize: 11.5, color: color.tintaSuave, marginTop: 3 },
  cantidad: { fontFamily: fuente.monoFuerte, fontSize: 16, color: color.tinta },
  unidad: { fontFamily: fuente.textoMedio, fontSize: 10.5, color: color.tintaSuave },
  pie: { flexDirection: 'row', gap: 5, marginTop: 9, flexWrap: 'wrap' },
  fab: {
    position: 'absolute',
    right: espacio.l,
    bottom: 28,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: color.tinta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabTexto: { color: '#fff', fontSize: 28, lineHeight: 32, fontFamily: fuente.texto },
});

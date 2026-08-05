import { etiquetaEstado, formatearCantidad } from '@invenlux/core';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useInventario } from '../../src/estado/InventarioProvider';
import { Aviso, Badge, Boton, Tarjeta, Ubicacion, Vacio } from '../../src/ui/componentes';
import { HorizonteCaducidad } from '../../src/ui/HorizonteCaducidad';
import { Pantalla } from '../../src/ui/Pantalla';
import { HojaConsumo, HojaDetalle } from '../../src/ui/hojasProducto';
import { HojaEntrada } from '../../src/ui/hojasAlta';
import { color, fuente } from '../../src/ui/tema';

export default function Caduca() {
  const { urgentes, ajustes } = useInventario();
  const [consumoDe, setConsumoDe] = useState<string | null>(null);
  const [detalleDe, setDetalleDe] = useState<string | null>(null);
  const [entradaDe, setEntradaDe] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  return (
    <>
      <Pantalla
        titulo="Caduca pronto"
        subtitulo={`Aviso con ${ajustes.diasAviso} ${ajustes.diasAviso === 1 ? 'día' : 'días'} de antelación`}
      >
        <HorizonteCaducidad />

        {urgentes.length === 0 ? (
          <Vacio
            titulo={`Nada caduca en los próximos ${ajustes.diasAviso} días`}
            texto="Te avisaremos aquí en cuanto algo se acerque a su fecha."
          />
        ) : (
          urgentes.map(({ producto, lote, cantidad, estado }) => (
            <Tarjeta key={lote.id}>
              <View style={est.fila}>
                <View style={{ flex: 1 }}>
                  <Text style={est.nombre}>{producto.nombre}</Text>
                  <View style={est.meta}>
                    <Ubicacion nombre={lote.ubicacion} />
                    <Text style={est.metaTexto}>{formatearCantidad(cantidad, producto.unidad)}</Text>
                  </View>
                </View>
                <Badge clave={estado.clave} texto={etiquetaEstado(estado)} />
              </View>
              <View style={est.acciones}>
                <Boton variante="suave" style={{ flex: 1 }} onPress={() => setDetalleDe(producto.id)}>
                  Ver lotes
                </Boton>
                <Boton style={{ flex: 1 }} onPress={() => setConsumoDe(producto.id)}>
                  Registrar consumo
                </Boton>
              </View>
            </Tarjeta>
          ))
        )}
      </Pantalla>

      <HojaConsumo productoId={consumoDe} onCerrar={() => setConsumoDe(null)} onAviso={setAviso} />
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
      <HojaEntrada productoId={entradaDe} onCerrar={() => setEntradaDe(null)} />
      <Aviso texto={aviso} onFin={() => setAviso(null)} />
    </>
  );
}

const est = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  nombre: { fontFamily: fuente.textoFuerte, fontSize: 15, color: color.tinta },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  metaTexto: { fontFamily: fuente.texto, fontSize: 11.5, color: color.tintaSuave },
  acciones: { flexDirection: 'row', gap: 8, marginTop: 11 },
});

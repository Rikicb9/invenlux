import { hoyISO, sumarDias, type Categoria, type Ubicacion, type Unidad } from '@invenlux/core';
import { HOGAR_LOCAL, guardarLote, guardarMovimientos, guardarProducto, nuevoId } from './repositorio';

/**
 * Despensa de ejemplo — la misma del prototipo validado, para poder abrir la
 * app y ver FEFO funcionando sin teclear veinte productos primero.
 * Sólo se siembra si la base está vacía.
 */
type Fila = [string, Categoria, Unidad, number, Array<[number, number, number, Ubicacion]>];
//                                          stockMin  [cantidad, díasCaducidad, díasCompra, ubicación]

const DESPENSA: Fila[] = [
  ['Yogur natural', 'Lácteos', 'unidades', 4, [[6, 1, -6, 'Nevera'], [8, 11, -1, 'Nevera']]],
  ['Pechuga de pollo', 'Carne y pescado', 'g', 300, [[450, 0, -2, 'Nevera']]],
  ['Espinacas frescas', 'Fruta y verdura', 'g', 150, [[200, 2, -2, 'Nevera']]],
  ['Leche entera', 'Lácteos', 'l', 2, [[1, 4, -4, 'Nevera'], [3, 26, -4, 'Despensa']]],
  ['Merluza en filetes', 'Carne y pescado', 'g', 200, [[600, 58, -10, 'Congelador']]],
  ['Arroz redondo', 'Despensa', 'kg', 1, [[2, 310, -30, 'Despensa']]],
  ['Tomates pera', 'Fruta y verdura', 'g', 300, [[500, 5, -1, 'Nevera']]],
  ['Huevos', 'Lácteos', 'unidades', 6, [[10, 14, -5, 'Nevera']]],
  ['Guisantes congelados', 'Congelados', 'g', 200, [[750, 120, -20, 'Congelador']]],
  ['Aceite de oliva', 'Despensa', 'l', 0.5, [[0.3, 400, -60, 'Despensa']]],
];

export async function sembrarDespensa(): Promise<void> {
  const hoy = hoyISO();

  for (const [nombre, categoria, unidad, stockMin, lotes] of DESPENSA) {
    const productoId = nuevoId();
    await guardarProducto({
      id: productoId,
      hogarId: HOGAR_LOCAL,
      nombre,
      categoria,
      unidad,
      stockMin,
      autoCompra: true,
    });

    for (const [cantidad, caduca, compra, ubicacion] of lotes) {
      const loteId = nuevoId();
      const fCompra = sumarDias(hoy, compra);
      await guardarLote({
        id: loteId,
        productoId,
        cantidadInicial: cantidad,
        fCompra,
        fCaducidad: sumarDias(hoy, caduca),
        ubicacion,
        origen: 'manual',
      });
      await guardarMovimientos([
        {
          id: nuevoId(),
          loteId,
          productoId,
          tipo: 'entrada',
          cantidad,
          fecha: `${fCompra}T10:00:00.000Z`,
        },
      ]);
    }
  }
}

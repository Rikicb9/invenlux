import { beforeEach, describe, expect, it } from 'vitest';
import { estadoCaducidad, productosUrgentes } from '../src/caducidad';
import { AJUSTES_POR_DEFECTO, type AjustesHogar } from '../src/tipos';
import { HOY, dia, escenario, producto, reiniciarIds } from './ayudas';

const ajustes: AjustesHogar = { ...AJUSTES_POR_DEFECTO, diasAviso: 3 };

beforeEach(reiniciarIds);

describe('estado de caducidad', () => {
  it('clasifica según el umbral del hogar', () => {
    expect(estadoCaducidad(dia(-1), 3, HOY).clave).toBe('caducado');
    expect(estadoCaducidad(dia(0), 3, HOY).clave).toBe('hoy');
    expect(estadoCaducidad(dia(3), 3, HOY).clave).toBe('aviso');
    expect(estadoCaducidad(dia(4), 3, HOY).clave).toBe('en-plazo');
    expect(estadoCaducidad(null, 3, HOY).clave).toBe('sin-fecha');
  });

  it('deja de considerar urgente lo que entra en plazo al bajar el umbral', () => {
    expect(estadoCaducidad(dia(3), 3, HOY).urgente).toBe(true);
    expect(estadoCaducidad(dia(3), 1, HOY).urgente).toBe(false);
  });

  it('no marca urgente un lote sin fecha', () => {
    expect(estadoCaducidad(null, 7, HOY).urgente).toBe(false);
  });
});

describe('productos urgentes', () => {
  it('ordena por urgencia y deja fuera lo que está en plazo', () => {
    const pollo = producto({ nombre: 'Pechuga de pollo', unidad: 'g' });
    const arroz = producto({ nombre: 'Arroz redondo', unidad: 'kg' });
    const espinacas = producto({ nombre: 'Espinacas frescas', unidad: 'g' });

    const a = escenario(pollo, [{ cantidad: 450, caducidad: dia(0) }]);
    const b = escenario(arroz, [{ cantidad: 2, caducidad: dia(310) }]);
    const c = escenario(espinacas, [{ cantidad: 200, caducidad: dia(2) }]);

    const lotes = [...a.lotes, ...b.lotes, ...c.lotes];
    const movimientos = [...a.movimientos, ...b.movimientos, ...c.movimientos];

    const urgentes = productosUrgentes([pollo, arroz, espinacas], lotes, movimientos, ajustes, HOY);

    expect(urgentes.map((u) => u.producto.nombre)).toEqual([
      'Pechuga de pollo',
      'Espinacas frescas',
    ]);
  });

  it('no cuenta productos cuyo stock ya se ha consumido', () => {
    const p = producto({ nombre: 'Tomates pera', unidad: 'g' });
    const { lotes, movimientos } = escenario(p, [{ cantidad: 500, caducidad: dia(1) }]);

    const movs = [
      ...movimientos,
      { id: 'm-x', loteId: lotes[0].id, productoId: p.id, tipo: 'consumo' as const, cantidad: 500, fecha: '' },
    ];

    expect(productosUrgentes([p], lotes, movs, ajustes, HOY)).toHaveLength(0);
  });
});

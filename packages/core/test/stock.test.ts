import { beforeEach, describe, expect, it } from 'vitest';
import { lotesConStock, stockDeLote, stockDeProducto } from '../src/stock';
import type { Movimiento } from '../src/tipos';
import { dia, escenario, nuevoId, producto, reiniciarIds } from './ayudas';

beforeEach(reiniciarIds);

describe('stock derivado de movimientos', () => {
  it('suma entradas y resta consumos y mermas', () => {
    const p = producto({ unidad: 'g' });
    const { lotes, movimientos } = escenario(p, [{ cantidad: 500, caducidad: dia(3) }]);
    const lote = lotes[0];

    const movs: Movimiento[] = [
      ...movimientos,
      { id: nuevoId(), loteId: lote.id, productoId: p.id, tipo: 'consumo', cantidad: 120, fecha: '' },
      { id: nuevoId(), loteId: lote.id, productoId: p.id, tipo: 'merma', cantidad: 80, fecha: '' },
    ];

    expect(stockDeLote(lote.id, movs)).toBe(300);
  });

  it('aplica el ajuste con su signo, sin tocar el histórico', () => {
    const p = producto({ unidad: 'g' });
    const { lotes, movimientos } = escenario(p, [{ cantidad: 500, caducidad: dia(3) }]);

    const corregido: Movimiento[] = [
      ...movimientos,
      { id: nuevoId(), loteId: lotes[0].id, productoId: p.id, tipo: 'ajuste', cantidad: -50, fecha: '' },
    ];

    expect(stockDeProducto(p.id, corregido)).toBe(450);
    // el movimiento de entrada original sigue ahí, sin tocar
    expect(corregido[0]).toMatchObject({ tipo: 'entrada', cantidad: 500 });
  });

  it('agrega el stock de todos los lotes del producto', () => {
    const p = producto({ unidad: 'l' });
    const { movimientos } = escenario(p, [
      { cantidad: 1, caducidad: dia(4) },
      { cantidad: 3, caducidad: dia(26) },
    ]);

    expect(stockDeProducto(p.id, movimientos)).toBe(4);
  });

  it('descarta de la despensa los lotes a cero', () => {
    const p = producto();
    const { lotes, movimientos } = escenario(p, [
      { cantidad: 2, caducidad: dia(1) },
      { cantidad: 4, caducidad: dia(10) },
    ]);

    const movs: Movimiento[] = [
      ...movimientos,
      { id: nuevoId(), loteId: lotes[0].id, productoId: p.id, tipo: 'consumo', cantidad: 2, fecha: '' },
    ];

    const vivos = lotesConStock(p.id, lotes, movs);
    expect(vivos).toHaveLength(1);
    expect(vivos[0].stock).toBe(4);
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { loteSiguiente, movimientosDeConsumo, ordenarLotes, planificarConsumo } from '../src/fefo';
import { stockDeProducto } from '../src/stock';
import { dia, escenario, nuevoId, producto, reiniciarIds } from './ayudas';

beforeEach(reiniciarIds);

describe('orden FEFO', () => {
  it('pone primero el lote que antes caduca, no el que antes entró', () => {
    const p = producto();
    const { lotes, movimientos } = escenario(p, [
      { cantidad: 8, caducidad: dia(11), compra: dia(-1) }, // entró después, caduca más tarde
      { cantidad: 6, caducidad: dia(1), compra: dia(-6) },
    ]);

    const orden = ordenarLotes(p.id, lotes, movimientos);
    expect(orden.map((l) => l.fCaducidad)).toEqual([dia(1), dia(11)]);
  });

  it('manda los lotes sin fecha al final', () => {
    const p = producto();
    const { lotes, movimientos } = escenario(p, [
      { cantidad: 2, caducidad: null },
      { cantidad: 2, caducidad: dia(30) },
    ]);

    expect(ordenarLotes(p.id, lotes, movimientos)[0].fCaducidad).toBe(dia(30));
  });

  it('a igual caducidad, desempata por fecha de entrada más antigua', () => {
    const p = producto();
    const { lotes, movimientos } = escenario(p, [
      { cantidad: 2, caducidad: dia(5), compra: dia(-1) },
      { cantidad: 2, caducidad: dia(5), compra: dia(-9) },
    ]);

    expect(ordenarLotes(p.id, lotes, movimientos)[0].fCompra).toBe(dia(-9));
  });

  it('ignora los lotes ya vacíos', () => {
    const p = producto();
    const { lotes, movimientos } = escenario(p, [
      { cantidad: 3, caducidad: dia(2) },
      { cantidad: 5, caducidad: dia(9) },
    ]);
    const plan = planificarConsumo(p.id, 3, lotes, movimientos);
    const movs = [...movimientos, ...movimientosDeConsumo(p.id, plan, { nuevoId })];

    const orden = ordenarLotes(p.id, lotes, movs);
    expect(orden).toHaveLength(1);
    expect(orden[0].fCaducidad).toBe(dia(9));
  });

  it('no devuelve lote siguiente cuando no queda stock', () => {
    const p = producto();
    const { lotes, movimientos } = escenario(p, [{ cantidad: 1, caducidad: dia(2) }]);
    const plan = planificarConsumo(p.id, 1, lotes, movimientos);
    const movs = [...movimientos, ...movimientosDeConsumo(p.id, plan, { nuevoId })];

    expect(loteSiguiente(p.id, lotes, movs)).toBeNull();
  });
});

describe('reparto del consumo', () => {
  it('encadena lotes cuando el primero no llega', () => {
    const p = producto({ unidad: 'g' });
    const { lotes, movimientos } = escenario(p, [
      { cantidad: 200, caducidad: dia(2) },
      { cantidad: 500, caducidad: dia(8) },
    ]);

    const plan = planificarConsumo(p.id, 350, lotes, movimientos);
    expect(plan.asignaciones.map((a) => a.cantidad)).toEqual([200, 150]);
    expect(plan.servido).toBe(350);
    expect(plan.pendiente).toBe(0);
  });

  it('nunca deja un lote en negativo y avisa de lo que falta', () => {
    const p = producto({ unidad: 'g' });
    const { lotes, movimientos } = escenario(p, [{ cantidad: 200, caducidad: dia(2) }]);

    const plan = planificarConsumo(p.id, 500, lotes, movimientos);
    expect(plan.servido).toBe(200);
    expect(plan.pendiente).toBe(300);
  });

  it('no hace nada con cantidades cero o negativas', () => {
    const p = producto();
    const { lotes, movimientos } = escenario(p, [{ cantidad: 5, caducidad: dia(3) }]);

    expect(planificarConsumo(p.id, 0, lotes, movimientos).asignaciones).toHaveLength(0);
    expect(planificarConsumo(p.id, -2, lotes, movimientos).asignaciones).toHaveLength(0);
  });

  it('genera un movimiento de consumo por lote tocado', () => {
    const p = producto({ unidad: 'g' });
    const { lotes, movimientos } = escenario(p, [
      { cantidad: 200, caducidad: dia(2) },
      { cantidad: 500, caducidad: dia(8) },
    ]);

    const plan = planificarConsumo(p.id, 350, lotes, movimientos);
    const movs = movimientosDeConsumo(p.id, plan, { nuevoId });

    expect(movs).toHaveLength(2);
    expect(movs.every((m) => m.tipo === 'consumo')).toBe(true);
    expect(stockDeProducto(p.id, [...movimientos, ...movs])).toBe(350);
  });

  it('mantiene las cantidades limpias con decimales', () => {
    const p = producto({ unidad: 'l' });
    const { lotes, movimientos } = escenario(p, [{ cantidad: 1, caducidad: dia(4) }]);

    let movs = [...movimientos];
    for (let i = 0; i < 3; i++) {
      const plan = planificarConsumo(p.id, 0.1, lotes, movs);
      movs = [...movs, ...movimientosDeConsumo(p.id, plan, { nuevoId })];
    }

    expect(stockDeProducto(p.id, movs)).toBe(0.7);
  });
});

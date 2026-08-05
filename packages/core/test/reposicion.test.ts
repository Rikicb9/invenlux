import { describe, expect, it } from 'vitest';
import { decidirAlta, decidirBaja } from '../src/reposicion';
import type { ItemCompra } from '../src/tipos';
import { HOGAR, producto } from './ayudas';

const item = (over: Partial<ItemCompra>): ItemCompra => ({
  id: 'c1',
  hogarId: HOGAR,
  texto: 'Yogur natural',
  productoId: 'p1',
  origen: 'agotado',
  comprado: false,
  ...over,
});

describe('alta automática en la lista', () => {
  it('entra al llegar al mínimo', () => {
    const p = producto({ id: 'p1', stockMin: 4 });
    expect(decidirAlta(p, 4, []).añadir).toBe(true);
    expect(decidirAlta(p, 5, []).añadir).toBe(false);
  });

  it('distingue "se acabó" de "por debajo del mínimo"', () => {
    const p = producto({ id: 'p1', stockMin: 4 });
    expect(decidirAlta(p, 0, []).origen).toBe('agotado');
    expect(decidirAlta(p, 2, []).origen).toBe('stock-minimo');
  });

  it('no duplica un producto ya pendiente', () => {
    const p = producto({ id: 'p1', stockMin: 4 });
    expect(decidirAlta(p, 0, [item({})]).añadir).toBe(false);
  });

  it('vuelve a entrar si el pendiente anterior ya se compró', () => {
    const p = producto({ id: 'p1', stockMin: 4 });
    expect(decidirAlta(p, 0, [item({ comprado: true })]).añadir).toBe(true);
  });

  it('respeta la reposición automática desactivada', () => {
    const p = producto({ id: 'p1', stockMin: 4, autoCompra: false });
    expect(decidirAlta(p, 0, []).añadir).toBe(false);
  });
});

describe('baja automática al reponer', () => {
  it('retira el ítem cuando la compra deja el stock por encima del mínimo', () => {
    const p = producto({ id: 'p1', stockMin: 4 });
    expect(decidirBaja(p, 12, [item({})])?.id).toBe('c1');
  });

  it('lo mantiene si la compra no llega al mínimo', () => {
    const p = producto({ id: 'p1', stockMin: 4 });
    expect(decidirBaja(p, 3, [item({})])).toBeNull();
  });

  it('nunca borra lo que apuntó el usuario a mano', () => {
    const p = producto({ id: 'p1', stockMin: 4 });
    expect(decidirBaja(p, 12, [item({ origen: 'manual' })])).toBeNull();
  });
});

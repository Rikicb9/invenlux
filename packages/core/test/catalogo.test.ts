import { beforeEach, describe, expect, it } from 'vitest';
import {
  CATALOGO,
  UBICACION_SUGERIDA,
  agruparPorCategoria,
  filtrarOpciones,
  opcionesDeProducto,
} from '../src/catalogo';
import { normalizar, parecido } from '../src/texto';
import { dia, escenario, producto, reiniciarIds } from './ayudas';

beforeEach(reiniciarIds);

describe('catálogo', () => {
  it('no tiene nombres repetidos', () => {
    const nombres = CATALOGO.map((c) => normalizar(c.nombre));
    expect(new Set(nombres).size).toBe(nombres.length);
  });

  it('guarda cada categoría donde toca', () => {
    expect(UBICACION_SUGERIDA['Carne y pescado']).toBe('Nevera');
    expect(UBICACION_SUGERIDA['Congelados']).toBe('Congelador');
    expect(UBICACION_SUGERIDA['Despensa']).toBe('Despensa');
  });

  it('ofrece el producto básico, no sólo variantes', () => {
    for (const basico of ['Tomate', 'Merluza', 'Leche', 'Yogur', 'Pollo', 'Pan']) {
      expect(CATALOGO.some((c) => c.nombre === basico)).toBe(true);
    }
  });
});

describe('opciones del buscador', () => {
  it('marca con su stock lo que ya está en casa y no lo duplica', () => {
    const p = producto({ nombre: 'Tomate', categoria: 'Fruta y verdura', unidad: 'g' });
    const { movimientos } = escenario(p, [{ cantidad: 500, caducidad: dia(5) }]);

    const opciones = opcionesDeProducto([p], movimientos);
    const tomates = opciones.filter((o) => o.nombre === 'Tomate');

    expect(tomates).toHaveLength(1);
    expect(tomates[0].clave).toBe(`p:${p.id}`);
    expect(tomates[0].detalle).toBe('500 g');
  });

  it('añade a la lista los productos creados por el usuario', () => {
    const p = producto({ nombre: 'Salsa brava', categoria: 'Despensa', unidad: 'ml' });
    const opciones = opcionesDeProducto([p], []);
    expect(opciones.some((o) => o.nombre === 'Salsa brava')).toBe(true);
    expect(opciones).toHaveLength(CATALOGO.length + 1);
  });
});

describe('filtrado en vivo', () => {
  const opciones = opcionesDeProducto([], []);
  const nombres = (q: string) => filtrarOpciones(opciones, q).map((o) => o.nombre);

  it('prioriza lo que empieza por lo escrito', () => {
    expect(nombres('leche')[0]).toBe('Leche');
    expect(nombres('tomate')[0]).toBe('Tomate');
  });

  it('encuentra por palabra interior', () => {
    expect(nombres('oliva')).toContain('Aceite de oliva');
  });

  it('tolera erratas', () => {
    expect(nombres('mantequila')).toContain('Mantequilla');
    expect(nombres('platano')).toContain('Plátano');
  });

  it('no inventa resultados', () => {
    expect(nombres('zzzqqq')).toHaveLength(0);
  });

  it('sin consulta devuelve todo, agrupado y alfabético', () => {
    expect(filtrarOpciones(opciones, '')).toHaveLength(CATALOGO.length);
    const grupos = agruparPorCategoria(opciones);
    expect(grupos[0].categoria).toBe('Bebidas');
    const lacteos = grupos.find((g) => g.categoria === 'Lácteos')!;
    expect(lacteos.opciones.map((o) => o.nombre)).toEqual([
      'Huevos', 'Leche', 'Mantequilla', 'Nata', 'Queso', 'Yogur',
    ]);
  });
});

describe('parecido entre nombres', () => {
  it('reconoce el mismo producto escrito distinto', () => {
    expect(parecido('Yogurt natural', 'Yogur natural')).toBeGreaterThan(0.8);
    expect(parecido('leche enteraa', 'Leche entera')).toBeGreaterThan(0.8);
  });

  it('no confunde productos distintos', () => {
    expect(parecido('Arroz', 'Aceite de oliva')).toBeLessThan(0.4);
    expect(parecido('té', 'Mantequilla')).toBeLessThan(0.4);
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import {
  RECETAS,
  estadoIngrediente,
  faltantesDelPlan,
  generarPlan,
  leerPeticion,
  mensajeAsistente,
  urgentesAprovechados,
  type Despensa,
} from '../src/menu';
import { CATALOGO } from '../src/catalogo';
import { normalizar } from '../src/texto';
import { AJUSTES_POR_DEFECTO } from '../src/tipos';
import { HOY, dia, entrada, producto, reiniciarIds } from './ayudas';

beforeEach(reiniciarIds);

/** Despensa de prueba: pollo que caduca hoy, espinacas en 2 días, arroz de sobra. */
function despensa(): Despensa {
  const pollo = producto({ nombre: 'Pollo', categoria: 'Carne y pescado', unidad: 'g' });
  const espinacas = producto({ nombre: 'Espinacas', categoria: 'Fruta y verdura', unidad: 'g' });
  const arroz = producto({ nombre: 'Arroz', categoria: 'Despensa', unidad: 'kg' });
  const lechuga = producto({ nombre: 'Lechuga', categoria: 'Fruta y verdura', unidad: 'unidades' });

  const e1 = entrada(pollo.id, 450, dia(0));
  const e2 = entrada(espinacas.id, 200, dia(2));
  const e3 = entrada(arroz.id, 2, dia(300));
  const e4 = entrada(lechuga.id, 1, dia(6));

  return {
    productos: [pollo, espinacas, arroz, lechuga],
    lotes: [e1.lote, e2.lote, e3.lote, e4.lote],
    movimientos: [e1.movimiento, e2.movimiento, e3.movimiento, e4.movimiento],
    ajustes: AJUSTES_POR_DEFECTO,
  };
}

describe('recetas', () => {
  it('usa sólo ingredientes que existen en el catálogo', () => {
    const enCatalogo = new Set(CATALOGO.map((c) => normalizar(c.nombre)));
    const fuera = RECETAS.flatMap((r) => r.ingredientes)
      .map((i) => i.nombre)
      .filter((n) => !enCatalogo.has(normalizar(n)));
    expect(fuera).toEqual([]);
  });
});

describe('cruce con la despensa', () => {
  const d = despensa();

  it('reconoce lo que hay', () => {
    const e = estadoIngrediente({ nombre: 'Pollo', cantidad: 300, unidad: 'g' }, d);
    expect(e.clave).toBe('ok');
  });

  it('avisa cuando no llega la cantidad', () => {
    const e = estadoIngrediente({ nombre: 'Espinacas', cantidad: 500, unidad: 'g' }, d);
    expect(e.clave).toBe('poco');
    expect(e.texto).toContain('200 g');
  });

  it('marca como falta lo que no está', () => {
    expect(estadoIngrediente({ nombre: 'Salmón', cantidad: 400, unidad: 'g' }, d).clave).toBe('falta');
  });
});

describe('generación del plan', () => {
  const d = despensa();

  it('planifica tantos días como se piden', () => {
    expect(generarPlan('menú equilibrado', 7, d, HOY).plan).toHaveLength(7);
    expect(generarPlan('menú equilibrado', 5, d, HOY).plan).toHaveLength(5);
  });

  it('no repite receta', () => {
    const { plan } = generarPlan('menú equilibrado', 7, d, HOY);
    expect(new Set(plan.map((p) => p.receta.nombre)).size).toBe(7);
  });

  it('no repite base dos días seguidos', () => {
    const { plan } = generarPlan('menú equilibrado', 7, d, HOY);
    for (let i = 1; i < plan.length; i++) {
      expect(plan[i].receta.base).not.toBe(plan[i - 1].receta.base);
    }
  });

  it('limita la carne al 40% de la semana', () => {
    const { plan } = generarPlan('menú equilibrado', 7, d, HOY);
    expect(plan.filter((p) => p.receta.base === 'carne').length).toBeLessThanOrEqual(3);
  });

  it('respeta "sin carne"', () => {
    const { plan, preferencias } = generarPlan('sin carne, ligero', 7, d, HOY);
    expect(preferencias.vegetariano).toBe(true);
    expect(plan.every((p) => p.receta.etiquetas.includes('vegetariano'))).toBe(true);
  });

  it('prioriza lo que caduca hoy', () => {
    const { plan } = generarPlan('menú equilibrado', 7, d, HOY);
    expect(urgentesAprovechados(plan, d, HOY)).toContain('Pollo');
  });

  it('interpreta la petición', () => {
    expect(leerPeticion('algo rápido').rapido).toBe(true);
    expect(leerPeticion('quiero comer sano').ligero).toBe(true);
    expect(leerPeticion('más pescado').pescado).toBe(true);
    expect(leerPeticion('sin pescado').pescado).toBe(false);
  });
});

describe('ingredientes que faltan', () => {
  const d = despensa();

  it('no repite un ingrediente usado en varios días', () => {
    const { plan } = generarPlan('menú equilibrado', 7, d, HOY);
    const faltan = faltantesDelPlan(plan, d).map((f) => normalizar(f.nombre));
    expect(new Set(faltan).size).toBe(faltan.length);
  });

  it('deja fuera lo que sí hay en casa', () => {
    const { plan } = generarPlan('menú equilibrado', 7, d, HOY);
    expect(faltantesDelPlan(plan, d).some((f) => f.nombre === 'Arroz')).toBe(false);
  });
});

describe('mensaje del asistente', () => {
  const d = despensa();

  it('menciona lo que caduca cuando lo aprovecha', () => {
    const { plan, preferencias } = generarPlan('menú equilibrado', 7, d, HOY);
    expect(mensajeAsistente(plan, preferencias, d, HOY)).toContain('caduca pronto');
  });

  it('avisa cuando la petición deja fuera lo que caduca', () => {
    const { plan, preferencias } = generarPlan('sin carne', 7, d, HOY);
    const m = mensajeAsistente(plan, preferencias, d, HOY);
    expect(m).toContain('Ojo');
    expect(m).toContain('Pollo');
  });
});

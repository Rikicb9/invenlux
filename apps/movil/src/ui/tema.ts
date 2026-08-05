import type { ClaveEstado } from '@invenlux/core';

/**
 * Los tokens vienen del prototipo de Sprint 1 (`invenlux-prototipo-sprint1.html`).
 * Aquí no se rediseña nada: se traduce a React Native para que el producto
 * construido y el prototipo validado sean la misma cosa.
 */
export const color = {
  fondo: '#E9EEEC',
  superficie: '#FFFFFF',
  superficie2: '#F5F8F7',
  tinta: '#0F1F1B',
  tintaSuave: '#5F716C',
  tintaTenue: '#93A29E',
  linea: '#D6DFDC',
  fresco: '#0B7A5C',
  frescoSuave: '#DCEFE7',
  aviso: '#B87400',
  avisoSuave: '#FBEDD3',
  urgente: '#B33520',
  urgenteSuave: '#FADFD9',
  frio: '#2A6FA8',
  frioSuave: '#DCEAF5',
} as const;

export const radio = { s: 6, m: 11, l: 14, xl: 20 } as const;

export const espacio = { xs: 4, s: 8, m: 12, l: 18, xl: 24 } as const;

export const fuente = {
  display: 'BricolageGrotesque_700Bold',
  displayFuerte: 'BricolageGrotesque_800ExtraBold',
  texto: 'InterTight_400Regular',
  textoMedio: 'InterTight_500Medium',
  textoFuerte: 'InterTight_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
  monoFuerte: 'JetBrainsMono_700Bold',
} as const;

export const sombra = {
  shadowColor: '#0F1F1B',
  shadowOpacity: 0.07,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
} as const;

/** Un estado de caducidad del core → su par de colores. */
export function colorEstado(clave: ClaveEstado): { fondo: string; texto: string; punto: string } {
  switch (clave) {
    case 'caducado':
    case 'hoy':
      return { fondo: color.urgenteSuave, texto: color.urgente, punto: color.urgente };
    case 'aviso':
      return { fondo: color.avisoSuave, texto: color.aviso, punto: color.aviso };
    case 'en-plazo':
      return { fondo: color.frescoSuave, texto: color.fresco, punto: color.fresco };
    case 'sin-fecha':
      return { fondo: color.superficie2, texto: color.tintaSuave, punto: color.tintaTenue };
  }
}

export function colorUbicacion(ubicacion: string): { fondo: string; texto: string } {
  return ubicacion === 'Congelador'
    ? { fondo: color.frioSuave, texto: color.frio }
    : { fondo: color.superficie2, texto: color.tintaSuave };
}

# Invenlux

Gestor de despensa doméstica con lógica de almacén profesional: **FEFO**, lotes, trazabilidad y lista de la compra dinámica.

Este repositorio implementa el **Sprint 1 — bloque _Must have_** de `MVP_Invenlux.md`, con el stack decidido en `Stack_Tecnico_Invenlux.md`.

---

## Arrancar

```bash
pnpm install

pnpm test          # tests del motor de dominio (54 casos)
pnpm typecheck     # tipos de core + app
pnpm movil         # levanta Expo (Expo Go, simulador iOS o emulador Android)
```

La app abre con una despensa de ejemplo sembrada la primera vez (la misma del prototipo validado), para poder ver FEFO funcionando sin teclear veinte productos.

---

## Estructura

```
packages/core     @invenlux/core — dominio puro: FEFO, stock, caducidad, reposición
apps/movil        App Expo (React Native + expo-router + SQLite)
```

### `@invenlux/core`

Sin UI y sin base de datos, para poder testearlo entero y reutilizarlo después en el backend, en la versión web y en la mini tablet de cocina.

| Fichero | Qué resuelve |
|---|---|
| `tipos.ts` | Modelo del dominio (producto, lote, movimiento, lista) |
| `stock.ts` | Cálculo del stock a partir del registro de movimientos |
| `fefo.ts` | Orden de lotes y reparto de un consumo entre ellos |
| `caducidad.ts` | Estados de caducidad y ranking de urgencias |
| `reposicion.ts` | Cuándo un producto entra y sale de la lista de la compra |
| `formato.ts` | Cantidades y fechas en castellano |
| `texto.ts` | Comparación de nombres: evita duplicados por errata y alimenta el buscador |
| `catalogo.ts` | 138 productos básicos de supermercado con vida útil típica |
| `menu.ts` | Planificador semanal: recetas, cruce con la despensa y equilibrio |

Tres decisiones que sostienen todo lo demás:

1. **El stock se calcula, no se guarda.** Todo saldo se deriva de `movimiento`. Es lo que da la trazabilidad de lote y lo que evitará descuadres imposibles de auditar.
2. **`movimiento` es append-only.** Corregir un error es un movimiento de tipo `ajuste`; nunca un `UPDATE`.
3. **La estrategia de salida es intercambiable.** FEFO es la activa; FIFO y LIFO ya existen como comparadores y se expondrán en la fase de negocio.

### Backend

Supabase (Postgres, región UE). El esquema vive en `supabase/schema.sql`: seis tablas, RLS en todas filtrando por los hogares del usuario de la sesión, y un trigger que crea el hogar al registrarse.

Antes de arrancar hay que copiar `apps/movil/.env.example` como `.env` y rellenarlo con los valores de Settings → API del proyecto.

### `apps/movil`

| Capa | Fichero |
|---|---|
| Cliente de Supabase | `src/datos/supabase.ts` |
| Sesión anónima y hogar | `src/datos/sesion.ts` |
| Acceso a datos | `src/datos/repositorio.ts` |
| Estado y acciones | `src/estado/InventarioProvider.tsx` |
| Sistema visual (tokens del prototipo) | `src/ui/tema.ts` |
| Pantallas | `app/(tabs)/` |

Toda escritura pasa por el provider: primero SQLite, después memoria. La app no recalcula nada por su cuenta — el cálculo siempre es del core.

---

## Trazabilidad con el MVP

| Historia | Dónde vive |
|---|---|
| HU-01 + HU-02 · Alta unificada de producto y lote | `hojasAlta.tsx` → `HojaEntrada` |
| HU-03 · Ver inventario y detalle por lotes | `app/(tabs)/index.tsx`, `hojasProducto.tsx` |
| HU-04 · Registro de consumo con mínima fricción | `HojaConsumo` (pasos rápidos + «se acabó») |
| HU-05 · Descuento FEFO | `core/fefo.ts` |
| HU-06 · Alertas de caducidad | `core/caducidad.ts`, horizonte en Inventario |
| HU-07 · Lista de la compra manual y automática | `core/reposicion.ts`, `app/(tabs)/compra.tsx` |
| HU-08 · Lista dinámica al terminarse un producto | `registrarConsumo` → `decidirAlta` |

Fuera de alcance en este sprint, por decisión del MVP: escaneo de código de barras, OCR de tickets, importación por email, voz y multiusuario.

**Adelanto del Sprint 3 — menú semanal.** La pestaña Menú funciona con un banco local de 22 recetas y las reglas que después aplicará el asistente de IA: priorizar lo que caduca, equilibrar bases (sin repetir dos días seguidos, carne limitada al 40% de la semana) y respetar lo que pide el usuario. La lectura de la petición es hoy por palabras clave, no comprensión real: la pantalla lo indica.

**El catálogo es la base del OCR.** Los 138 productos con vida útil típica y el mapa categoría→ubicación (`UBICACION_SUGERIDA`) son exactamente lo que necesitará el escaneo de tickets para decidir dónde va cada producto y qué caducidad estimarle.

---

## Pendiente antes del Sprint 2

- **Registro con email.** Hoy la app abre con **sesión anónima**: no pide nada y el trigger de Postgres le crea su hogar. Funciona para un usuario, pero si se desinstala la app se genera un usuario nuevo y el inventario anterior deja de verse. Supabase permite convertir la sesión anónima en una con email conservando los datos, así que no hay migración que rehacer.
- **Offline.** La app escribe directamente en Supabase, sin capa de sincronización: decisión consciente que aplaza el principio 2 del stack ("offline desde el diseño") porque se da por buena la cobertura en la cocina. Es revisable — los movimientos append-only harían la sincronización posterior mucho menos dolorosa de lo habitual.
- **Fricción del registro de consumo.** Es el riesgo de UX señalado en el MVP. Con la app ya en mano conviene medirlo antes de dar por buena la solución de pasos rápidos.
- **`origen` del lote.** El campo ya se persiste (`manual` en Sprint 1). Cuando lleguen escaneo, ticket y email servirá para medir qué vía usa realmente la gente.

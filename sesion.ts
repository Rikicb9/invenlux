import { supabase } from './supabase';

/**
 * Sesión anónima.
 *
 * El usuario no ve ningún registro: la app abre y ya está dentro. Por debajo
 * sí hay un usuario real, que es lo que hace que RLS proteja los datos y que
 * el trigger `al_registrarse` cree su hogar automáticamente.
 *
 * Cuando llegue el registro con email, `linkIdentity` convierte esta sesión
 * en una con cuenta conservando todo el inventario.
 */
let hogar: string | null = null;
let usuario: string | null = null;

export function hogarActual(): string {
  if (!hogar) throw new Error('La sesión todavía no está lista. Llama antes a iniciarSesion().');
  return hogar;
}

export const usuarioActual = (): string | null => usuario;

async function buscarHogar(usuarioId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('miembro_hogar')
    .select('hogar_id')
    .eq('usuario_id', usuarioId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.hogar_id ?? null;
}

export async function iniciarSesion(): Promise<{ usuarioId: string; hogarId: string }> {
  const { data: sesionActual } = await supabase.auth.getSession();
  let usuarioId = sesionActual.session?.user.id ?? null;

  if (!usuarioId) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    usuarioId = data.user?.id ?? null;
  }
  if (!usuarioId) throw new Error('No se ha podido abrir la sesión anónima.');

  // El hogar lo crea un trigger en Postgres al insertarse el usuario. Puede
  // tardar un instante en estar visible, así que se reintenta unas pocas veces.
  let hogarId: string | null = null;
  for (let intento = 0; intento < 5 && !hogarId; intento++) {
    hogarId = await buscarHogar(usuarioId);
    if (!hogarId) await new Promise((r) => setTimeout(r, 300));
  }
  if (!hogarId) {
    throw new Error(
      'La sesión se ha creado pero no hay hogar asociado. Revisa el trigger al_registrarse en Supabase.',
    );
  }

  usuario = usuarioId;
  hogar = hogarId;
  return { usuarioId, hogarId };
}

/** Sólo para pruebas: cierra la sesión y olvida el hogar en memoria. */
export async function cerrarSesion(): Promise<void> {
  await supabase.auth.signOut();
  usuario = null;
  hogar = null;
}

import { createClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase.
 *
 * La clave anónima es pública por diseño: viaja en el bundle y cualquiera
 * puede leerla. Lo que protege los datos son las políticas RLS del esquema
 * (`supabase/schema.sql`), que filtran por el usuario de la sesión.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copia apps/web/.env.example ' +
      'como .env y rellena los valores de Settings → API.',
  );
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

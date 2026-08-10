import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase.
 *
 * La clave anónima es pública por diseño: viaja dentro de la app y cualquiera
 * puede leerla. Lo que protege los datos son las políticas RLS del esquema
 * (`supabase/schema.sql`), que filtran por el usuario de la sesión.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error(
    'Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copia apps/movil/.env.example como .env y rellena los valores de Settings → API.',
  );
}

export const supabase = createClient(url, anon, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    // No hay navegador ni redirecciones OAuth: la sesión no viene en la URL.
    detectSessionInUrl: false,
  },
});

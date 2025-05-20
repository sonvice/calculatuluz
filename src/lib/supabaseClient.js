import { createClient } from '@supabase/supabase-js';

// 1) URL y ANON pueden venir de VITE (import.meta.env) o de Node (process.env)
//    También caemos a las PUBLIC_ desde process.env para desarrollo local si quieres.
const URL =
  (typeof import.meta !== 'undefined' && import.meta.env.PUBLIC_SUPABASE_URL)
    ? import.meta.env.PUBLIC_SUPABASE_URL
    : (process.env.SUPABASE_URL   ?? process.env.PUBLIC_SUPABASE_URL);

const ANON =
  (typeof import.meta !== 'undefined' && import.meta.env.PUBLIC_SUPABASE_ANON_KEY)
    ? import.meta.env.PUBLIC_SUPABASE_ANON_KEY
    : (process.env.SUPABASE_ANON_KEY ?? process.env.PUBLIC_SUPABASE_ANON_KEY);

if (!URL || !ANON) {
  throw new Error(
    'Faltan las credenciales públicas de Supabase: ' +
    'asegúrate de definir PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY ' +
    'en .env para el navegador, o SUPABASE_URL y SUPABASE_ANON_KEY en CI/Node.'
  );
}

// Exportamos siempre el client “público” para el navegador/SSR
export const supabase = createClient(URL, ANON);

// Sólo si tenemos la Service Role Key definimos el client admin
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = SR
  ? createClient(URL, SR)
  : undefined;

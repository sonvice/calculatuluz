import { createClient } from '@supabase/supabase-js';

const URL = getEnv('PUBLIC_SUPABASE_URL', true);
const ANON = getEnv('PUBLIC_SUPABASE_ANON_KEY', true);

// Cliente público (para frontend o Astro)
export const supabase = createClient(URL, ANON);

// Solo inicializar el cliente “admin” si estamos en Node y existe la variable
export const supabaseAdmin = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

function getEnv(key, isPublic = false) {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const viteEnv = import.meta.env;
    if (isPublic && key in viteEnv) return viteEnv[key];
  }

  if (typeof process !== 'undefined' && key in process.env) return process.env[key];

  throw new Error(`La variable de entorno "${key}" no está definida`);
}

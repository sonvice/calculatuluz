import { createClient } from '@supabase/supabase-js';

function getUrl() {
  if (typeof process !== 'undefined' && process.env.SUPABASE_URL) {
    return process.env.SUPABASE_URL;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SUPABASE_URL) {
    return import.meta.env.PUBLIC_SUPABASE_URL;
  }
  throw new Error('Falta SUPABASE_URL (Node) o PUBLIC_SUPABASE_URL (Astro)');
}

function getAnon() {
  if (typeof process !== 'undefined' && process.env.SUPABASE_ANON_KEY) {
    return process.env.SUPABASE_ANON_KEY;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SUPABASE_ANON_KEY) {
    return import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  }
  throw new Error('Falta SUPABASE_ANON_KEY (Node) o PUBLIC_SUPABASE_ANON_KEY (Astro)');
}

// Solo se usa en scripts/CI
const getServiceRole = () => {
  if (typeof process !== 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  return null;
};

const URL  = getUrl();
const ANON = getAnon();
const SR   = getServiceRole();

// Cliente público (frontend / SSR)
export const supabase = createClient(URL, ANON);

// Cliente privilegiado (solo si hay service-role)
export const supabaseAdmin = SR ? createClient(URL, SR) : null;

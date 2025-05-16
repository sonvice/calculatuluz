import { createClient } from '@supabase/supabase-js';

const URL  = import.meta.env.SUPABASE_URL;
const ANON = import.meta.env.SUPABASE_ANON_KEY;
const SR   = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente “publico” para INSERT/SELECT desde el front
export const supabase = createClient(URL, ANON);

// Cliente “admin” para operaciones privilegiadas (UPDATE en confirm)
export const supabaseAdmin = createClient(URL, SR);


// src/lib/supabaseBrowserClient.js
import { createClient } from '@supabase/supabase-js';

const URL  = import.meta.env.PUBLIC_SUPABASE_URL;
const ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!URL || !ANON) {
  throw new Error(
    'Faltan PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_ANON_KEY en tu .env'
  );
}

export const supabase = createClient(URL, ANON);

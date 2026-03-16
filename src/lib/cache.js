// cache.js — server-side only, uses service role to bypass RLS
import { supabaseAdmin, supabase } from './supabaseClient.js';

const CACHE_KEY = 'precios-electricos';
const CACHE_TTL = 1000 * 60 * 60; // 1 hora

// Usa admin si está disponible (server-side), anon como fallback
const db = supabaseAdmin ?? supabase;

export async function getCachedData() {
  const { data, error } = await db
    .from('cache')
    .select('*')
    .eq('key', CACHE_KEY)
    .maybeSingle(); // maybeSingle: devuelve null si no existe, no lanza error

  if (error) {
    console.error('[CACHE] Error leyendo caché:', error.message);
    return null;
  }

  if (!data) {
    console.log('[CACHE] Sin datos en caché');
    return null;
  }

  const age = Date.now() - new Date(data.timestamp).getTime();
  if (age > CACHE_TTL) {
    console.log('[CACHE] Datos expirados');
    return null;
  }

  console.log('[CACHE] Cache válida');
  return data.data;
}

export async function updateCache(newData) {
  const { error } = await db
    .from('cache')
    .upsert(
      { key: CACHE_KEY, data: newData, timestamp: new Date().toISOString() },
      { onConflict: 'key' } // actualiza la fila existente en vez de insertar duplicado
    );

  if (error) {
    console.error('[CACHE] Error actualizando cache:', error.message);
    return null;
  }

  console.log('[CACHE] Cache actualizada');
  return true;
}

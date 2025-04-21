// cache.js
import supabase from './supabaseClient.js';

const CACHE_KEY = 'precios-electricos';
const CACHE_TTL = 1000 * 60 * 60; // 1 hora

export async function getCachedData() {
  const { data, error } = await supabase
    .from('cache')
    .select('*')
    .eq('key', CACHE_KEY)
    .single();

  if (error || !data) {
    console.error('[CACHE] No hay datos en caché o error:', error?.message);
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
  const { error } = await supabase
    .from('cache')
    .upsert({
      key: CACHE_KEY,
      data: newData,
      timestamp: new Date().toISOString()
    });

  if (error) {
    console.error('[CACHE] Error actualizando cache:', error.message);
    return null;
  }

  console.log('[CACHE] Cache actualizada');
  return true;
}

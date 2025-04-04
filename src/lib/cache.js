// cache.js
import fs from 'fs/promises';
import path from 'path';

// Definir constantes
const CACHE_DIR = path.join(process.cwd(), 'public', 'datos-cache');
const CACHE_FILE = path.join(CACHE_DIR, 'prices.json');
const BACKUP_FILE = path.join(CACHE_DIR, 'backup-prices.json');
const CACHE_TTL = 3600 * 1000; // 1 hora en milisegundos

// Helper para crear directorio si no existe
const ensureCacheDir = async () => {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
};

export async function getCachedData() {
  try {
    await ensureCacheDir();
    const data = await fs.readFile(CACHE_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    
    // Verificar si el caché está expirado
    const cacheAge = Date.now() - parsed.timestamp;
    if (cacheAge > CACHE_TTL) {
      console.log('[CACHE] Datos expirados');
      return null;
    }
    
    console.log(`[CACHE] Última actualización: ${new Date(parsed.timestamp).toLocaleString()}`);
    console.log(`[CACHE] Precio máximo: ${parsed.data.maxPrice} €/kWh`);
    
    return parsed.data;
  } catch (error) {
    console.error('[CACHE] Error leyendo caché:', error.message);
    return null;
  }
}

export async function updateCache(newData) {
  try {
    await ensureCacheDir();
    
    const cacheData = {
      data: newData,
      timestamp: Date.now()
    };
    
    // Escribir primero el backup
    await fs.writeFile(BACKUP_FILE, JSON.stringify(cacheData));
    // Mover el backup al archivo principal
    await fs.rename(BACKUP_FILE, CACHE_FILE);
    
    console.log('[CACHE] Actualizado correctamente');
    return cacheData;
  } catch (error) {
    console.error('[CACHE] Error actualizando caché:', error.message);
    return null;
  }
}

export async function getBackupData() {
  try {
    await ensureCacheDir();
    const data = await fs.readFile(BACKUP_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[CACHE] Error leyendo backup:', error.message);
    return null;
  }
}
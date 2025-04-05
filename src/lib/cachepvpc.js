// lib/cache.js
import { promises as fs } from 'fs';
import path from 'path';
import { DateTime } from 'luxon';

const CACHE_DIR = path.join(process.cwd(), 'public', 'datos-cache');
const CACHE_FILE = path.join(CACHE_DIR, 'pvpccache.json');

const PVPC_SCHEMA = {
  prices: 'array',
  currentPrice: 'number',
  averagePrice: 'number',
  minPrice: 'object',
  maxPrice: 'object',
  lastUpdated: 'string'
};

const ensureCacheDir = async () => {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('Cache directory error:', error);
  }
};

const validatePVPCData = (data) => {
  return data && Object.keys(PVPC_SCHEMA).every(key => 
    typeof data[key] === PVPC_SCHEMA[key] &&
    (key !== 'lastUpdated' || DateTime.fromISO(data[key]).isValid)
  );
};

export async function getCachedData() {
  try {
    await ensureCacheDir();
    const rawData = await fs.readFile(CACHE_FILE, 'utf-8');
    const data = JSON.parse(rawData);
    
    return validatePVPCData(data) && 
      DateTime.fromISO(data.lastUpdated) > DateTime.now().minus({ hours: 2 })
      ? data
      : null;

  } catch (error) {
    return null;
  }
}

export async function updateCache(data) {
  try {
    if (!validatePVPCData(data)) {
      throw new Error('Invalid PVPC data structure');
    }

    await ensureCacheDir();
    await fs.writeFile(CACHE_FILE, JSON.stringify(data));
    console.log('Cache updated:', DateTime.fromISO(data.lastUpdated).toLocaleString());
    
  } catch (error) {
    console.error('Cache update failed:', error);
  }
}
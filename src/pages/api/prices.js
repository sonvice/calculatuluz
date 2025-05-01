import { getCachedData, updateCache } from '../../lib/cache';

// Configuración principal (MANTENIDO SIN CAMBIOS)
const CACHE_TTL = 3600;
const STALE_TTL = 300;
const INDICATOR_ID = 1001;
const FALLBACK_PRICE = 0.15;

function toISOUTC(date) {
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
}

// Función NUEVA para obtener histórico
async function getHistoricalAverage() {
  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    const apiUrl = new URL(`https://api.esios.ree.es/indicators/${INDICATOR_ID}`);
    const params = new URLSearchParams({
      start_date: toISOUTC(yesterday),
      end_date: toISOUTC(now),
      time_trunc: 'day',
      time_agg: 'avg'
    });
    apiUrl.search = params.toString();

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'x-api-key': import.meta.env.ESIOS_TOKEN
      }
    });

    if (!response.ok) throw new Error('Error histórico');
    
    const data = await response.json();
    const historicalValue = data.indicator.values[0]?.value;
    
    return historicalValue ? historicalValue / 1000 : FALLBACK_PRICE;
    
  } catch (error) {
    console.error('Error obteniendo histórico:', error);
    return FALLBACK_PRICE;
  }
}

export async function GET(context) {
  const ESIOS_TOKEN = import.meta.env.ESIOS_TOKEN;
  
  try {
    // 1. Manejo de caché (MANTENIDO SIN CAMBIOS)
    const cached = await getCachedData();
    const cacheAge = cached ? Date.now() - new Date(cached.lastUpdated).getTime() : CACHE_TTL * 1000 + 1;
    
    if (cacheAge < CACHE_TTL * 1000) {
      return new Response(JSON.stringify(cached), {
        headers: {
          'Content-Type': 'application/json',
          'X-Data-Source': 'cache',
          'Cache-Control': `public, max-age=${Math.floor((CACHE_TTL * 1000 - cacheAge) / 1000)}, stale-while-revalidate=${STALE_TTL}`
        }
      });
    }

    // 2. Obtener datos ACTUALES (TU LÓGICA ORIGINAL)
    const now = new Date();
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + 1);
    
    const apiUrl = new URL(`https://api.esios.ree.es/indicators/${INDICATOR_ID}`);
    const params = new URLSearchParams({
      start_date: toISOUTC(startDate),
      end_date: toISOUTC(endDate),
      time_agg: 'avg',
      time_trunc: 'hour',
      locale: 'es'
    });
    apiUrl.search = params.toString();

    const response = await fetch(apiUrl, {
      headers: { 
        'Accept': 'application/json; application/vnd.esios-api-v1+json',
        'Content-Type': 'application/json',
        'x-api-key': ESIOS_TOKEN 
      }
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorBody}`);
    }
    
    // 3. Procesar datos actuales (TU LÓGICA ORIGINAL)
    const data = await response.json();
    const processed = processData(data, cached);
    
    // 4. Obtener histórico SEPARADAMENTE (NUEVO)
    processed.previousAverage = Number((await getHistoricalAverage()).toFixed(4));
    
    // 5. Actualizar caché (MANTENIDO)
    if (!cached || processed.maxPrice.value !== (cached.maxPrice?.value ?? cached.maxPrice)) {
      await updateCache(processed);
    }

    return new Response(JSON.stringify(processed), {
      headers: {
        'Content-Type': 'application/json',
        'X-Data-Source': 'live',
        'Cache-Control': `public, max-age=${CACHE_TTL}, stale-while-revalidate=${STALE_TTL}`
      }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    const cached = await getCachedData();
    return Response.json(cached || getFallbackData(), {
      headers: { 'X-Data-Source': cached ? 'stale-cache' : 'fallback' }
    });
  }
}

// FUNCIÓN ORIGINAL SIN MODIFICAR
function processData(apiData, cachedData) {
    const values = apiData?.indicator?.values || [];
    const currentHour = new Date().getHours();
    
    const hourlyPrices = values.reduce((acc, item) => {
      const dt = new Date(item.datetime_utc);
      const hour = dt.getUTCHours();
      acc[hour] = item.value / 1000;
      return acc;
    }, {});
  
    const originalPrices = Array.from({length: 24}, (_, i) => {
      return hourlyPrices[i] ?? cachedData?.prices[i]?.price ?? FALLBACK_PRICE;
    });
  
    const sum = originalPrices.reduce((a, b) => a + b, 0);
    const averagePrice = sum / 24;
    const minPriceValue = Math.min(...originalPrices);
    const maxPriceValue = Math.max(...originalPrices);
    
    const minIndices = originalPrices
      .map((p, i) => p === minPriceValue ? i : -1)
      .filter(i => i !== -1);
    
    const maxIndices = originalPrices
      .map((p, i) => p === maxPriceValue ? i : -1)
      .filter(i => i !== -1);
  
    const getTimeRangeFromIndex = (index) => {
      if (index === -1) return 'No disponible';
      const startHour = String(index).padStart(2, '0');
      const endHour = String((index + 1) % 24).padStart(2, '0');
      return `De ${startHour} a ${endHour}h`;
    };
  
    const categorizedPrices = originalPrices.map((price, i) => {
      const nextHour = (i + 1) % 24;
      const percent = (price / maxPriceValue) * 100;
      
      return {
        hour: `${String(i).padStart(2, '0')}:00 - ${String(nextHour).padStart(2, '0')}:00`,
        price: Number(price.toFixed(4)),
        category: getPriceCategory(percent)
      };
    });
  
    const currentPriceEntry = categorizedPrices.find(p => {
      const hourPart = p.hour.split(' - ')[0];
      const hour = parseInt(hourPart.split(':')[0], 10);
      return hour === currentHour;
    });
    const currentPrice = currentPriceEntry ? currentPriceEntry.price : FALLBACK_PRICE;
  
    return {
      prices: categorizedPrices,
      currentPrice: Number(currentPrice.toFixed(4)),
      averagePrice: Number(averagePrice.toFixed(3)),
      minPrice: {
        value: Number(minPriceValue.toFixed(5)),
        timeRange: minIndices.map(getTimeRangeFromIndex).join(' / ')
      },
      maxPrice: {
        value: Number(maxPriceValue.toFixed(5)),
        timeRange: maxIndices.map(getTimeRangeFromIndex).join(' / ')
      },
      lastUpdated: new Date().toISOString()
    };
}

// FUNCIÓN ORIGINAL SIN MODIFICAR
function getFallbackData() {
    const fallbackPrice = FALLBACK_PRICE;
    return {
      prices: Array.from({length: 24}, (_, i) => ({
        hour: `${String(i).padStart(2, '0')}:00 - ${String((i + 1) % 24).padStart(2, '0')}:00`,
        price: fallbackPrice,
        category: 'Medio'
      })),
      currentPrice: fallbackPrice,
      averagePrice: Number(fallbackPrice.toFixed(3)),
      previousAverage: Number(fallbackPrice.toFixed(4)),
      minPrice: {
        value: Number(fallbackPrice.toFixed(5)),
        timeRange: 'De 00 a 01h'
      },
      maxPrice: {
        value: Number(fallbackPrice.toFixed(5)),
        timeRange: 'De 00 a 01h'
      },
      lastUpdated: new Date().toISOString()
    };
}

// FUNCIÓN ORIGINAL SIN MODIFICAR
function getPriceCategory(percent) {
  if (percent < 40) return 'Muy bajo';
  if (percent <= 60) return 'Bajo';
  if (percent <= 80) return 'Medio';
  return 'Alto';
}
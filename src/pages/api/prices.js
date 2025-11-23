// src/pages/api/prices.js

import { getCachedData, updateCache } from '../../lib/cache';
import { DateTime } from 'luxon';

// ⚡ OPTIMIZACIÓN: Configuración mejorada
const CACHE_TTL      = 3600;    // 1 hora - datos estables
const STALE_TTL      = 7200;    // 2 horas - permite usar datos obsoletos
const INDICATOR_ID   = 1001;
const FALLBACK_PRICE = 0.15;

// ⚡ OPTIMIZACIÓN: Cache en memoria para requests concurrentes
let inFlightRequest = null;
let lastFetchTime = 0;
const MIN_FETCH_INTERVAL = 10000; // 10 segundos entre fetches

/** Convierte una Date local a ISO UTC */
function toISOUTC(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
}

/** Lógica de llamada cruda a ESIOS para una ventana de horas */
async function fetchEsiosRaw(startDate, endDate) {
  const apiUrl = new URL(`https://api.esios.ree.es/indicators/${INDICATOR_ID}`);
  apiUrl.search = new URLSearchParams({
    start_date: toISOUTC(startDate),
    end_date:   toISOUTC(endDate),
    time_agg:   'avg',
    time_trunc: 'hour',
    locale:     'es'
  }).toString();

  const resp = await fetch(apiUrl, {
    headers: {
      'Accept': 'application/json; application/vnd.esios-api-v1+json',
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.ESIOS_TOKEN
    },
    // ⚡ OPTIMIZACIÓN: Timeout para evitar requests colgados
    signal: AbortSignal.timeout(10000) // 10 segundos timeout
  });
  
  if (!resp.ok) throw new Error(`ESIOS HTTP ${resp.status}`);
  return await resp.json();
}

/** Obtiene el promedio diario histórico (día anterior) */
async function getHistoricalAverage() {
  try {
    const now       = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const apiUrl = new URL(`https://api.esios.ree.es/indicators/${INDICATOR_ID}`);
    apiUrl.search = new URLSearchParams({
      start_date: toISOUTC(yesterday),
      end_date:   toISOUTC(now),
      time_trunc: 'day',
      time_agg:   'avg'
    }).toString();

    const resp = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'x-api-key': import.meta.env.ESIOS_TOKEN
      },
      signal: AbortSignal.timeout(5000)
    });
    
    if (!resp.ok) throw new Error('Error histórico');
    const data = await resp.json();
    const val  = data.indicator.values[0]?.value;
    return val != null ? val / 1000 : FALLBACK_PRICE;
  } catch {
    return FALLBACK_PRICE;
  }
}

/** Categoriza según porcentaje respecto al máximo */
function getPriceCategory(percent) {
  if (percent < 40) return 'Muy bajo';
  if (percent <= 60) return 'Bajo';
  if (percent <= 80) return 'Medio';
  return 'Alto';
}

/** Procesa la respuesta de ESIOS en tu formato de precios horarios */
function processData(apiData, cachedData) {
  const values = apiData?.indicator?.values || [];
  const nowHour = new Date().getHours();

  // Map de precios por hora
  const hourlyMap = values.reduce((acc, { datetime_utc, value }) => {
    acc[new Date(datetime_utc).getUTCHours()] = value / 1000;
    return acc;
  }, {});

  // Array de 24 horas con fallback
  const pricesArr = Array.from({ length: 24 }, (_, i) =>
    hourlyMap[i] ?? cachedData?.prices[i]?.price ?? FALLBACK_PRICE
  );

  const sum = pricesArr.reduce((a, b) => a + b, 0);
  const avg = sum / 24;
  const min = Math.min(...pricesArr);
  const max = Math.max(...pricesArr);

  // Índices de mínimos y máximos
  const idxOf = (v) => pricesArr.map((p, i) => p === v ? i : -1).filter(i => i !== -1);

  const formatRange = (i) => {
    const s = String(i).padStart(2, '0');
    const e = String((i + 1) % 24).padStart(2, '0');
    return `De ${s} a ${e}h`;
  };

  const categorized = pricesArr.map((p, i) => {
    const pct = p / max * 100;
    return {
      hour:     `${String(i).padStart(2,'0')}:00 - ${String((i+1)%24).padStart(2,'0')}:00`,
      price:    Number(p.toFixed(4)),
      category: getPriceCategory(pct)
    };
  });

  const currentEntry = categorized.find(({ hour }) => {
    const hr = parseInt(hour.split(':')[0], 10);
    return hr === nowHour;
  });

  return {
    prices:       categorized,
    currentPrice: currentEntry?.price ?? FALLBACK_PRICE,
    averagePrice: Number(avg.toFixed(3)),
    minPrice: {
      value:     Number(min.toFixed(5)),
      timeRange: idxOf(min).map(formatRange).join(' / ')
    },
    maxPrice: {
      value:     Number(max.toFixed(5)),
      timeRange: idxOf(max).map(formatRange).join(' / ')
    },
    lastUpdated: new Date().toISOString()
  };
}

/** Datos fallback si todo falla */
function getFallbackData() {
  const p = FALLBACK_PRICE;
  const list = Array.from({ length: 24 }, (_, i) => ({
    hour:     `${String(i).padStart(2,'0')}:00 - ${String((i+1)%24).padStart(2,'0')}:00`,
    price:    p,
    category: 'Medio'
  }));
  return {
    prices:          list,
    currentPrice:    p,
    averagePrice:    Number(p.toFixed(3)),
    previousAverage: Number(p.toFixed(4)),
    minPrice: {
      value:     Number(p.toFixed(5)),
      timeRange: 'De 00 a 01h'
    },
    maxPrice: {
      value:     Number(p.toFixed(5)),
      timeRange: 'De 00 a 01h'
    },
    lastUpdated: new Date().toISOString()
  };
}

export async function GET(context) {
  const url        = new URL(context.request.url);
  const isTomorrow = url.searchParams.get('day') === 'tomorrow';
  
  // ⚡ OPTIMIZACIÓN 1: Request deduplication
  const now = Date.now();
  if (inFlightRequest && (now - lastFetchTime) < MIN_FETCH_INTERVAL) {
    console.log('⚡ Reutilizando request en vuelo');
    return inFlightRequest;
  }

  // ⚡ OPTIMIZACIÓN 2: Caché agresivo para hoy
  const cached = await getCachedData();
  const ageMs  = cached
    ? Date.now() - new Date(cached.lastUpdated).getTime()
    : (CACHE_TTL + 1) * 1000;

  // Servir caché inmediatamente si es válida
  if (ageMs < CACHE_TTL * 1000) {
    const remainingTTL = Math.floor((CACHE_TTL * 1000 - ageMs) / 1000);
    
    return new Response(JSON.stringify(cached), {
      headers: {
        'Content-Type': 'application/json',
        'X-Data-Source': 'cache',
        'X-Cache-Age': Math.floor(ageMs / 1000).toString(),
        // ⚡ OPTIMIZACIÓN: Cache más agresivo en el navegador
        'Cache-Control': `public, max-age=${remainingTTL}, stale-while-revalidate=${STALE_TTL}`,
        // ⚡ OPTIMIZACIÓN: ETag para validación condicional
        'ETag': `"${cached.lastUpdated}"`
      }
    });
  }

  // ⚡ OPTIMIZACIÓN 3: Servir stale si fetch falla
  const fetchPromise = (async () => {
    try {
      lastFetchTime = Date.now();

      // Definir ventana (hoy ó mañana) en UTC
      const refDate = isTomorrow
        ? DateTime.now().plus({ days: 1 }).startOf('day')
        : DateTime.now().startOf('day');

      const startDate = refDate.toJSDate();
      const endDate   = refDate.plus({ days: 1 }).toJSDate();

      // Llamada a ESIOS y procesado
      const rawData  = await fetchEsiosRaw(startDate, endDate);
      const processed = processData(rawData, cached);

      // Añadir promedio histórico (día anterior) - sin bloquear
      getHistoricalAverage()
        .then(avg => {
          processed.previousAverage = Number(avg.toFixed(4));
          updateCache(processed); // Actualizar con promedio histórico
        })
        .catch(() => {
          processed.previousAverage = FALLBACK_PRICE;
        });

      // Bandera para front: precios de mañana disponibles tras 20:25 CET/CEST
      const nowMadrid = DateTime.now().setZone('Europe/Madrid');
      const cutoff = nowMadrid.startOf('day').plus({ 
        hours: 20, 
        minutes: 25,
        seconds: 0 
      });
      
      const tomorrowAvailable = isTomorrow 
        ? nowMadrid >= cutoff.minus({ days: 1 })  
        : nowMadrid >= cutoff;

      if (isTomorrow && !tomorrowAvailable) {
        return new Response(JSON.stringify({
          ...(cached || getFallbackData()),
          prices: [],
          tomorrowAvailable: false
        }), {
          headers: { 
            'Content-Type': 'application/json', 
            'X-Data-Source': 'no-tomorrow-yet',
            'Cache-Control': `public, max-age=300` // 5 minutos
          }
        });
      }

      processed.tomorrowAvailable = tomorrowAvailable;

      // Actualizar caché si cambió algo esencial
      if (!cached || processed.maxPrice.value !== (cached.maxPrice?.value ?? cached.maxPrice)) {
        await updateCache(processed);
      }

      return new Response(JSON.stringify(processed), {
        headers: {
          'Content-Type': 'application/json',
          'X-Data-Source': 'live',
          'X-Fetch-Time': (Date.now() - lastFetchTime).toString() + 'ms',
          'Cache-Control': `public, max-age=${CACHE_TTL}, stale-while-revalidate=${STALE_TTL}`,
          'ETag': `"${processed.lastUpdated}"`
        }
      });

    } catch (err) {
      console.error('⚠️ API Error:', err);
      
      // ⚡ OPTIMIZACIÓN: Servir caché obsoleta antes que fallback
      if (cached && ageMs < (STALE_TTL * 1000)) {
        console.log('⚡ Sirviendo caché obsoleta por error');
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'X-Data-Source': 'stale-cache',
            'X-Error': err.message,
            'Cache-Control': `public, max-age=60` // Reintentar en 1 minuto
          }
        });
      }

      // Último recurso: fallback
      const fallback = cached || getFallbackData();
      return new Response(JSON.stringify(fallback), {
        status: 503, // Service Unavailable
        headers: { 
          'Content-Type': 'application/json',
          'X-Data-Source': cached ? 'stale-cache-error' : 'fallback',
          'X-Error': err.message,
          'Cache-Control': 'no-cache',
          'Retry-After': '60' // Reintentar en 60 segundos
        }
      });
    } finally {
      inFlightRequest = null;
    }
  })();

  inFlightRequest = fetchPromise;
  return fetchPromise;
}

// ⚡ OPTIMIZACIÓN: Pre-warm cache (opcional)
// Si quieres precalentar el cache al iniciar el servidor
export async function warmCache() {
  try {
    const cached = await getCachedData();
    if (!cached) {
      console.log('🔥 Pre-warming cache...');
      const request = new Request('http://localhost/api/prices');
      await GET({ request });
      console.log('✅ Cache pre-warmed');
    }
  } catch (error) {
    console.error('❌ Cache pre-warm failed:', error);
  }
}
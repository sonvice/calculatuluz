// src/pages/api/prices.js

import { getCachedData, updateCache } from '../../lib/cache';
import { DateTime } from 'luxon';

// Configuración principal (SIN CAMBIOS)
const CACHE_TTL      = 3600;    // segundos
const STALE_TTL      = 300;     // segundos
const INDICATOR_ID   = 1001;
const FALLBACK_PRICE = 0.15;

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
    }
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
      }
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

  // 1. Manejo de caché (igual que siempre)
  const cached = await getCachedData();
  const ageMs  = cached
    ? Date.now() - new Date(cached.lastUpdated).getTime()
    : (CACHE_TTL + 1) * 1000;

  if (ageMs < CACHE_TTL * 1000) {
    return new Response(JSON.stringify(cached), {
      headers: {
        'Content-Type': 'application/json',
        'X-Data-Source': 'cache',
        'Cache-Control': `public, max-age=${Math.floor((CACHE_TTL*1000 - ageMs)/1000)}, stale-while-revalidate=${STALE_TTL}`
      }
    });
  }

  try {
    // 2. Definir ventana (hoy ó mañana) en UTC
    const refDate = isTomorrow
      ? DateTime.now().plus({ days: 1 }).startOf('day')
      : DateTime.now().startOf('day');

    const startDate = refDate.toJSDate();
    const endDate   = refDate.plus({ days: 1 }).toJSDate();

    // 3. Llamada a ESIOS y procesado
    const rawData  = await fetchEsiosRaw(startDate, endDate);
    const processed = processData(rawData, cached);

    // 4. Añadir promedio histórico (día anterior)
    processed.previousAverage = Number((await getHistoricalAverage()).toFixed(4));

    // 5. Bandera para front: precios de mañana disponibles tras 20:05 CET/CEST
    const nowMadrid = DateTime.now().setZone('Europe/Madrid');
    const cutoff    = nowMadrid.set({ hour: 20, minute: 25, second: 0, millisecond: 0 });
    const tomorrowAvailable = nowMadrid >= cutoff;

    if (isTomorrow && !tomorrowAvailable) {
      // Antes de las 20:05, devolvemos vacío + flag false
      return new Response(JSON.stringify({
        prices: [],
        currentPrice: null,
        averagePrice: null,
        minPrice: null,
        maxPrice: null,
        lastUpdated: nowMadrid.toISO(),
        previousAverage: await getHistoricalAverage(),
        tomorrowAvailable: false
      }), {
        headers: { 'Content-Type': 'application/json', 'X-Data-Source': 'no-tomorrow-yet' }
      });
    }

    processed.tomorrowAvailable = nowMadrid >= cutoff;

    // 6. Actualizar caché si cambió algo esencial
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

  } catch (err) {
    console.error('API Error:', err);
    const fallback = cached || getFallbackData();
    return new Response(JSON.stringify(fallback), {
      headers: { 'X-Data-Source': cached ? 'stale-cache' : 'fallback' }
    });
  }
}

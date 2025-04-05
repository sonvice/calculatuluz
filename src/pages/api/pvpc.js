// src/pages/api/prices.js
import { getCachedData, updateCache } from '../../lib/cache';
import { DateTime } from 'luxon';

// Configuración
const CACHE_TTL = 3600; // 1 hora en caché
const INDICATOR_ID = 1013; // PVPC
const GEO_ID = 8741; // Península
const FALLBACK_PRICE = 0.15;
const TIME_ZONE = 'Europe/Madrid';

// Helper para fecha/hora
const getMadridTime = () => DateTime.now().setZone(TIME_ZONE);

export async function GET(context) {
  const ESIOS_TOKEN = import.meta.env.ESIOS_TOKEN;
  const nowMadrid = getMadridTime();

  try {
    // 1. Manejo de caché
    const cached = await getCachedData();
    if (cached && DateTime.fromISO(cached.lastUpdated) > nowMadrid.minus({ hours: 1 })) {
      return new Response(JSON.stringify(cached), {
        headers: { 
          'Content-Type': 'application/json',
          'X-Data-Source': 'cache'
        }
      });
    }

    // 2. Configurar rango temporal
    const startDate = nowMadrid.startOf('day');
    const endDate = startDate.plus({ days: 1 });

    // 3. Construir URL sin parámetros de agregación
    const apiUrl = new URL(`https://api.esios.ree.es/indicators/${INDICATOR_ID}`);
    apiUrl.search = new URLSearchParams({
      start_date: startDate.toISO(),
      end_date: endDate.toISO(),
      geo_ids: GEO_ID
    });

    // 4. Llamada a la API
    const response = await fetch(apiUrl, {
      headers: { 
        'Accept': 'application/json; application/vnd.esios-api-v1+json',
        'Authorization': `Token token=${ESIOS_TOKEN}`
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    // 5. Procesar datos
    const rawData = await response.json();
    const processed = processPVPCData(rawData, nowMadrid);

    // 6. Actualizar caché
    await updateCache(processed);

    return new Response(JSON.stringify(processed), {
      headers: { 
        'Content-Type': 'application/json',
        'X-Data-Source': 'live'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    const cached = await getCachedData() || generateFallbackData(nowMadrid);
    return Response.json(cached);
  }
}

// Procesamiento específico para PVPC
function processPVPCData(apiData, nowMadrid) {
  const values = apiData?.indicator?.values || [];
  
  // Validar y ordenar datos
  const sortedValues = values
    .map(item => ({
      datetime: DateTime.fromISO(item.datetime, { zone: TIME_ZONE }),
      value: Number(item.value.toFixed(5))
    }))
    .sort((a, b) => a.datetime - b.datetime);

  // Mapear a 24 horas
  const hourlyPrices = Array(24).fill(FALLBACK_PRICE);
  sortedValues.forEach((item, index) => {
    if (index < 24) hourlyPrices[index] = item.value;
  });

  // Calcular estadísticas
  const minValue = Math.min(...hourlyPrices);
  const maxValue = Math.max(...hourlyPrices);
  const currentHour = nowMadrid.hour;

  return {
    prices: hourlyPrices.map((price, hour) => ({
      hour: `${String(hour).padStart(2, '0')}:00 - ${String((hour + 1) % 24).padStart(2, '0')}:00`,
      price,
      category: getPriceCategory(price)
    })),
    currentPrice: hourlyPrices[currentHour],
    averagePrice: Number((hourlyPrices.reduce((a, b) => a + b, 0) / 24).toFixed(3)),
    minPrice: getPriceExtremes(hourlyPrices, minValue),
    maxPrice: getPriceExtremes(hourlyPrices, maxValue),
    lastUpdated: nowMadrid.toISO()
  };
}

// Nueva categorización por valores absolutos
function getPriceCategory(price) {
  if (price < 0.05) return 'Muy bajo';
  if (price < 0.08) return 'Bajo';
  if (price < 0.12) return 'Medio';
  return 'Alto';
}

// Helper para extremos con formato correcto
function getPriceExtremes(prices, value) {
  const indices = prices
    .map((p, i) => p === value ? i : -1)
    .filter(i => i !== -1);

  return {
    value,
    timeRanges: indices.map(i => ({
      start: `${String(i).padStart(2, '0')}:00`,
      end: `${String((i + 1) % 24).padStart(2, '0')}:00`
    }))
  };
}

// Fallback mejorado
function generateFallbackData(nowMadrid) {
  return {
    prices: Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00 - ${String((i + 1) % 24).padStart(2, '0')}:00`,
      price: FALLBACK_PRICE,
      category: 'Medio'
    })),
    currentPrice: FALLBACK_PRICE,
    averagePrice: FALLBACK_PRICE,
    minPrice: { value: FALLBACK_PRICE, timeRanges: [] },
    maxPrice: { value: FALLBACK_PRICE, timeRanges: [] },
    lastUpdated: nowMadrid.toISO()
  };
}
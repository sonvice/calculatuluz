// src/pages/api/prices.js
import { getCachedData, updateCache } from '../../lib/cachepvpc.js';
import { DateTime } from 'luxon';

const INDICATOR_ID = 1013; // PVPC (Término de facturación de energía activa del PVPC peaje por defecto)
const GEO_ID = 8741; // Península
const TIME_ZONE = 'Europe/Madrid';
const FALLBACK_PRICE = 0.15;

export async function GET() {
  const ESIOS_TOKEN = import.meta.env.ESIOS_TOKEN;
  const nowMadrid = DateTime.now().setZone(TIME_ZONE);

  try {
    // 1. Verificar datos de caché recientes
    const cached = await getCachedData();
    if (cached && DateTime.fromISO(cached.lastUpdated) > nowMadrid.minus({ hours: 1 })) {
      return Response.json(cached);
    }

    // 2. Configurar rango temporal
    // IMPORTANTE: Si consultas el día actual es posible que no existan datos aún, prueba con un día pasado.
    const startDate = nowMadrid.startOf('day');
    const endDate = startDate.plus({ days: 1 });

    // 3. Construir URL para el indicador 1013
    const apiUrl = new URL(`https://api.esios.ree.es/indicators/${INDICATOR_ID}`);
    apiUrl.search = new URLSearchParams({
      start_date: startDate.toISO(),
      end_date: endDate.toISO(),
      geo_ids: GEO_ID,
      time_trunc: 'hour',
      time_agg: 'avg',    // Agregación por promedio
      locale: 'es'        // Para obtener resultados en español
    });

    // 4. Realizar la llamada a la API ESIOS
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json; application/vnd.esios-api-v1+json',
        'Content-Type': 'application/json',
        'x-api-key': ESIOS_TOKEN
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    // 5. Procesar datos recibidos
    const rawData = await response.json();
    console.log(rawData);
    const processed = processPVPCData(rawData, nowMadrid);

    // 6. Actualizar caché si se han obtenido precios reales
    if (processed.prices.some(p => p.price !== FALLBACK_PRICE)) {
      await updateCache(processed);
    }

    return Response.json(processed);

  } catch (error) {
    console.error('API Error:', error);
    const cached = await getCachedData() || generateDynamicFallback(nowMadrid);
    return Response.json(cached);
  }
}

function processPVPCData(apiData, nowMadrid) {
  try {
    const values = apiData?.indicator?.values || [];

    // Inicializar un array de 24 horas con FALLBACK_PRICE
    const hourlyPrices = Array(24).fill(FALLBACK_PRICE);

    // Recorrer cada entrada y asignar el precio según la hora local (truncado)
    values.forEach(item => {
      const dt = DateTime.fromISO(item.datetime, { zone: TIME_ZONE }).startOf('hour');
      const hour = dt.hour;
      if (hour >= 0 && hour < 24) {
        hourlyPrices[hour] = Number(item.value.toFixed(5));
      }
    });

    // Cálculos estadísticos
    const minVal = Math.min(...hourlyPrices);
    const maxVal = Math.max(...hourlyPrices);
    const currentHour = nowMadrid.hour;

    return {
      prices: hourlyPrices.map((price, hour) => ({
        hour: `${String(hour).padStart(2, '0')}:00 - ${String((hour + 1) % 24).padStart(2, '0')}:00`,
        price,
        category: getPriceCategory(price)
      })),
      currentPrice: hourlyPrices[currentHour],
      averagePrice: Number((hourlyPrices.reduce((a, b) => a + b, 0) / 24).toFixed(4)),
      minPrice: getPriceExtremes(hourlyPrices, minVal),
      maxPrice: getPriceExtremes(hourlyPrices, maxVal),
      lastUpdated: nowMadrid.toISO()
    };
  } catch (error) {
    console.error('Processing Error:', error);
    return generateDynamicFallback(nowMadrid);
  }
}

function getPriceCategory(price) {
  if (price < 0.05) return 'Muy bajo';
  if (price < 0.08) return 'Bajo';
  if (price < 0.12) return 'Medio';
  return 'Alto';
}

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

function generateDynamicFallback(nowMadrid) {
  const basePrice = FALLBACK_PRICE;
  return {
    prices: Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00 - ${String((i + 1) % 24).padStart(2, '0')}:00`,
      price: Number((basePrice + (Math.random() * 0.02 - 0.01)).toFixed(4)),
      category: 'Medio'
    })),
    currentPrice: basePrice,
    averagePrice: basePrice,
    minPrice: { value: basePrice, timeRanges: [] },
    maxPrice: { value: basePrice, timeRanges: [] },
    lastUpdated: nowMadrid.toISO()
  };
}

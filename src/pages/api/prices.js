import { getCachedData, updateCache } from '../../lib/cache';

// Configuración principal
const CACHE_TTL = 3600; // Tiempo de vida de la caché en segundos (1 hora)
const STALE_TTL = 300; // Tiempo de gracia para datos obsoletos (5 minutos)
const INDICATOR_ID = 1013; // ID del indicador ESIOS
const FALLBACK_PRICE = 0.15; // Precio por defecto para fallbacks

// Helper para convertir fechas a formato ISO UTC
function toISOUTC(date) {
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
}

export async function GET(context) {
  const ESIOS_TOKEN = import.meta.env.ESIOS_TOKEN;
  
  try {
    // 1. Manejo de caché: Verificar datos existentes
    const cached = await getCachedData();
    const cacheAge = cached ? Date.now() - new Date(cached.lastUpdated).getTime() : CACHE_TTL * 1000 + 1;
    
    // Devolver datos de caché si son recientes
    if (cacheAge < CACHE_TTL * 1000) {
      return new Response(JSON.stringify(cached), {
        headers: {
          'Content-Type': 'application/json',
          'X-Data-Source': 'cache',
          'Cache-Control': `public, max-age=${Math.floor((CACHE_TTL * 1000 - cacheAge) / 1000)}, stale-while-revalidate=${STALE_TTL}`
        }
      });
    }

    // 2. Configurar rango temporal: Últimas 24 horas UTC
    const now = new Date();
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + 1);
    
    // 3. Construir URL de la API con parámetros
    const apiUrl = new URL(`https://api.esios.ree.es/indicators/${INDICATOR_ID}`);
    const params = new URLSearchParams({
      start_date: toISOUTC(startDate),
      end_date: toISOUTC(endDate),
      time_agg: 'avg', // Agregación por promedio
      time_trunc: 'hour', // Agrupación por hora
      locale: 'es' // Idioma español
    });
    apiUrl.search = params.toString();

    // 4. Realizar llamada a la API ESIOS
    const response = await fetch(apiUrl, {
      headers: { 
        'Accept': 'application/json; application/vnd.esios-api-v1+json',
        'Content-Type': 'application/json',
        'x-api-key': ESIOS_TOKEN 
      }
    });
    
    // Manejo de errores HTTP
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorBody}`);
    }
    
    // 5. Procesamiento de datos recibidos
    const data = await response.json();
    const processed = processData(data, cached);
    
    // 6. Actualizar caché solo si hay cambios importantes
// En la función GET, actualizar condición de caché:
if (!cached || processed.maxPrice.value !== (cached.maxPrice?.value ?? cached.maxPrice)) {
    await updateCache(processed);
  }

    // Devolver datos actualizados
    return new Response(JSON.stringify(processed), {
      headers: {
        'Content-Type': 'application/json',
        'X-Data-Source': 'live',
        'Cache-Control': `public, max-age=${CACHE_TTL}, stale-while-revalidate=${STALE_TTL}`
      }
    });
    
  } catch (error) {
    // Manejo de errores: Usar caché o datos de respaldo
    console.error('API Error:', error);
    const cached = await getCachedData();
    return Response.json(cached || getFallbackData(), {
      headers: { 'X-Data-Source': cached ? 'stale-cache' : 'fallback' }
    });
  }
}

// Función para generar datos de respaldo
function getFallbackData() {
    const fallbackPrice = FALLBACK_PRICE;
    return {
      prices: Array.from({length: 24}, (_, i) => ({
        hour: `${String(i).padStart(2, '0')}:00 - ${String((i + 1) % 24).padStart(2, '0')}:00`,
        price: fallbackPrice,
        category: 'Medio'
      })),
      currentPrice: fallbackPrice,
      averagePrice: Number(fallbackPrice.toFixed(3)), // ***
      minPrice: { // *** Nueva estructura
        value: Number(fallbackPrice.toFixed(5)),
        timeRange: 'De 00 a 01h'
      },
      maxPrice: { // *** Nueva estructura
        value: Number(fallbackPrice.toFixed(5)),
        timeRange: 'De 00 a 01h'
      },
      lastUpdated: new Date().toISOString()
    };
  }

// Procesamiento principal de datos
function processData(apiData, cachedData) {
    // 1. Extraer valores de la API
    const values = apiData?.indicator?.values || [];
    const currentHour = new Date().getHours();
    
    // 2. Mapear precios por hora UTC
    const hourlyPrices = values.reduce((acc, item) => {
      const dt = new Date(item.datetime_utc);
      const hour = dt.getUTCHours();
      acc[hour] = item.value / 1000;
      return acc;
    }, {});
  
    // 3. Construir array completo de 24 horas (CORREGIR ACCESO CACHÉ)
    const originalPrices = Array.from({length: 24}, (_, i) => {
      // *** Usar cachedData?.prices[i]?.price en vez de cachedData?.prices[i]
      return hourlyPrices[i] ?? cachedData?.prices[i]?.price ?? FALLBACK_PRICE;
    });
  
    // 4. Cálculos estadísticos (DETECTAR MÚLTIPLES HORARIOS)
    const sum = originalPrices.reduce((a, b) => a + b, 0);
    const averagePrice = sum / 24;
    const minPriceValue = Math.min(...originalPrices);
    const maxPriceValue = Math.max(...originalPrices);
    
    // *** Buscar TODOS los índices con precios mín/máx
    const minIndices = originalPrices
      .map((p, i) => p === minPriceValue ? i : -1)
      .filter(i => i !== -1);
    
    const maxIndices = originalPrices
      .map((p, i) => p === maxPriceValue ? i : -1)
      .filter(i => i !== -1);
  
    // Helper para formatear rangos (AGREGAR PADDING)
    const getTimeRangeFromIndex = (index) => {
      if (index === -1) return 'No disponible';
      const startHour = String(index).padStart(2, '0'); // *** Padding para 2 dígitos
      const endHour = String((index + 1) % 24).padStart(2, '0');
      return `De ${startHour} a ${endHour}h`; // *** Formato 02 en vez de 2
    };
  
    // 5. Categorización de precios por hora
    const categorizedPrices = originalPrices.map((price, i) => {
      const nextHour = (i + 1) % 24;
      const percent = (price / maxPriceValue) * 100;
      
      return {
        hour: `${String(i).padStart(2, '0')}:00 - ${String(nextHour).padStart(2, '0')}:00`,
        price: Number(price.toFixed(4)),
        category: getPriceCategory(percent)
      };
    });
  
    // 6. Obtener precio actual (CORREGIR COMPARACIÓN HORAS UTC)
    const currentPriceEntry = categorizedPrices.find(p => {
      const hourPart = p.hour.split(' - ')[0];
      const hour = parseInt(hourPart.split(':')[0], 10);
      return hour === currentHour;
    });
    const currentPrice = currentPriceEntry ? currentPriceEntry.price : FALLBACK_PRICE;
  
    // 7. Estructurar respuesta final (AGREGAR CAMPOS FALTANTES)
    return {
      prices: categorizedPrices,
      currentPrice: Number(currentPrice.toFixed(4)),
      averagePrice: Number(averagePrice.toFixed(3)), // *** Nuevo campo
      minPrice: {
        value: Number(minPriceValue.toFixed(5)), // *** 5 decimales
        timeRange: minIndices.map(getTimeRangeFromIndex).join(' / ') // *** Múltiples horarios
      },
      maxPrice: {
        value: Number(maxPriceValue.toFixed(5)),
        timeRange: maxIndices.map(getTimeRangeFromIndex).join(' / ')
      },
      lastUpdated: new Date().toISOString()
    };
  }
  

// Clasificador de categorías de precio
function getPriceCategory(percent) {
  if (percent < 40) return 'Muy bajo';
  if (percent <= 60) return 'Bajo';
  if (percent <= 80) return 'Medio';
  return 'Alto';
}
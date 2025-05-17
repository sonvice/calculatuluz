import { ref, onMounted } from 'vue';

export function usePriceData(initialDay = 'today') {
  // Día que vamos a fetch (today | tomorrow)
  const day       = ref(initialDay);
  // Datos de precios
  const priceData = ref({
    currentPrice:     null,
    averagePrice:     null,
    previousAverage:  null,
    lastUpdated:      null,
    prices:           [],
    minPrice:         null,
    maxPrice:         null,
    tomorrowAvailable: false
  });
  const loading = ref(true);

  // Función de fetch, recibe opcionalmente el día a consultar
  async function fetchPriceData(fetchDay = day.value) {
    loading.value = true;
    try {
      // Construimos la URL con ?day=tomorrow si toca
      const url = new URL('/api/prices', window.location.origin);
      if (fetchDay === 'tomorrow') {
        url.searchParams.set('day', 'tomorrow');
      }

      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();

      // Volcar los datos al ref
      priceData.value = {
        currentPrice:      data.currentPrice,
        averagePrice:      data.averagePrice,
        previousAverage:   data.previousAverage,
        lastUpdated:       data.lastUpdated || new Date().toISOString(),
        prices:            data.prices,
        minPrice:          data.minPrice,
        maxPrice:          data.maxPrice,
        tomorrowAvailable: data.tomorrowAvailable ?? false
      };
    } catch (e) {
      console.error('Error fetching prices:', e);
      alert('⚠️ No se pudieron cargar los precios');
    } finally {
      loading.value = false;
    }
  }

  // Cuando montamos, hacemos el primer fetch
  onMounted(() => {
    fetchPriceData();
  });

  return { day, priceData, fetchPriceData, loading };
}

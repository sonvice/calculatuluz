import { ref, onMounted, computed } from 'vue';

export function usePriceData() {
  const priceData = ref({
    currentPrice: null,
    lastUpdated: null,
    prices: [],
    minPrice: null,
    maxPrice: null,
  });

  const fetchPriceData = async () => {
    try {
      const apiUrl = new URL('/api/prices', window.location.origin);
      const response = await fetch(apiUrl, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data = await response.json();
      priceData.value = {
        currentPrice: data.currentPrice,
        averagePrice: data.averagePrice,
        lastUpdated: new Date().toISOString(),
        prices: data.prices,
        minPrice: data.minPrice,
        maxPrice: data.maxPrice,
      };
    } catch (error) {
      console.error('Error fetching prices:', error);
      alert('⚠️ No se pudieron cargar los precios actuales');
    }
  };

  onMounted(() => {
    fetchPriceData();
  });

  // Computed que calcula el precio actual según el rango horario de la data
  const actualPrice = computed(() => {
    if (!priceData.value.prices || priceData.value.prices.length === 0) {
      return priceData.value.currentPrice;
    }
    const currentHour = new Date().getHours();
    // Busca en el array de precios el objeto cuyo rango horario incluya la hora actual
    const matchingPrice = priceData.value.prices.find(item => {
      if (!item.hour) return false;
      const [startStr, endStr] = item.hour.split(' - ');
      const startHour = parseInt(startStr.split(':')[0]);
      const endHour = parseInt(endStr.split(':')[0]);
      // Rango dentro del mismo día
      if (startHour < endHour) {
        return currentHour >= startHour && currentHour < endHour;
      } else {
        // Rango que abarca medianoche (ejemplo "23:00 - 00:00")
        return currentHour >= startHour || currentHour < endHour;
      }
    });
    return matchingPrice ? matchingPrice.price : priceData.value.currentPrice;
  });

  const formattedPrices = computed(() => {
    return priceData.value.prices.map(item => ({
      ...item,
      price: parseFloat(item.price.toFixed(4))
    }));
  });

  return { priceData, fetchPriceData, actualPrice,formattedPrices };
}

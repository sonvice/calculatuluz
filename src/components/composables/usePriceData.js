import { ref, onMounted } from 'vue';

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

  return { priceData, fetchPriceData };
}

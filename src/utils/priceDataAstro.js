export function usePriceData() {
    const priceData = {
      currentPrice: null,
      lastUpdated: null,
      averagePrice: null,
      previousAverage: null,
      prices: [],
      minPrice: null,
      maxPrice: null
    };
  
    let loading = true;
  
    async function fetchPriceData() {
        try {
          // ✅ Evita usar `window` en el servidor
          const response = await fetch('/api/prices', {
            headers: { Accept: 'application/json' },
          });
          if (!response.ok) throw new Error(`Error ${response.status}`);
          const data = await response.json();
    
          priceData.currentPrice = data.currentPrice;
          priceData.averagePrice = data.averagePrice;
          priceData.previousAverage = data.previousAverage;
          priceData.lastUpdated = new Date().toISOString();
          priceData.prices = data.prices;
          priceData.minPrice = data.minPrice;
          priceData.maxPrice = data.maxPrice;
        } catch (error) {
          console.error('Error fetching prices:', error);
        } finally {
          loading = false;
        }
      }
  
    function getActualPrice() {
      if (!priceData.prices || priceData.prices.length === 0) {
        return priceData.currentPrice;
      }
  
      const currentHour = new Date().getHours();
      const matchingPrice = priceData.prices.find(item => {
        if (!item.hour) return false;
        const [startStr, endStr] = item.hour.split(' - ');
        const startHour = parseInt(startStr.split(':')[0]);
        const endHour = parseInt(endStr.split(':')[0]);
  
        if (startHour < endHour) {
          return currentHour >= startHour && currentHour < endHour;
        } else {
          return currentHour >= startHour || currentHour < endHour;
        }
      });
  
      return matchingPrice ? matchingPrice.price : priceData.currentPrice;
    }
  
    function getFormattedPrices() {
      return priceData.prices.map(item => ({
        ...item,
        price: parseFloat(item.price.toFixed(4)),
      }));
    }
  
    return {
      priceData,
      loading,
      fetchPriceData,
      getActualPrice,
      getFormattedPrices,
    };
  }
  
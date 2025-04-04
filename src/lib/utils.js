export function processData(data) {
    // Implementa la lógica real de transformación de datos
    return {
      currentPrice: data.indicator.values[0].value / 1000, // Ejemplo
      hourlyPrices: data.indicator.values.map(v => ({
        time: v.datetime,
        price: v.value / 1000
      })),
      lastUpdated: new Date().toISOString()
    };
  }
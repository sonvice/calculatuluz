// Datos históricos de precios medios por mes
const HISTORICAL_PRICES = {
    default: 0.15,
    '2024': {
      '01': 0.142, // Enero
      '02': 0.138, // Febrero
      // ... completar con datos reales
    }
  };
  
  export function getHistoricalAverage() {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    return HISTORICAL_PRICES[year]?.[month] || HISTORICAL_PRICES.default;
  }
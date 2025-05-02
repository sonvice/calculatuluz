<template>
  <header class="bg-primary-900">
    <div class="container">
      <div class="header-price py-space-s text-primary-100 text-center">
        <div class="d-flex align-center">
          <img 
            src="/images/light_bulb.png" 
            width="40" 
            alt="light_bulb" 
            class="header-price__logo" 
          />
          <div class="d-flex">
            <div class="current-price">
              <span class="fw-700">Precio actual: </span>
              <span class="header-price__price">{{ formattedCurrentPrice }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { usePriceData } from '../utils/usePriceData.js'; // Ajusta la ruta según corresponda

const { priceData } = usePriceData();

const formatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

// Calcula el precio actual en función del rango horario de la data de la API
const currentPriceFromData = computed(() => {
  // Si no hay precios, usamos el currentPrice por defecto
  if (!priceData.value.prices || !priceData.value.prices.length) {
    return priceData.value.currentPrice;
  }

  const currentHour = new Date().getHours();

  // Busca el objeto cuyo rango horario contenga la hora actual
  const matchingPrice = priceData.value.prices.find(item => {
    // Suponemos que item.hour es un string tipo "HH:MM - HH:MM"
    if (!item.hour) return false;
    const [startStr, endStr] = item.hour.split(' - ');
    const startHour = parseInt(startStr.split(':')[0]);
    const endHour = parseInt(endStr.split(':')[0]);

    // Caso normal: rango dentro del mismo día
    if (startHour < endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      // Rango que abarca medianoche (ej. "23:00 - 00:00")
      return currentHour >= startHour || currentHour < endHour;
    }
  });

  return matchingPrice ? matchingPrice.price : priceData.value.currentPrice;
});

// Formateadores para mostrar los valores, con valores por defecto si la data aún no está disponible
const formattedCurrentPrice = computed(() => formatter.format(currentPriceFromData.value));
const formattedAveragePrice = computed(() => formatter.format(priceData.value.averagePrice || 0));
const formattedMinPrice = computed(() => {
  const min = priceData.value.minPrice;
  return min && min.value != null ? formatter.format(min.value) : '';
});
const formattedMaxPrice = computed(() => {
  const max = priceData.value.maxPrice;
  return max && max.value != null ? formatter.format(max.value) : '';
});

const formattedLastUpdated = computed(() => {
  const date = new Date(priceData.value.lastUpdated);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});
</script>

<style scoped>
.header-price {
  padding: 1rem 0;
}

.price-stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.9rem;
}

.min-price .stat-value {
  color: #48bb78; /* Verde para precios mínimos */
}

.max-price .stat-value {
  color: #f56565; /* Rojo para precios máximos */
}

.time-range {
  font-size: 0.8rem;
  opacity: 0.8;
}

.last-updated {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-top: 0.25rem;
}
</style>



  
  <style scoped>
  
  .header-price {
    padding: 1rem 0;
  }
  

  
  .price-stat {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.9rem;
  }
  
  .min-price .stat-value {
    color: #48bb78; /* Verde para precios mínimos */
  }
  
  .max-price .stat-value {
    color: #f56565; /* Rojo para precios máximos */
  }
  
  .time-range {
    font-size: 0.8rem;
    opacity: 0.8;
  }
  
  .last-updated {
    font-size: 0.85rem;
    opacity: 0.9;
    margin-top: 0.25rem;
  }

  </style>
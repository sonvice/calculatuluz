<template>
  <header class="bg-primary-900">
    <div class="container">
      <div class="header-price py-space-s text-primary-100 text-center">
        <div class="d-flex align-center">
          <img 
            src="/images/light_bulb.png" 
            width="40" 
            alt="light_bulb" 
            class="header-price__logo mr-space-xs" 
          />
          <div class="d-flex">
            <div class="current-price">
              <span class="fw-700">Precio actual: </span>
              <span class="header-price__price">{{ formattedCurrentPrice }}</span>
            </div>
            <div class="stats-container d-flex">
              <div class="price-stat">
                <span class="fw-500">Media: </span>
                <span class="stat-value">{{ formattedAveragePrice }}</span>
              </div>
              <div class="price-stat min-price">
                <span class="fw-500">Mín: </span>
                <span class="stat-value">{{ formattedMinPrice }}</span>
                <span class="time-range">({{ priceData.minPrice.timeRange }})</span>
              </div>
              <div class="price-stat max-price">
                <span class="fw-500">Máx: </span>
                <span class="stat-value">{{ formattedMaxPrice }}</span>
                <span class="time-range">({{ priceData.maxPrice.timeRange }})</span>
              </div>
            </div>
            <div class="last-updated fw-500">
              Actualizado: {{ formattedLastUpdated }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const priceData = ref({
  currentPrice: 0,
  averagePrice: 0,
  minPrice: { value: 0, timeRange: '' },
  maxPrice: { value: 0, timeRange: '' },
  lastUpdated: new Date().toISOString()
});

const formatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

// Formateadores
const formattedCurrentPrice = computed(() => formatter.format(priceData.value.currentPrice));
const formattedAveragePrice = computed(() => formatter.format(priceData.value.averagePrice));
const formattedMinPrice = computed(() => formatter.format(priceData.value.minPrice.value));
const formattedMaxPrice = computed(() => formatter.format(priceData.value.maxPrice.value));

// Usamos la hora actual del cliente para el "lastUpdated"
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

// Cargar datos de la API
onMounted(async () => {
  try {
    const response = await fetch('/api/prices');
    if (!response.ok) throw new Error('Error en la respuesta de la API');

    const data = await response.json();
    // Asignamos los datos recibidos...
    priceData.value = {
      currentPrice: data.currentPrice,
      averagePrice: data.averagePrice,
      minPrice: data.minPrice,
      maxPrice: data.maxPrice,
      // Aquí forzamos que la hora de actualización sea la hora actual del usuario
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error cargando datos:', error);
    // Puedes mantener valores por defecto o mostrar un mensaje de error.
  }
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
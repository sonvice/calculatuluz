<script setup>
import { computed } from 'vue';
import { usePriceData } from './composables/usePriceData.js';

const { priceData } = usePriceData();

// Configuración de colores por categoría (mismo esquema que el gráfico)
const categoryColors = {
  'Muy bajo': '#4CAF50',  // Verde
  'Bajo': '#FFC107',      // Amarillo
  'Medio': '#FF9800',     // Naranja
  'Alto': '#F44336'       // Rojo
};

// Formatear fecha de actualización (misma lógica que el gráfico)
const formattedDate = computed(() => {
  if (!priceData.value.lastUpdated) return 'Cargando...';
  
  const options = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  };
  
  return new Date(priceData.value.lastUpdated)
    .toLocaleDateString('es-ES', options)
    .replace(/^\w/, (c) => c.toUpperCase());
});

// Precios formateados con 4 decimales
const formattedPrices = computed(() => {
  return priceData.value.prices?.map(item => ({
    ...item,
    price: item.price.toFixed(4)
  })) || [];
});

// Determinar clase de color para la categoría
const getCategoryColor = (category) => ({
  backgroundColor: categoryColors[category]
});
</script>

<template>
  <div class="price-list-container">
    <div v-if="priceData.prices?.length">
      <h3 class="update-time">Última actualización: {{ formattedDate }}</h3>
      
      <div class="price-list">
        <div 
          v-for="(item, index) in formattedPrices" 
          :key="index" 
          class="price-item"
        >
          <div class="time-range">
            <span 
              class="color-dot" 
              :style="getCategoryColor(item.category)"
            ></span>
            {{ item.hour }}
          </div>
          
          <div class="price-details">
            <span class="price">{{ item.price }} €/kWh</span>
            <span class="category">{{ item.category }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="loading">
      Cargando datos...
    </div>
  </div>
</template>

<style scoped>
.price-list-container {
  padding: 1rem;
}

.update-time {
  color: #f5f5f5;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.price-list {
  display: grid;
  gap: 0.75rem;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.price-item:hover {
  transform: translateY(-2px);
}

.time-range {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #f5f5f5;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.price-details {
  text-align: right;
}

.price {
  display: block;
  color: #f5f5f5;
  font-weight: 500;
}

.category {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.loading {
  text-align: center;
  color: #f5f5f5;
  padding: 2rem;
}

@media (max-width: 480px) {
  .price-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .price-details {
    text-align: left;
    width: 100%;
    display: flex;
    justify-content: space-between;
  }
}
</style>
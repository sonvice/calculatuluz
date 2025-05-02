<script setup>
import { computed } from 'vue';
import { usePriceData } from '../utils/usePriceData.js';
import PriceCard from './PriceCard.vue';

const { priceData } = usePriceData();


// Mantenemos los mismos colores y categorías que el gráfico
const categoryColors = {
  'Muy bajo': '#4CAF50',
  'Bajo': '#FFC107',
  'Medio': '#FF9800',
  'Alto': '#F44336'
};

// Agrupamos los precios por categoría (misma lógica que la leyenda del gráfico)
const groupedData = computed(() => {
  if (!priceData.value.prices) return {};
  
  return priceData.value.prices.reduce((acc, price) => {
    const category = price.category;
    if (!acc[category]) {
      acc[category] = {
        prices: [],
        min: Infinity,
        max: -Infinity,
        count: 0
      };
    }
    
    acc[category].prices.push(price.price);
    acc[category].min = Math.min(acc[category].min, price.price);
    acc[category].max = Math.max(acc[category].max, price.price);
    acc[category].count++;
    
    return acc;
  }, {});
});

// Obtenemos el precio actual (misma lógica que el gráfico)
const currentPrice = computed(() => {
  if (!priceData.value.prices) return null;
  
  const currentHour = new Date().getHours();
  const priceEntry = priceData.value.prices.find(p => {
    const [start] = p.hour.split(' - ');
    const hour = parseInt(start.split(':')[0]);
    return hour === currentHour;
  });
  
  return priceEntry?.price;
});
</script>

<template>
  <div class="cards-container">
    <template v-if="priceData.prices?.length">
      <PriceCard
        v-for="(category, name) in groupedData"
        :key="name"
        :category="name"
        :color="categoryColors[name]"
        :hours-count="category.count"
        :min-price="category.min"
        :max-price="category.max"
        :current-price="currentPrice"
      />
    </template>
    
    <div v-else class="loading-message">
      Cargando datos de precios...
    </div>
  </div>
</template>

<style scoped>
.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.loading-message {
  color: #fff;
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-family: 'Montserrat Variable', sans-serif;
}

@media (max-width: 768px) {
  .cards-container {
    grid-template-columns: 1fr;
  }
}
</style>
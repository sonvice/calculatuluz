<!-- PriceCard.vue -->
<script setup>
defineProps({
  category: String,
  color: String,
  hoursCount: Number,
  minPrice: Number,
  maxPrice: Number,
  currentPrice: Number
});
</script>

<template>
  <div class="card">
    <div class="color-indicator" :style="{ backgroundColor: color }"></div>
    
    <div class="content">
      <div class="header">
        <h3 class="category">{{ category }}</h3>
        <span v-if="currentPrice" class="current-price">
           {{ currentPrice.toFixed(3) }} €/kWh
        </span>
      </div>
      
      <div class="stats">
        <div class="stat">
          <span class="label">Horas</span>
          <span class="value">{{ hoursCount }}</span>
        </div>
        
        <div class="stat">
          <span class="label">Rango</span>
          <span class="value">
            {{ minPrice.toFixed(3) }} - {{ maxPrice.toFixed(3) }} <small>€/kWh</small>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: var(--primary-900);
  border-radius: 12px;
  padding: 1.2rem;
  backdrop-filter: blur(8px);
  display: flex;
  gap: 1rem;
  min-width: 250px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.color-indicator {
  width: 6px;
  border-radius: 4px;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.category {
  margin: 0;
  font: 600 1.1rem/1.2 'Montserrat Variable', sans-serif;
  color: #f5f5f5;
  text-transform: capitalize;
}

.current-price {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font: 500 0.9rem/1 'Montserrat Variable', sans-serif;
}

.stats {
  display: flex;
  gap: 1.5rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label {
  font-weight: 400;
  font-size: var(--size--1);
  color: #a0a0a0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  font-weight: 500;
  color: #f5f5f5;
}

@media (max-width: 768px) {
  .card {
    min-width: 200px;
    padding: 1rem;
  }
  
  .stats {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .category {
    font-size: 1rem;
  }
  
  .value {
    font-size: 1rem;
  }
}
</style>
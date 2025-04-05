<template>
    <div class="consumption-results">
      <h2 class="results-title">Resultados</h2>
      <small v-if="priceData.lastUpdated" class="price-info">
        Precio actualizado: {{ formattedDate }} ({{ priceData.currentPrice?.toFixed(4) }} €/kWh)
      </small>
      
      <div class="results-grid">
        <BaseResultItem
          label="Consumo Diario"
          :value="results.dailyKwh"
          unit="kWh"
        />
        <BaseResultItem
          label="Costo Diario"
          :value="results.dailyCost"
          unit="€"
        />
        <BaseResultItem
          label="Costo Mensual"
          :value="results.monthlyCost"
          unit="€"
        />
        <BaseResultItem
          label="Costo Anual"
          :value="results.annualCost"
          unit="€"
        />
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import BaseResultItem from '../base/BaseResultItem.vue';
  
  defineProps<{
    results: {
      dailyKwh: string;
      dailyCost: string;
      monthlyCost: string;
      annualCost: string;
    };
    priceData: {
      currentPrice: number;
      lastUpdated: Date;
    };
    formattedDate: string;
  }>();
  </script>
  
  <style scoped>
  .consumption-results {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #f8f9fa;
    border-radius: 8px;
  }
  
  .results-title {
    color: var(--color-accent-500);
    margin-bottom: 0.5rem;
  }
  
  .price-info {
    display: block;
    color: #666;
    margin-bottom: 1.5rem;
  }
  
  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.5rem;
  }
  </style>
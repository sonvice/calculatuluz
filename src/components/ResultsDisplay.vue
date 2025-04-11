<template>
    <div class="results">
      <h2 class="text-size-1 text-accent-500 mt-space-l">Resultados</h2>
      <small v-if="lastUpdated" class="text-size--2 text-primary-200">
        Precio actualizado: {{ formattedDate }} ({{ currentPrice.toFixed(4) }} €/kWh)
      </small>
      <div class="d-flex mt-space-s">
        <div>
          <h3 class="text-size--1">Consumo Diario</h3>
          <span class="text-size-2 fw-700 text-neutral-50">{{ results.dailyKwh }} kWh</span>
        </div>
        <div>
          <h3 class="text-size--1">Costo Diario</h3>
          <span class="text-size-2 fw-700 text-neutral-50">{{ results.dailyCost }} €</span>
        </div>
        <div>
          <h3 class="text-size--1">Costo Mensual</h3>
          <span class="text-size-2 fw-700 text-neutral-50">{{ results.monthlyCost }} €</span>
        </div>
        <div>
          <h3 class="text-size--1">Costo Anual</h3>
          <span class="text-size-2 fw-700 text-neutral-50">{{ results.annualCost }} €</span>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  
  const props = defineProps({
    results: {
      type: Object,
      required: true
    },
    lastUpdated: {
      type: String,
      default: ''
    },
    currentPrice: {
      type: Number,
      default: 0
    }
  });
  
  const formattedDate = computed(() => {
    if (!props.lastUpdated) return '';
    const date = new Date(props.lastUpdated);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  });
  </script>
  
  
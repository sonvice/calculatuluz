<template>
    <div class="results">
      <h2 class="text-size-1 text-accent-500 mt-space-l d-flex">Resultados <span class="text-size--1 fw-500 text-neutral-50">(Costos incluyen IVA 21%)</span></h2>
  
      <p v-if="lastUpdated" class="text-size--2 text-primary-200 mt-space-3xs">
        Precio actual: <span class="fw-700">{{ currentPrice.toFixed(3) }} €/kWh</span>  | Actualizado: {{ formattedDate }}
      </p>
      <div class="d-flex mt-space-m">
        <div>
          <h3 class="text-size--1">Consumo Diario</h3>
          <span class="text-size-2 fw-700 text-neutral-50">{{ results.dailyKwh }} kWh</span>
        </div>
        <div>
          <h3 class="text-size--1">Costo Diario</h3>
          <span class="text-size-2 fw-700 text-neutral-50">{{ formattedDailyCost }}</span>
        </div>
        <div>
          <h3 class="text-size--1">Costo Mensual</h3>
          <span class="text-size-2 fw-700 text-neutral-50">{{ formattedMonthlyCost }}</span>
        </div>
        <div>
          <h3 class="text-size--1">Costo Anual</h3>
          <span class="text-size-2 fw-700 text-neutral-50">{{ formattedAnnualCost }}</span>
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

  // Instancia único del formateador de moneda
const euroFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

// Computed para costes formateados
const formattedDailyCost = computed(() =>
  euroFormatter.format(Number(props.results.dailyCost) || 0)
);
const formattedMonthlyCost = computed(() =>
  euroFormatter.format(Number(props.results.monthlyCost) || 0)
);
const formattedAnnualCost = computed(() =>
  euroFormatter.format(Number(props.results.annualCost) || 0)
);
  </script>
  
  
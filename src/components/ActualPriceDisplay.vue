<template>
    <small v-if="priceData.lastUpdated" class="text-size--2 text-primary-200">
      Precio actualizado: {{ formattedDate }} ({{ formattedActualPrice }} €/kWh)
    </small>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  import { usePriceData } from '../utils/usePriceData.js'; // Ajusta la ruta según tu estructura
  
  const { priceData, actualPrice } = usePriceData();
  
  const formattedDate = computed(() => {
    if (!priceData.value.lastUpdated) return '';
    const date = new Date(priceData.value.lastUpdated);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  });
  
  const formattedActualPrice = computed(() => {
    // Aseguramos que actualPrice sea numérico y lo formateamos con 4 decimales
    return actualPrice.value != null ? actualPrice.value.toFixed(4) : '0.0000';
  });
  </script>
  
  
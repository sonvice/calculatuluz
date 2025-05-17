<!-- src/islands/GlobalPriceSwitch.vue -->
<template>
    <div class="flex items-center mb-6">
      <button
        @click="toggleDay"
        :disabled="!canToggle"
        class="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-gray-400"
      >
        {{ day === 'today' ? 'Ver precios de mañana' : 'Ver precios de hoy' }}
      </button>
      <span v-if="!canToggle" class="ml-2 text-sm text-gray-500">
        Precios mañana disponibles a las 20:05
      </span>
    </div>
  </template>
  
  <script setup>
  import { useStore } from '@nanostores/vue'
  import { day, priceData } from '../stores/prices.js'
  
  // Convertimos los átomos en reactivos de Vue
  const dayStore       = useStore(day)
  const priceDataStore = useStore(priceData)
  
  // Computed para si podemos alternar
  import { computed } from 'vue'
  const canToggle = computed(() => priceDataStore.tomorrowAvailable)
  
  // Alternar día
  function toggleDay() {
    if (!canToggle.value) return
    day.set(dayStore === 'today' ? 'tomorrow' : 'today')
  }
  </script>
  
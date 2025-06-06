<template>
    <svg 
      :class="arrowClass" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24"
    >
      <!-- Flecha hacia arriba -->
      <path v-if="direction === 'up'" d="M12 4L20 12H14V20H10V12H4L12 4Z"/>
      
      <!-- Flecha hacia abajo -->
      <path v-if="direction === 'down'" d="M12 20L4 12H10V4H14V12H20L12 20Z"/>
      
      <!-- Línea recta (neutral) -->
      <path v-if="direction === 'neutral'" d="M13 11H11V7H13V11ZM13 13H11V17H13V13Z"/>
    </svg>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  
  const props = defineProps({
    value: {
      type: Number,
      default: 0
    }
  });
  
  const direction = computed(() => {
    if (props.value > 0) return 'up';
    if (props.value < 0) return 'down';
    return 'neutral';
  });
  
  const arrowClass = computed(() => {
    return {
      'trend-up': direction.value === 'up',
      'trend-down': direction.value === 'down',
      'trend-neutral': direction.value === 'neutral'
    };
  });
  </script>
  
  <style scoped>
  svg {
    transition: all 0.3s ease;
  }
  
  .trend-up {
    fill: #F44336; /* Verde para tendencia positiva */
  }
  
  .trend-down {
    fill: #4CAF50; /* Rojo para tendencia negativa */
  }
  
  .trend-neutral {
    fill: #FFC107; /* Amarillo para neutral */
  }
  </style>
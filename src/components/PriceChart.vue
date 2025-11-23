<template>
  <div class="chart-container">
    <!-- Estado de carga -->
    <div v-if="$loading.value" class="chart-state">
      <div class="loading-spinner"></div>
      <p class="state-text">Cargando precios de electricidad...</p>
    </div>

    <!-- Estado sin datos -->
    <div v-else-if="!filteredPrices.length" class="chart-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" class="state-icon">
        <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p class="state-text">No hay datos disponibles</p>
      <p class="state-subtext">Intenta aplicar una potencia o verifica tu conexión</p>
    </div>

    <!-- Gráfico -->
    <div v-else class="chart-content">
      <div class="chart-header">
        <h3 class="chart-title">Precio de la electricidad por hora</h3>
        <div v-if="currentHourIndex !== -1" class="current-time-badge">
          <span class="badge-dot"></span>
          Hora actual: {{ prices[currentHourIndex].hour.split(' - ')[0] }}
        </div>
      </div>
      
      <div class="chart-wrapper">
        <Bar :data="chartData" :options="chartOptions" />
      </div>

      <!-- Leyenda personalizada -->
      <div class="custom-legend">
        <button
          v-for="category in categories"
          :key="category"
          @click="toggleCategory(category)"
          :class="['legend-item', { 'legend-item--hidden': hiddenCategories.includes(category) }]"
        >
          <span 
            class="legend-color" 
            :style="{ backgroundColor: categoryColors[category] }"
          ></span>
          <span class="legend-text">{{ category }}</span>
          <span v-if="hiddenCategories.includes(category)" class="legend-hidden-icon">👁️‍🗨️</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useStore } from '@nanostores/vue'
import { priceData, loading } from '../stores/prices.js'
import Bar from './charts/BarChart.js'

const $data = useStore(priceData)
const $loading = useStore(loading)

const prices = computed(() =>
  Array.isArray($data.value.prices) ? $data.value.prices : []
)

const hiddenCategories = ref([])

// Colores mejorados con mejor contraste
const categoryColors = {
  'Muy bajo': '#10b981', // Verde esmeralda
  'Bajo':     '#f59e0b', // Ámbar
  'Medio':    '#f97316', // Naranja
  'Alto':     '#ef4444'  // Rojo
}

// Obtener categorías únicas
const categories = computed(() => 
  [...new Set(prices.value.map(p => p.category))]
)

// Obtener índice de la hora actual
const currentHourIndex = computed(() => {
  const now = new Date()
  const currentHour = now.getHours()
  return prices.value.findIndex(p => {
    const hour = parseInt(p.hour.split(':')[0])
    return hour === currentHour
  })
})

const filteredPrices = computed(() =>
  prices.value.filter(p => !hiddenCategories.value.includes(p.category))
)

const toggleCategory = (category) => {
  if (hiddenCategories.value.includes(category)) {
    hiddenCategories.value = hiddenCategories.value.filter(c => c !== category)
  } else {
    hiddenCategories.value = [...hiddenCategories.value, category]
  }
}

const chartData = computed(() => {
  const visiblePrices = filteredPrices.value
  
  return {
    labels: visiblePrices.map(p => p.hour.split(' - ')[0]),
    datasets: [{
      label: 'Precio (€/kWh)',
      data: visiblePrices.map(p => p.price),
      backgroundColor: visiblePrices.map((p, idx) => {
        const originalIndex = prices.value.indexOf(p)
        const isCurrentHour = originalIndex === currentHourIndex.value
        const color = categoryColors[p.category]
        return isCurrentHour ? color : color + 'CC' // Más opaco para hora actual
      }),
      borderColor: visiblePrices.map((p, idx) => {
        const originalIndex = prices.value.indexOf(p)
        return originalIndex === currentHourIndex.value ? '#ffffff' : 'transparent'
      }),
      borderWidth: visiblePrices.map((p, idx) => {
        const originalIndex = prices.value.indexOf(p)
        return originalIndex === currentHourIndex.value ? 3 : 1
      }),
      barPercentage: 0.85,
      categoryPercentage: 0.9
    }]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 750,
    easing: 'easeInOutQuart'
  },
  interaction: {
    mode: 'index',
    intersect: false
  },
  scales: {
    x: {
      ticks: {
        maxRotation: 45,
        minRotation: 45,
        autoSkip: false,
        color: '#e5e7eb',
        font: {
          family: 'Montserrat Variable, system-ui, sans-serif',
          size: 11,
          weight: '500'
        },
        padding: 5
      },
      grid: { 
        display: false,
        drawBorder: false
      },
      border: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      ticks: { 
        color: '#e5e7eb',
        font: {
          family: 'Montserrat Variable, system-ui, sans-serif',
          size: 12,
          weight: '500'
        },
        padding: 8,
        callback: function(value) {
          return value.toFixed(4)
        }
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.05)',
        drawBorder: false
      },
      border: {
        display: false
      },
      title: {
        display: true,
        text: '€/kWh',
        color: '#f3f4f6',
        font: { 
          size: 13, 
          weight: '600',
          family: 'Montserrat Variable, system-ui, sans-serif'
        },
        padding: { bottom: 10 }
      }
    }
  },
  plugins: {
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#f3f4f6',
      bodyColor: '#d1d5db',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      titleFont: {
        family: 'Montserrat Variable, system-ui, sans-serif',
        size: 13,
        weight: '600'
      },
      bodyFont: {
        family: 'Montserrat Variable, system-ui, sans-serif',
        size: 12,
        weight: '400'
      },
      displayColors: true,
      callbacks: {
        title: (ctx) => {
          const price = prices.value[ctx[0].dataIndex]
          return price ? price.hour : ''
        },
        label: (ctx) => {
          const price = prices.value[ctx.dataIndex]
          if (!price) return []
          
          return [
            `Precio: ${price.price.toFixed(4)} €/kWh`,
            `Categoría: ${price.category}`
          ]
        },
        labelColor: (ctx) => {
          const price = prices.value[ctx.dataIndex]
          return {
            borderColor: 'transparent',
            backgroundColor: price ? categoryColors[price.category] : '#666',
            borderRadius: 3
          }
        }
      }
    },
    legend: {
      display: false // Usamos leyenda personalizada
    }
  }
}))
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  min-height: 500px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Estados de carga y vacío */
.chart-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 450px;
  gap: 16px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--accent-500, #4ade80);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.state-icon {
  color: var(--neutral-400, #9ca3af);
  opacity: 0.6;
}

.state-text {
  color: var(--neutral-200, #e5e7eb);
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.state-subtext {
  color: var(--neutral-400, #9ca3af);
  font-size: 0.875rem;
  margin: 0;
}

/* Contenido del gráfico */
.chart-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.chart-title {
  color: var(--neutral-100, #f3f4f6);
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.01em;
}

.current-time-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(74, 222, 128, 0.15);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 20px;
  color: var(--accent-400, #4ade80);
  font-size: 0.8125rem;
  font-weight: 600;
}

.badge-dot {
  width: 8px;
  height: 8px;
  background: var(--accent-500, #4ade80);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.chart-wrapper {
  flex: 1;
  min-height: 350px;
  position: relative;
}

/* Leyenda personalizada */
.custom-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--neutral-200, #e5e7eb);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.legend-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.legend-item:active {
  transform: translateY(0);
}

.legend-item--hidden {
  opacity: 0.5;
  background: rgba(255, 255, 255, 0.02);
}

.legend-item--hidden .legend-text {
  text-decoration: line-through;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.legend-text {
  font-weight: 600;
}

.legend-hidden-icon {
  font-size: 14px;
  opacity: 0.7;
}

/* Responsive */
@media (max-width: 768px) {
  .chart-container {
    min-height: 450px;
    padding: 16px;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .chart-title {
    font-size: 1rem;
  }

  .current-time-badge {
    font-size: 0.75rem;
    padding: 4px 10px;
  }

  .chart-wrapper {
    min-height: 300px;
  }

  .custom-legend {
    gap: 8px;
  }

  .legend-item {
    padding: 6px 10px;
    font-size: 0.8125rem;
  }

  .legend-color {
    width: 14px;
    height: 14px;
  }
}

@media (max-width: 480px) {
  .chart-container {
    padding: 12px;
    min-height: 400px;
  }

  .chart-wrapper {
    min-height: 250px;
  }
}
</style>
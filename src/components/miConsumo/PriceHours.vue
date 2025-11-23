<script setup>
import { computed, onMounted } from 'vue'
import { useStore } from '@nanostores/vue'
import { priceData } from '../../stores/prices'
import { Clock, Lightbulb, TrendingDown } from 'lucide-vue-next'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// ⚡ Acepta datos iniciales del servidor
const props = defineProps({
  initialData: {
    type: Object,
    default: null
  }
})

const $prices = useStore(priceData)

// ⚡ Si hay datos iniciales, cargarlos inmediatamente
onMounted(() => {
  if (props.initialData && !priceData.get()) {
    priceData.set(props.initialData)
  }
})

// Colores por categoría
const categoryColors = {
  'Muy bajo': '#4CAF50',
  'Bajo': '#FFC107',
  'Medio': '#FF9800',
  'Alto': '#F44336',
}

// Verificar que los datos existen
const sortedHours = computed(() => {
  const prices = $prices.value
  
  if (!prices || !prices.prices || !Array.isArray(prices.prices) || prices.prices.length === 0) {
    return []
  }

  return [...prices.prices]
    .filter(item => item && typeof item.price === 'number' && !isNaN(item.price))
    .sort((a, b) => a.price - b.price)
    .slice(0, 8)
})

// Datos para el gráfico de precios por hora
const priceChartData = computed(() => {
  const prices = $prices.value
  if (!prices?.prices?.length) return null

  const labels = prices.prices.map(p => p.hour.split(' - ')[0])
  const data = prices.prices.map(p => p.price)
  const backgroundColors = prices.prices.map(p => {
    const color = categoryColors[p.category] || categoryColors['Medio']
    return color
  })

  return {
    labels,
    datasets: [{
      label: 'Precio €/kWh',
      data,
      backgroundColor: backgroundColors,
      borderColor: backgroundColors.map(c => c),
      borderWidth: 2
    }]
  }
})

const priceChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(13, 27, 42, 0.9)',
      titleColor: '#e8f1ff',
      bodyColor: '#c8dff5',
      borderColor: 'rgba(168, 197, 228, 0.2)',
      borderWidth: 1,
      callbacks: {
        label: (context) => {
          return `${context.parsed.y.toFixed(4)} €/kWh`
        }
      }
    }
  },
  scales: {
    x: {
      ticks: { 
        color: '#a8c5e4',
        maxRotation: 90,
        minRotation: 45,
        font: { size: 9 }
      },
      grid: { color: 'rgba(168, 197, 228, 0.1)' }
    },
    y: {
      ticks: { 
        color: '#a8c5e4',
        callback: (value) => value.toFixed(3) + ' €'
      },
      grid: { color: 'rgba(168, 197, 228, 0.1)' }
    }
  }
}

const cheapestSlots = computed(() => {
  if (sortedHours.value.length === 0) return []
  
  const slots = []
  let currentSlot = null

  const sorted = [...sortedHours.value].sort((a, b) => {
    const getStartHour = (hourStr) => {
      const match = hourStr.match(/(\d+):00/)
      return match ? parseInt(match[1]) : 0
    }
    return getStartHour(a.hour) - getStartHour(b.hour)
  })

  sorted.forEach(item => {
    const startHour = parseInt(item.hour.split(':')[0])
    
    if (!currentSlot) {
      currentSlot = {
        hour: item.hour,
        startHour: startHour,
        endHour: startHour + 1,
        avgPrice: item.price,
        count: 1,
        prices: [item.price],
        category: item.category
      }
    } else if (startHour === currentSlot.endHour) {
      currentSlot.endHour = startHour + 1
      currentSlot.prices.push(item.price)
      currentSlot.avgPrice = currentSlot.prices.reduce((a, b) => a + b, 0) / currentSlot.prices.length
      currentSlot.count++
    } else {
      slots.push(currentSlot)
      currentSlot = {
        hour: item.hour,
        startHour: startHour,
        endHour: startHour + 1,
        avgPrice: item.price,
        count: 1,
        prices: [item.price],
        category: item.category
      }
    }
  })

  if (currentSlot) slots.push(currentSlot)

  return slots
    .filter(slot => !isNaN(slot.avgPrice))
    .sort((a, b) => a.avgPrice - b.avgPrice)
    .slice(0, 4)
})

function formatSlotTime(startHour, endHour) {
  return `${startHour.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00`
}

function getPriceColor(category) {
  return categoryColors[category] || categoryColors['Medio']
}

function isCurrentHour(hourStr) {
  const now = new Date()
  const currentHour = now.getHours()
  const itemHour = parseInt(hourStr.split(':')[0])
  return currentHour === itemHour
}

const hasData = computed(() => sortedHours.value.length > 0)
</script>

<template>
  <div class="price-hours">
    <!-- Estado de carga/sin datos -->
    <div v-if="!hasData" class="empty-state text-center py-space-l">
      <Clock :size="32" class="empty-icon" />
      <p class="text-neutral-400">Cargando precios...</p>
      <p class="text-neutral-500 text-size--1 mt-space-2xs">
        Los datos se actualizan automáticamente
      </p>
    </div>

    <template v-else>
      <!-- Gráfico de precios del día -->
      <div v-if="priceChartData" class="chart-container mb-space-l">
        <h4 class="chart-title">
          <TrendingDown :size="18" />
          <span>Precios durante el día</span>
        </h4>
        <div class="chart-wrapper">
          <Bar :data="priceChartData" :options="priceChartOptions" />
        </div>
        <div class="legend-grid">
          <div v-for="(color, category) in categoryColors" :key="category" class="legend-item">
            <span class="legend-dot" :style="{ backgroundColor: color }"></span>
            <span class="legend-label">{{ category }}</span>
          </div>
        </div>
      </div>

      <!-- Mejores franjas horarias -->
      <div v-if="cheapestSlots.length > 0" class="mb-space-l">
        <h4 class="section-title text-neutral-200 text-size-0 mb-space-s">
          <Clock :size="18" />
          <span>Mejores franjas para ahorrar</span>
        </h4>
        <div class="slots-list">
          <div 
            v-for="(slot, index) in cheapestSlots" 
            :key="index"
            class="slot-card mb-space-xs"
          >
            <div class="slot-header">
              <span class="slot-rank">#{{ index + 1 }}</span>
              <span class="slot-time text-neutral-100">
                {{ formatSlotTime(slot.startHour, slot.endHour) }}
              </span>
              <span 
                class="color-dot" 
                :style="{ backgroundColor: getPriceColor(slot.category) }"
              ></span>
            </div>
            <div class="slot-footer">
              <span class="price-value text-accent-500">
                {{ slot.avgPrice.toFixed(4) }} €/kWh
              </span>
              <span class="slot-duration text-neutral-400 text-size--1">
                {{ slot.count }}h {{ slot.count > 1 ? 'consecutivas' : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Lista detallada de horas más baratas -->
      <div class="hours-section">
        <h4 class="section-title text-neutral-200 text-size-0 mb-space-s">
          <TrendingDown :size="18" />
          <span>Todas las horas más baratas</span>
        </h4>
        <div class="hours-list">
          <div 
            v-for="(item, index) in sortedHours" 
            :key="index"
            class="hour-item"
            :class="{ 'hour-item--current': isCurrentHour(item.hour) }"
          >
            <div class="hour-time">
              <span 
                class="color-dot" 
                :style="{ backgroundColor: getPriceColor(item.category) }"
              ></span>
              <span class="hour-number text-neutral-100">{{ item.hour }}</span>
              <span v-if="isCurrentHour(item.hour)" class="badge-current">AHORA</span>
            </div>
            <div class="hour-details">
              <div class="hour-price text-accent-500">
                {{ item.price.toFixed(4) }} €/kWh
              </div>
              <div class="hour-category text-neutral-400 text-size--2">
                {{ item.category }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recomendaciones -->
      <div class="recommendations mt-space-m">
        <h4 class="section-title text-neutral-200 text-size-0 mb-space-xs">
          <Lightbulb :size="18" />
          <span>Recomendaciones</span>
        </h4>
        <ul class="tips-list text-neutral-300 text-size--1">
          <li class="mb-space-2xs">Programa la lavadora y lavavajillas en las franjas más baratas</li>
          <li class="mb-space-2xs">Carga dispositivos electrónicos durante las horas valle</li>
          <li v-if="cheapestSlots.length > 0" class="mb-space-2xs">
            La mejor franja hoy es de 
            <strong class="text-accent-500">
              {{ formatSlotTime(cheapestSlots[0].startHour, cheapestSlots[0].endHour) }}
            </strong>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Estilos sin cambios */
.price-hours {
  display: flex;
  flex-direction: column;
}

.empty-state {
  border: 1px dashed var(--primary-700);
  border-radius: 8px;
}

.empty-icon {
  color: #a8c5e4;
  margin-bottom: 12px;
}

.chart-container {
  background: rgba(13, 27, 42, 0.5);
  border: 1px solid rgba(168, 197, 228, 0.2);
  border-radius: 10px;
  padding: 16px;
}

.chart-title {
  margin: 0 0 12px 0;
  color: #e8f1ff;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-wrapper {
  height: 250px;
}

.legend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(168, 197, 228, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-label {
  color: #c8dff5;
}

.section-title {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.slots-list {
  display: flex;
  flex-direction: column;
}

.slot-card {
  background: rgba(74, 123, 167, 0.08);
  border: 1px solid var(--primary-700);
  border-radius: 8px;
  padding: 12px;
}

.slot-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.slot-rank {
  background: var(--accent-500);
  color: var(--primary-900);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  min-width: 28px;
  text-align: center;
}

.slot-time {
  flex: 1;
  font-weight: 600;
  font-size: 0.95rem;
}

.slot-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-value {
  font-weight: 700;
  font-size: 1.05rem;
}

.slot-duration {
  font-size: 0.75rem;
}

.hours-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hour-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(13, 27, 42, 0.3);
  border-radius: 6px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.hour-item:hover {
  background: rgba(74, 123, 167, 0.08);
  border-color: var(--primary-700);
}

.hour-item--current {
  background: rgba(95, 212, 167, 0.12);
  border-color: var(--accent-500);
}

.hour-time {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hour-number {
  font-weight: 600;
  min-width: 90px;
}

.badge-current {
  background: var(--accent-500);
  color: var(--primary-900);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
}

.hour-details {
  text-align: right;
}

.hour-price {
  font-weight: 600;
  font-size: 0.9rem;
}

.hour-category {
  margin-top: 2px;
}

.recommendations {
  background: rgba(74, 123, 167, 0.05);
  padding: 16px;
  border-radius: 8px;
  border-left: 3px solid var(--accent-500);
}

.tips-list {
  margin: 0;
  padding-left: 20px;
  line-height: 1.7;
}

.tips-list li {
  margin-bottom: 4px;
}

@media (max-width: 768px) {
  .slot-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .hour-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .hour-details {
    text-align: left;
    width: 100%;
    display: flex;
    justify-content: space-between;
  }
  
  .chart-wrapper {
    height: 200px;
  }
  
  .legend-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
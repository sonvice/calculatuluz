<!-- src/components/PriceChart.vue -->
<script setup>
import { ref, computed, watch } from 'vue'
import { BarChart } from 'vue-chart-3'
import { Chart, registerables } from 'chart.js'
import { usePriceData } from '../utils/usePriceData.js'
Chart.register(...registerables)

// 1. Parámetro día (today / tomorrow)
const day = ref('today')

// 2. Hook para obtener datos según `day`
const { priceData, fetchPriceData } = usePriceData(day)

// 3. Refetch al cambiar `day`
watch(day, () => {
  fetchPriceData()
})

// 4. Control del switch
const showTomorrow       = ref(false)
const canToggleTomorrow  = computed(() => priceData.value.tomorrowAvailable)

// 5. Formateo de fecha
const formattedDate = computed(() => {
  if (!priceData.value.lastUpdated) return 'Cargando...'
  const options = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }
  return new Date(priceData.value.lastUpdated)
    .toLocaleDateString('es-ES', options)
    .replace(/^\w/, c => c.toUpperCase())
})

// 6. Leyenda / filtros
const hiddenCategories = ref([])
const categoryColors = {
  'Muy bajo': '#4CAF50',
  'Bajo':     '#FFC107',
  'Medio':    '#FF9800',
  'Alto':     '#F44336'
}

// 7. Datos filtrados y chart
const filteredPrices = computed(() =>
  priceData.value.prices.filter(p => !hiddenCategories.value.includes(p.category))
)

const chartData = computed(() => ({
  labels: filteredPrices.value.map(p => p.hour.split(' - ')[0]),
  datasets: [{
    label: 'Precio (€/kWh)',
    data: filteredPrices.value.map(p => p.price),
    backgroundColor: filteredPrices.value.map(p => categoryColors[p.category]),
    borderColor: '#333',
    borderWidth: 1,
    barPercentage: 0.9,
    categoryPercentage: 0.9
  }]
}))

// 8. Opciones del gráfico
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      ticks: { maxRotation: 45, minRotation: 45, autoSkip: false },
      grid: { display: false }
    },
    y: {
      beginAtZero: true,
      title: { display: true, text: '€/kWh' }
    }
  },
  plugins: {
    title: {
      display: false,
      text: [
        'Evolución de Precios Horarios de Electricidad',
        `Última actualización: ${formattedDate.value}`
      ],
      padding: 10,
      font: { size: 14, family: 'Montserrat Variable', weight: 'bold' },
      color: '#f5f5f5'
    },
    tooltip: {
      callbacks: {
        title: ctx => priceData.value.prices[ctx[0].dataIndex].hour,
        label: ctx => {
          const p = priceData.value.prices[ctx.dataIndex]
          return [`Precio: ${p.price.toFixed(4)} €/kWh`, `Categoría: ${p.category}`]
        }
      }
    },
    legend: {
      display: true,
      position: 'top',
      labels: {
        color: '#f5f5f5',
        font: { family: 'Montserrat Variable', size: 12, weight: '500' },
        usePointStyle: true,
        generateLabels: () => {
          const cats = [...new Set(priceData.value.prices.map(p => p.category))]
          return cats.map(cat => ({
            text: hiddenCategories.value.includes(cat) ? `(${cat})` : cat,
            fillStyle: categoryColors[cat],
            strokeStyle: 'transparent',
            hidden: hiddenCategories.value.includes(cat),
            extra: cat
          }))
        }
      },
      onClick: (e, item) => {
        const cat = item.extra
        hiddenCategories.value = hiddenCategories.value.includes(cat)
          ? hiddenCategories.value.filter(c => c !== cat)
          : [...hiddenCategories.value, cat]
      }
    }
  }
}))

// 9. Handler del botón
function toggleDay() {
  if (!canToggleTomorrow.value) return
  showTomorrow.value = !showTomorrow.value
  day.value = showTomorrow.value ? 'tomorrow' : 'today'
}
</script>

<template>

  <!-- GRÁFICO -->
  <div class="chart-container">
      <!-- SWITCH -->
  <div class="flex items-center mb-4">
    <button
    @click="toggleDay"
    :disabled="!canToggleTomorrow"
    class="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-gray-400"
  >
    {{ showTomorrow ? 'Ver precios de hoy' : 'Ver precios de mañana' }}
  </button>
    <span v-if="!canToggleTomorrow" class="ml-2 text-sm text-gray-500">
      Precios mañana disponibles a las 20:25
    </span>
  </div>

    <div v-if="priceData.prices.length && (!showTomorrow || canToggleTomorrow)">
      <BarChart :chart-data="chartData" :options="chartOptions" />
    </div>
    <div v-else>
      <template v-if="showTomorrow && !canToggleTomorrow">
        Mañana aún no disponible.
      </template>
      <template v-else>
        Cargando gráfico...
      </template>
    </div>
  </div>
</template>

<style scoped>
.chart-container { position: relative; width: 100%; }
@media (max-width: 768px) {
  .chart-container { height: 400px; }
}
</style>

<!-- src/components/PriceChart.vue -->
<template>
  <div class="chart-container">
    <!-- GRÁFICO / Estados -->
    <div v-if="$loading.value" class="text-center py-8">
      Cargando gráfico…
    </div>
    <div v-else-if="!filteredPrices.length" class="text-center py-8">
      Sin datos para mostrar.
    </div>
    <div v-else class="chart-container">
      <BarChart :chart-data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from '@nanostores/vue'
import {  priceData, loading } from '../stores/prices.js'
import { BarChart } from 'vue-chart-3'
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables)

// 1. Suscribirse a los atoms
const $data = useStore(priceData)
const $loading = useStore(loading)

// 3. Asegurar que prices es siempre array
const prices = computed(() => Array.isArray($data.value.prices) ? $data.value.prices : [])

// 4. Filtrar categorías ocultas
const hiddenCategories = ref([])
const categoryColors = {
  'Muy bajo': '#4CAF50',
  'Bajo':     '#FFC107',
  'Medio':    '#FF9800',
  'Alto':     '#F44336'
}
const filteredPrices = computed(() =>
  prices.value.filter(p => !hiddenCategories.value.includes(p.category))
)

const chartData = computed(() => {
  const visiblePrices = prices.value.filter(p => !hiddenCategories.value.includes(p.category))
  
  return {
    labels: visiblePrices.map(p => p.hour.split(' - ')[0]),
    datasets: [{
      label: 'Precio (€/kWh)',
      data: visiblePrices.map(p => p.price),
      backgroundColor: visiblePrices.map(p => categoryColors[p.category]),
      borderColor: '#333',
      borderWidth: 1,
      barPercentage: 0.9,
      categoryPercentage: 0.9
    }]
  }
})



// 6. Formateo fecha
const formattedDate = computed(() => {
  const lu = $data.value.lastUpdated
  if (!lu) return 'Cargando...'
  return new Date(lu)
    .toLocaleString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    })
    .replace(/^\w/, c => c.toUpperCase())
})



// 7. chartOptions
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
        title: ctx => prices.value[ctx[0].dataIndex]?.hour ?? '',
        label: ctx => {
          const p = prices.value[ctx.dataIndex]
          return p
            ? [`Precio: ${p.price.toFixed(4)} €/kWh`, `Categoría: ${p.category}`]
            : []
        }
      }
    },
    legend: {
      display: true,
      position: 'top',
      labels: {
        color: '#f5f5f5',
        font: { family: 'Montserrat Variable', size: 13, weight: '500'},
        usePointStyle: true,
        generateLabels: (chart) => {
          const cats = [...new Set(prices.value.map(p => p.category))]
          return cats.map(cat => ({
            text: hiddenCategories.value.includes(cat) ? `(${cat})` : cat,
            fillStyle: categoryColors[cat],
            strokeStyle: 'transparent',
            hidden: hiddenCategories.value.includes(cat),
            extra: cat,
          }))
        }
      },
      onClick: (e, item) => {
        const cat = item.extra
        hiddenCategories.value = hiddenCategories.value.includes(cat)
          ? hiddenCategories.value.filter(c => c !== cat)
          : [...hiddenCategories.value, cat]
      },
      
    }
  }
}))



</script>



<style scoped>
.chart-container { position: relative; width: 100%; }
@media (max-width: 768px) {
  .chart-container { height: 400px; }
}
</style>

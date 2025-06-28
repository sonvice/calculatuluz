<!-- src/components/PriceChart.vue -->
<template>
  <div class="chart-container">
    <div v-if="$loading.value" class="text-center py-8">
      Cargando gráfico…
    </div>
    <div v-else-if="!filteredPrices.length" class="text-center py-8">
      Sin datos para mostrar.
    </div>
    <div v-else class="chart-content">
      <Bar :data="chartData" :options="chartOptions" />
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
  const visiblePrices = filteredPrices.value
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


const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      ticks: {
        maxRotation: 45,
        minRotation: 45,
        autoSkip: false,
        color: '#f5f5f5'
      },
      grid: { display: false }
    },
    y: {
      beginAtZero: true,
      ticks: { color: '#f5f5f5' },
      title: {
        display: true,
        text: '€/kWh',
        color: '#f5f5f5',
        font: { size: 14, weight: '600' }
      }
    }
  },
  plugins: {
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
      onHover: (e, item, legend) => {
        e.native.target.style.cursor = 'pointer'
      },
      onLeave: (e, item, legend) => {
        e.native.target.style.cursor = 'default'
      },
      labels: {
        color: '#f5f5f5',
        font: { family: 'Montserrat Variable', size: 13, weight: '500' },
        usePointStyle: true,
        generateLabels: (chart) => {
          const cats = [...new Set(prices.value.map(p => p.category))]
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
    },
    title: {
      display: false,
      padding: 10,
      font: { size: 14, family: 'Montserrat Variable', weight: 'bold' },
      color: '#f5f5f5'
    }
  }
}))
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 500px;
}
.chart-content{
height: 100%;}
@media (max-width: 768px) {
  .chart-container {
    height: 400px;
  }
}
</style>

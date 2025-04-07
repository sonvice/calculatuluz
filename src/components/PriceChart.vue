<script setup>
import { ref, computed } from 'vue'
import { BarChart } from 'vue-chart-3'
import { Chart, registerables } from 'chart.js'
import { usePriceData } from './composables/usePriceData.js'

Chart.register(...registerables)

// Utilizar el composable para obtener los datos de precios
const { priceData } = usePriceData()

// Computed para formatear la fecha de actualización
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
    .replace(/^\w/, (c) => c.toUpperCase())
})

// Estado para controlar las categorías ocultas en la leyenda
const hiddenCategories = ref([])

// Configuración de colores por categoría
const categoryColors = {
  'Muy bajo': '#4CAF50',  // Verde
  'Bajo': '#FFC107',      // Amarillo
  'Medio': '#FF9800',     // Naranja
  'Alto': '#F44336'       // Rojo
}

// Filtrar los precios según las categorías ocultas
const filteredPrices = computed(() => 
  priceData.value.prices.filter(p => !hiddenCategories.value.includes(p.category))
)

// Datos del gráfico
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

// Opciones del gráfico
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      ticks: {
        maxRotation: 45,
        minRotation: 45,
        autoSkip: false
      },
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: '€/kWh'
      }
    }
  },
  plugins: {
    title: {
      display: true,
      text: [
        'Evolución de Precios Horarios de Electricidad',
        `Última actualización: ${formattedDate.value}`
      ],
      padding: 10,
      font: {
        size: 14,
        family: 'Montserrat Variable',
        weight: 'bold'
      },
      color: '#f5f5f5'
    },
    tooltip: {
      callbacks: {
        title: (context) => priceData.value.prices[context[0].dataIndex].hour,
        label: (context) => {
          const price = priceData.value.prices[context.dataIndex]
          return [
            `Precio: ${price.price.toFixed(4)} €/kWh`,
            `Categoría: ${price.category}`
          ]
        }
      }
    },
    legend: {
      display: true,
      position: 'top',
      labels: {
        color: '#f5f5f5',
        font: {
          family: 'Montserrat Variable',
          size: 12,
          weight: '500'
        },
        usePointStyle: true,
        generateLabels: () => {
          const categories = [...new Set(priceData.value.prices.map(p => p.category))]
          return categories.map(category => ({
            text: hiddenCategories.value.includes(category) ? `(${category})` : category,
            fillStyle: categoryColors[category],
            strokeStyle: 'transparent',
            hidden: hiddenCategories.value.includes(category),
            extra: category // Se guarda la categoría para el callback onClick
          }))
        }
      },
      onClick: (e, legendItem) => {
        const category = legendItem.extra
        hiddenCategories.value = hiddenCategories.value.includes(category)
          ? hiddenCategories.value.filter(c => c !== category)
          : [...hiddenCategories.value, category]
      }
    },
  }
}))
</script>

<template>
  <div class="chart-container">
    <div v-if="priceData.prices.length">
      <BarChart 
        :chart-data="chartData"
        :options="chartOptions"
      />
    </div>
    <div v-else>
      Cargando gráfico...
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  height: 500px;
  width: 100%;
}

@media (max-width: 768px) {
  .chart-container {
    height: 400px;
  }
}
</style>

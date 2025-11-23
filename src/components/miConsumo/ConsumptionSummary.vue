<script setup>
import { computed, watchEffect } from 'vue'
import { useStore } from '@nanostores/vue'
import { appliances, summary, profile } from '../../stores/consumptionStore'
import { priceData } from '../../stores/prices'
import { Zap } from 'lucide-vue-next'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const $appliances = useStore(appliances)
const $profile = useStore(profile)
const $prices = useStore(priceData)

const resumen = computed(() => {
  const list = $appliances.value ?? []
  const userProfile = $profile.value
  const prices = $prices.value

  // Calcular consumo total
  const totalWhDia = list.reduce((acc, a) => acc + (a.watts * a.hours), 0)
  const totalKwhDia = totalWhDia / 1000
  const totalKwhMes = totalKwhDia * 30

  // Precio PVPC (siempre)
  const precioEnergia = prices?.averagePrice || 0.15

  // Calcular costes de energía
  const costeDia = totalKwhDia * precioEnergia
  const costeMes = totalKwhMes * precioEnergia

  // Término de potencia (tarifa 2.0TD)
  const potencia = userProfile.potencia ?? 5.5
  const costePotenciaDia = potencia * 0.068
  const costePotenciaMes = costePotenciaDia * 30

  // Coste total
  const costeTotalDia = costeDia + costePotenciaDia
  const costeTotalMes = costeMes + costePotenciaMes

  return {
    totalWhDia,
    totalKwhDia,
    totalKwhMes,
    costeDia,
    costeMes,
    costePotenciaDia,
    costePotenciaMes,
    costeTotalDia,
    costeTotalMes,
    precioEnergia
  }
})

// Datos para el gráfico de costes
const costChartData = computed(() => {
  return {
    labels: ['Diario', 'Mensual'],
    datasets: [
      {
        label: 'Energía',
        data: [resumen.value.costeDia, resumen.value.costeMes],
        backgroundColor: '#5fd4a7',
        borderColor: '#4ac99a',
        borderWidth: 2
      },
      {
        label: 'Potencia',
        data: [resumen.value.costePotenciaDia, resumen.value.costePotenciaMes],
        backgroundColor: '#4a7ba7',
        borderColor: '#3a6b97',
        borderWidth: 2
      }
    ]
  }
})

const costChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        color: '#c8dff5',
        font: { size: 11 },
        padding: 15
      }
    },
    tooltip: {
      backgroundColor: 'rgba(13, 27, 42, 0.9)',
      titleColor: '#e8f1ff',
      bodyColor: '#c8dff5',
      borderColor: 'rgba(168, 197, 228, 0.2)',
      borderWidth: 1,
      callbacks: {
        label: (context) => {
          return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} €`
        }
      }
    }
  },
  scales: {
    x: {
      stacked: true,
      ticks: { color: '#a8c5e4' },
      grid: { color: 'rgba(168, 197, 228, 0.1)' }
    },
    y: {
      stacked: true,
      ticks: { 
        color: '#a8c5e4',
        callback: (value) => value.toFixed(2) + ' €'
      },
      grid: { color: 'rgba(168, 197, 228, 0.1)' }
    }
  }
}

// Guardar en summary store
watchEffect(() => {
  summary.set({
    totalWhDia: resumen.value.totalWhDia,
    totalKwhDia: resumen.value.totalKwhDia,
    totalKwhMes: resumen.value.totalKwhMes,
    costeDia: resumen.value.costeDia,
    costeMes: resumen.value.costeMes,
    costePotenciaDia: resumen.value.costePotenciaDia,
    costePotenciaMes: resumen.value.costePotenciaMes
  })
})

const hasAppliances = computed(() => ($appliances.value?.length || 0) > 0)
</script>

<template>
  <div class="summary-card">
    <div class="summary-header mb-space-m">
      <div class="title-row">
        <Zap :size="24" class="title-icon" />
        <h2 class="title text-neutral-50 text-size-1">Tu resumen de consumo</h2>
      </div>
      <span class="badge-pvpc">PVPC</span>
    </div>

    <!-- Sin electrodomésticos -->
    <div v-if="!hasAppliances" class="empty-state text-center py-space-l">
      <p class="text-neutral-400">📋 Añade electrodomésticos para ver tu consumo estimado</p>
    </div>

    <!-- Con electrodomésticos -->
    <template v-else>
      <!-- Gráfico de costes -->
      <div class="chart-container mb-space-m">
        <h4 class="chart-title">Desglose de costes (energía + potencia)</h4>
        <div class="chart-wrapper">
          <Bar :data="costChartData" :options="costChartOptions" />
        </div>
      </div>

      <div class="summary-section mb-space-m">
        <h3 class="section-title text-neutral-300 text-size--1 mb-space-xs">Consumo estimado</h3>
        
        <div class="data-row">
          <span class="text-neutral-300">Energía diaria:</span>
          <strong class="text-neutral-50">{{ resumen.totalKwhDia.toFixed(2) }} kWh</strong>
        </div>

        <div class="data-row">
          <span class="text-neutral-300">Energía mensual:</span>
          <strong class="text-neutral-50">{{ resumen.totalKwhMes.toFixed(2) }} kWh</strong>
        </div>
      </div>

      <div class="summary-section">
        <h3 class="section-title text-neutral-300 text-size--1 mb-space-xs">Costes estimados</h3>
        
        <div class="data-row">
          <span class="text-neutral-300">Energía (día):</span>
          <strong class="price-accent">{{ resumen.costeDia.toFixed(2) }} €</strong>
        </div>

        <div class="data-row">
          <span class="text-neutral-400 text-size--1">Potencia (día):</span>
          <span class="text-neutral-400 text-size--1">{{ resumen.costePotenciaDia.toFixed(2) }} €</span>
        </div>

        <div class="data-row highlight">
          <span class="text-neutral-50"><strong>Total diario:</strong></span>
          <strong class="price-large">{{ resumen.costeTotalDia.toFixed(2) }} €</strong>
        </div>

        <div class="separator"></div>

        <div class="data-row">
          <span class="text-neutral-300">Energía (mes):</span>
          <strong class="price-accent">{{ resumen.costeMes.toFixed(2) }} €</strong>
        </div>

        <div class="data-row">
          <span class="text-neutral-400 text-size--1">Potencia (mes):</span>
          <span class="text-neutral-400 text-size--1">{{ resumen.costePotenciaMes.toFixed(2) }} €</span>
        </div>

        <div class="data-row highlight">
          <span class="text-neutral-50"><strong>Total mensual:</strong></span>
          <strong class="price-large">{{ resumen.costeTotalMes.toFixed(2) }} €</strong>
        </div>
      </div>

      <p class="note text-neutral-400 text-size--1 mt-space-m pt-space-s">
        Precio PVPC medio hoy: <strong class="text-accent-500">{{ resumen.precioEnergia.toFixed(4) }} €/kWh</strong>
      </p>

      <p class="disclaimer text-neutral-500 text-size--2 mt-space-xs">
        * Estimación basada en consumo promedio. Los costes reales pueden variar.
      </p>
    </template>
  </div>
</template>

<style scoped>
.summary-card {
  background: linear-gradient(135deg, var(--primary-800) 0%, var(--primary-900) 100%);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid var(--primary-700);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.title-icon {
  color: var(--accent-500);
  flex-shrink: 0;
}

.title {
  margin: 0;
  font-weight: 700;
}

.badge-pvpc {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  background: rgba(74, 167, 123, 0.2);
  color: var(--accent-500);
  flex-shrink: 0;
}

.empty-state {
  border: 1px dashed var(--primary-700);
  border-radius: 8px;
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
}

.chart-wrapper {
  height: 200px;
}

.summary-section {
  margin-bottom: var(--space-m);
}

.section-title {
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.data-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.data-row.highlight {
  margin-top: 8px;
  padding: 12px;
  background: rgba(74, 123, 167, 0.08);
  border-radius: 8px;
  border-left: 3px solid var(--accent-500);
}

.separator {
  height: 1px;
  background: var(--primary-700);
  margin: 16px 0;
}

.price-accent {
  color: var(--accent-500);
  font-size: 1.05rem;
}

.price-large {
  color: var(--accent-500);
  font-size: 1.2rem;
  font-weight: 700;
}

.note {
  padding-top: 16px;
  border-top: 1px solid var(--primary-700);
  line-height: 1.5;
}

.disclaimer {
  opacity: 0.6;
  font-style: italic;
  border-top: none;
  padding-top: 0;
}

@media (max-width: 768px) {
  .summary-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .title-row {
    width: 100%;
  }
  
  .chart-wrapper {
    height: 180px;
  }
}
</style>
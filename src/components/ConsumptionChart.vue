<template>
  <div class="chart-container">
    <div class="chart-header">
      <div class="toggle-container">
        <button 
          class="toggle-btn" 
          :class="{ active: viewMode === 'short' }"
          @click="viewMode = 'short'"
          aria-label="Ver consumo a corto plazo"
        >
          <Zap :size="16" class="icon" />
          <span>Corto Plazo</span>
        </button>
        <button 
          class="toggle-btn" 
          :class="{ active: viewMode === 'long' }"
          @click="viewMode = 'long'"
          aria-label="Ver consumo a largo plazo"
        >
          <CalendarRange :size="16" class="icon" />
          <span>Largo Plazo</span>
        </button>
      </div>
    </div>

    <div class="chart-wrapper">
      <Bar v-if="loaded" :data="chartData" :options="chartOptions" />
    </div>
    
    <p class="text-xs text-center mt-2 text-neutral-400 fade-in">
      {{ viewMode === 'short' 
          ? 'Comparativa de gasto inmediato (Hoy vs Este Mes)' 
          : 'Proyección de gasto acumulado (Este Mes vs Todo el Año)' 
      }}
    </p>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
// IMPORTAMOS LOS ICONOS DE LUCIDE
import { Zap, CalendarRange } from 'lucide-vue-next'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps({
  dailyCost: { type: [Number, String], default: 0 },
  monthlyCost: { type: [Number, String], default: 0 },
  annualCost: { type: [Number, String], default: 0 }
})

const loaded = ref(false)
const viewMode = ref('short') // 'short' (Día/Mes) o 'long' (Mes/Año)

onMounted(() => {
  loaded.value = true
})

// Lógica dinámica de datos
const chartData = computed(() => {
  const isShort = viewMode.value === 'short';
  
  return {
    labels: isShort ? ['Diario', 'Mensual'] : ['Mensual', 'Anual'],
    datasets: [
      {
        label: 'Coste Estimado (€)',
        data: isShort 
          ? [parseFloat(props.dailyCost), parseFloat(props.monthlyCost)]
          : [parseFloat(props.monthlyCost), parseFloat(props.annualCost)],
        
        // Colores: Verde/Azul (Corto) vs Azul/Violeta (Largo)
        backgroundColor: isShort 
          ? ['rgba(74, 222, 128, 0.8)', 'rgba(59, 130, 246, 0.8)'] 
          : ['rgba(59, 130, 246, 0.8)', 'rgba(147, 51, 234, 0.8)'],
        
        borderColor: isShort 
          ? ['#22c55e', '#2563eb'] 
          : ['#2563eb', '#7e22ce'],
          
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.6
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 500
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => {
           let val = context.parsed.y;
           return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        // Formateador simplificado para ejes (ej: 10 €)
        callback: (value) => value + ' €'
      },
      grid: {
        color: 'rgba(200, 200, 200, 0.1)'
      }
    },
    x: {
      grid: { display: false }
    }
  }
}
</script>

<style scoped>
.chart-container {
  width: 100%;
}

.chart-header {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.toggle-container {
  background: var(--neutral-100, #f3f4f6);
  padding: 4px;
  border-radius: 99px;
  display: inline-flex;
  gap: 4px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); /* Pequeña sombra interna para profundidad */
}

.toggle-btn {
  /* Flexbox para alinear icono y texto */
  display: flex;
  align-items: center;
  gap: 8px; /* Espacio entre icono y texto */
  
  padding: 8px 16px;
  border-radius: 99px;
  border: none;
  background: transparent;
  color: var(--neutral-600, #4b5563);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  color: var(--primary-900, #111827);
  background: rgba(255,255,255, 0.5);
}

.toggle-btn.active {
  background: white;
  color: var(--accent-500, #2563eb);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  font-weight: 600;
}

/* Animación sutil para el icono al activarse */
.toggle-btn.active .icon {
  stroke-width: 2.5px; 
}

.chart-wrapper {
  position: relative;
  width: 100%;
  height: 250px;
}

@media (min-width: 768px) {
  .chart-wrapper {
    height: 300px;
  }
}

/* Utilidad simple para fade-in */
.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
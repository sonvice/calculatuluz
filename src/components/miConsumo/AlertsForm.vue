<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from '@nanostores/vue'
import { priceData } from '../../stores/prices'
import { Bell, BellOff, AlertCircle, Check, Info } from 'lucide-vue-next'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from 'chart.js'
import ConfirmDialog from './ConfirmDialog.vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler)

const $prices = useStore(priceData)
const confirmDialog = ref(null)

const threshold = ref(0.12)
const notificationsEnabled = ref(false)
const alertsActive = ref(false)
const serviceWorkerSupported = ref(false)
const serviceWorkerRegistered = ref(false)

// Cargar configuración guardada
if (typeof window !== 'undefined') {
  const savedThreshold = localStorage.getItem('alert-threshold')
  const savedActive = localStorage.getItem('alerts-active')

  if (savedThreshold) threshold.value = parseFloat(savedThreshold)
  if (savedActive) alertsActive.value = savedActive === 'true'

  notificationsEnabled.value = 'Notification' in window && Notification.permission === 'granted'
  serviceWorkerSupported.value = 'serviceWorker' in navigator
}

onMounted(async () => {
  // Verificar si hay Service Worker registrado
  if (serviceWorkerSupported.value) {
    const registration = await navigator.serviceWorker.getRegistration()
    serviceWorkerRegistered.value = !!registration
  }
})

const currentPrice = computed(() => $prices.value?.currentPrice || 0)
const isBelowThreshold = computed(() => currentPrice.value > 0 && currentPrice.value < threshold.value)

// Datos para el gráfico
const chartData = computed(() => {
  const prices = $prices.value?.prices || []
  const labels = prices.map(p => p.hour.split(' - ')[0])
  const priceValues = prices.map(p => p.price)

  return {
    labels,
    datasets: [
      {
        label: 'Precio €/kWh',
        data: priceValues,
        borderColor: '#4a7ba7',
        backgroundColor: 'rgba(74, 123, 167, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6
      },
      {
        label: 'Tu umbral',
        data: Array(priceValues.length).fill(threshold.value),
        borderColor: '#5fd4a7',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        pointRadius: 0,
        borderWidth: 2
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        color: '#c8dff5',
        font: { size: 11 }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(13, 27, 42, 0.9)',
      titleColor: '#e8f1ff',
      bodyColor: '#c8dff5',
      borderColor: 'rgba(168, 197, 228, 0.2)',
      borderWidth: 1
    }
  },
  scales: {
    x: {
      ticks: {
        color: '#a8c5e4',
        maxRotation: 45,
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

async function requestNotifications() {
  if (!('Notification' in window)) {
    confirmDialog.value?.open({
      type: 'error',
      title: 'Notificaciones no soportadas',
      message: 'Tu navegador no soporta notificaciones. Prueba con Chrome, Firefox o Safari actualizado.',
      confirmText: 'Entendido'
    })
    return
  }

  const permission = await Notification.requestPermission()
  notificationsEnabled.value = permission === 'granted'

  if (permission === 'granted') {
    // Registrar Service Worker si está disponible
    if (serviceWorkerSupported.value && !serviceWorkerRegistered.value) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        serviceWorkerRegistered.value = true
        console.log('Service Worker registrado:', registration)
      } catch (error) {
        console.warn('Service Worker no disponible:', error)
      }
    }

    new Notification('¡Alertas activadas!', {
      body: `Te avisaremos cuando el precio baje de ${threshold.value.toFixed(4)} €/kWh`,
      icon: '/favicon.svg'
    })

    confirmDialog.value?.open({
      type: 'success',
      title: '¡Notificaciones activadas!',
      message: 'Ahora recibirás alertas cuando el precio baje de tu umbral configurado.',
      confirmText: 'Perfecto'
    })
  } else if (permission === 'denied') {
    confirmDialog.value?.open({
      type: 'error',
      title: 'Permisos denegados',
      message: 'Has bloqueado las notificaciones. Ve a configuración del navegador para habilitarlas.',
      confirmText: 'Entendido'
    })
  }
}

function toggleAlerts() {
  if (!notificationsEnabled.value) {
    requestNotifications()
    return
  }

  const newState = !alertsActive.value

  confirmDialog.value?.open({
    type: 'confirm',
    title: newState ? '¿Activar alertas?' : '¿Desactivar alertas?',
    message: newState 
      ? `Recibirás notificaciones cuando el precio baje de ${threshold.value.toFixed(4)} €/kWh.`
      : 'Dejarás de recibir notificaciones de precio.',
    confirmText: newState ? 'Sí, activar' : 'Sí, desactivar',
    cancelText: 'Cancelar',
    onConfirm: () => {
      alertsActive.value = newState
      localStorage.setItem('alerts-active', alertsActive.value.toString())

      if (alertsActive.value) {
        new Notification('Alertas activadas', {
          body: `Te avisaremos cuando el precio baje de ${threshold.value.toFixed(4)} €/kWh`,
          icon: '/favicon.svg'
        })

        // Enviar mensaje al Service Worker si está registrado
        if (serviceWorkerRegistered.value && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CHECK_PRICE',
            threshold: threshold.value
          })
        }
      }
    }
  })
}

function updateThreshold(e) {
  threshold.value = Number(e.target.value)
  localStorage.setItem('alert-threshold', threshold.value.toString())
}

// Vigilar el precio y enviar alertas
watch(currentPrice, (newPrice) => {
  if (!alertsActive.value || !notificationsEnabled.value) return

  if (newPrice > 0 && newPrice < threshold.value) {
    const lastAlert = localStorage.getItem('last-alert-time')
    const now = Date.now()

    if (!lastAlert || now - parseInt(lastAlert) > 30 * 60 * 1000) {
      new Notification('💰 ¡Precio bajo!', {
        body: `El precio actual es ${newPrice.toFixed(4)} €/kWh (umbral: ${threshold.value.toFixed(4)})`,
        icon: '/favicon.svg',
        tag: 'price-alert',
        requireInteraction: false
      })

      localStorage.setItem('last-alert-time', now.toString())
    }
  }
})

// Actualizar Service Worker cuando cambia el umbral
watch(threshold, (newThreshold) => {
  if (alertsActive.value && serviceWorkerRegistered.value && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'UPDATE_THRESHOLD',
      threshold: newThreshold
    })
  }
})
</script>

<template>
  <div class="alerts-form">
    <!-- Componente de confirmación -->
    <ConfirmDialog ref="confirmDialog" />

    <!-- Estado actual -->
    <div class="status-card" :class="{ active: isBelowThreshold }">
      <div class="status-header">
        <Check v-if="isBelowThreshold" :size="28" class="status-icon success" />
        <AlertCircle v-else :size="28" class="status-icon waiting" />
        <div class="status-text">
          <strong>Precio actual</strong>
          <span class="price">{{ currentPrice.toFixed(4) }} €/kWh</span>
        </div>
      </div>
      <p v-if="isBelowThreshold" class="status-message success">
        ¡El precio está por debajo de tu umbral!
      </p>
      <p v-else class="status-message">
        Esperando precio bajo...
      </p>
    </div>

    <!-- Gráfico de precios -->
    <div v-if="$prices?.prices?.length" class="chart-container">
      <h4 class="chart-title">Precios del día y tu umbral</h4>
      <div class="chart-wrapper">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <!-- Configuración del umbral -->
    <div class="form-group">
      <label class="form-label">
        Umbral de precio (€/kWh)
        <span class="help-icon" title="Recibirás una alerta cuando el precio baje de este valor">
          <AlertCircle :size="16" />
        </span>
      </label>
      <input 
        class="form-input" 
        type="number" 
        step="0.001" 
        min="0.05" 
        max="0.50" 
        :value="threshold"
        @input="updateThreshold" 
      />
      <p class="help-text">Ejemplo: 0.120 €/kWh para alertas en precios bajos</p>
    </div>

    <!-- Botón de activar/desactivar -->
    <button 
      class="btn btn-toggle"
      :class="{ active: alertsActive }"
      @click="toggleAlerts"
    >
      <Bell v-if="!alertsActive" :size="18" />
      <BellOff v-else :size="18" />
      <span>{{ alertsActive ? 'Alertas activas' : 'Activar alertas' }}</span>
    </button>

    <!-- Información sobre permisos -->
    <div v-if="!notificationsEnabled" class="info-box warning">
      <AlertCircle :size="18" />
      <p>Necesitas permitir notificaciones en tu navegador</p>
    </div>

    <!-- Info Service Worker -->
    <div v-if="serviceWorkerRegistered" class="info-box success">
      <Check :size="18" />
      <p>Notificaciones en segundo plano activadas</p>
    </div>

    <div class="info-box">
      <Info :size="18" />
      <ul class="info-list">
        <li>Las alertas se envían cuando el precio baja de tu umbral</li>
        <li>Máximo una notificación cada 30 minutos</li>
        <li v-if="serviceWorkerRegistered">Funciona incluso con el navegador cerrado</li>
        <li v-else>Funciona con la pestaña cerrada (navegador abierto)</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.alerts-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-card {
  background: rgba(13, 27, 42, 0.5);
  border: 2px solid rgba(168, 197, 228, 0.2);
  border-radius: 10px;
  padding: 16px;
  transition: all 0.3s;
}

.status-card.active {
  background: rgba(95, 212, 167, 0.1);
  border-color: rgba(95, 212, 167, 0.4);
}

.status-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.status-icon {
  flex-shrink: 0;
}

.status-icon.success {
  color: #5fd4a7;
}

.status-icon.waiting {
  color: #f4b860;
}

.status-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-text strong {
  color: #e8f1ff;
  font-size: 0.9rem;
}

.price {
  color: #5fd4a7;
  font-size: 1.1rem;
  font-weight: 700;
}

.status-message {
  font-size: 0.85rem;
  color: #a8c5e4;
  margin: 0;
}

.status-message.success {
  color: #5fd4a7;
  font-weight: 600;
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 600;
  color: #e8f1ff;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.help-icon {
  cursor: help;
  opacity: 0.7;
  display: flex;
  align-items: center;
}

.form-input {
  padding: 10px;
  background: #0d1b2a;
  border: 1px solid rgba(168, 197, 228, 0.2);
  border-radius: 6px;
  color: #fff;
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: #4a7ba7;
}

.help-text {
  font-size: 0.8rem;
  color: #a8c5e4;
  margin: 0;
}

.btn-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px;
  border-radius: 8px;
  border: 2px solid;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  background: rgba(74, 123, 167, 0.1);
  border-color: rgba(74, 123, 167, 0.3);
  color: #c8dff5;
}

.btn-toggle:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.btn-toggle.active {
  background: linear-gradient(135deg, #5fd4a7 0%, #4ac99a 100%);
  border-color: #5fd4a7;
  color: #0d1b2a;
}

.info-box {
  padding: 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  background: rgba(74, 123, 167, 0.05);
  border-left: 3px solid #4a7ba7;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.info-box.warning {
  background: rgba(244, 184, 96, 0.1);
  border-left-color: #f4b860;
  color: #f4b860;
}

.info-box.success {
  background: rgba(95, 212, 167, 0.1);
  border-left-color: #5fd4a7;
  color: #5fd4a7;
}

.info-list {
  margin: 0;
  padding-left: 20px;
  color: #c8dff5;
  line-height: 1.6;
}

.info-list li {
  margin-bottom: 4px;
}
</style>
<template>
  <!-- Añadir client:only en el componente padre (Astro) -->
  <div v-if="isHydrated" class="switch-container mt-space-2xs">
    <div class="switch-wrapper">
      <label class="switch" :class="{ disabled: !canToggle }">
        <input 
          type="checkbox"
          class="switch-input"
          :checked="isTomorrow"
          :disabled="!canToggle"
          @change="toggleDay"
        >
        <div class="switch-track" :class="{ active: isTomorrow }">
          <div class="switch-handle" :class="{ tomorrow: isTomorrow }">
            <Clock v-if="!canToggle" :size="16" class="clock-icon" />
          </div>
        </div>
        <div class="switch-labels">
          <span :class="{ active: !isTomorrow }">Hoy</span>
          <span :class="{ active: isTomorrow }">Mañana</span>
        </div>
      </label>
    </div>

    <div v-if="!canToggle" class="availability-message">
      <Clock :size="18" class="clock-icon" />
      <span>Disponible a las 20:25</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Clock } from 'lucide-vue-next'
import { useStore } from '@nanostores/vue'
import { day, priceData } from '../stores/prices.js'

const isHydrated = ref(false)
const dayStore = useStore(day)
const priceDataStore = useStore(priceData)

// Estado computado optimizado
const isTomorrow = computed(() => dayStore.value === 'tomorrow')
const canToggle = computed(() => priceDataStore.value?.tomorrowAvailable)

// Sincronización de estado inicial
onMounted(() => {
  const savedDay = localStorage.getItem('selected-day')
  const initialDay = savedDay ? JSON.parse(savedDay) : 'today'
  
  if (initialDay !== dayStore.value) {
    day.set(initialDay)
  }
  
  // Forzar nuevo frame antes de mostrar el componente
  requestAnimationFrame(() => {
    isHydrated.value = true
  })
})

function toggleDay() {
  if (!canToggle.value) return
  const newDay = isTomorrow.value ? 'today' : 'tomorrow'
  day.set(newDay)
}
</script>

<style>
.switch-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.switch-wrapper {
  position: relative;
}

.switch {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.switch.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-track {
  width: 56px;
  height: 32px;
  background: #e0e0e0;
  border-radius: 16px;
  position: relative;
  transition: background-color 0.3s ease;
}

.switch-track.active {
  background: var(--accent-500);
}

.switch-handle {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.switch-handle.tomorrow {
  transform: translateX(24px);
}

.clock-icon {
  color: #757575;
  stroke-width: 2;
}

.switch-labels {
  display: flex;
  gap: 0.5rem;
  margin-left: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.switch-labels span {
  color: #666;
  transition: color 0.3s ease;
}

.switch-labels span.active {
  color: var(--accent-500);
}

.availability-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.875rem;
}

.availability-message .clock-icon {
  color: inherit;
}
</style>
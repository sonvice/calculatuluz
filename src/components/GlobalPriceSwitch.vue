<!-- src/components/GlobalSwitch.vue -->
<template>
  <div class="switch-container mt-space-2xs">
    <div class="switch-wrapper">
      <!-- Switch -->
      <label class="switch" :class="{ disabled: !canToggle }">
        <input 
          type="checkbox"
          class="switch-input"
          :checked="dayStore === 'tomorrow'"
          :disabled="!canToggle"
          @change="toggleDay"
        >
        <div class="switch-track" :class="{ active: dayStore === 'tomorrow' }">
          <div class="switch-handle" :class="{ tomorrow: dayStore === 'tomorrow' }">
            <Clock v-if="!canToggle" :size="16" class="clock-icon" />
          </div>
        </div>
        <div class="switch-labels">
          <span :class="{ active: dayStore === 'today' }">Hoy</span>
          <span :class="{ active: dayStore === 'tomorrow' }">Mañana</span>
        </div>
      </label>
    </div>

    <!-- Mensaje de disponibilidad -->
    <div v-if="!canToggle" class="availability-message">
      <Clock :size="18" class="clock-icon" />
      <span>Disponible a las 20:25</span>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { Clock } from 'lucide-vue-next'
import { useStore } from '@nanostores/vue'
import { day, priceData } from '../stores/prices.js'

const dayStore       = useStore(day)        
const priceDataStore = useStore(priceData)  

// computed booleana para habilitar switch
const canToggle = computed(() => priceDataStore.value?.tomorrowAvailable ?? false)

// 1) Observa directamente la disponibilidad
watch(
  () => priceDataStore.tomorrowAvailable,
  avail => console.log('📅 tomorrowAvailable cambió a:', avail)
)


function toggleDay() {
  if (!canToggle.value) return
  const next = dayStore.value === 'today' ? 'tomorrow' : 'today'
  day.set(next)
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
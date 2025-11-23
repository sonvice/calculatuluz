<script setup>
import { ref, computed } from 'vue'
import { useStore } from '@nanostores/vue'
import { profile } from '../../stores/consumptionStore'
import { priceData, power as powerStore, applied, applyPower, resetData } from '../../stores/prices'
import { Zap, Check, RotateCcw, Info } from 'lucide-vue-next'
import InputField from '../InputField.vue'

const $prices = useStore(priceData)
const $applied = useStore(applied)

// Potencia por defecto: 4.6 kW (común en hogares españoles con vitrocerámica)
const potencia = ref(powerStore.get() || 4.6)
const tempPotencia = ref(potencia.value)
const saved = ref(false)

// Estado de aplicación
const isApplied = computed(() => $applied.value)

// Aplicar potencia
function handleApply() {
  if (tempPotencia.value > 0) {
    potencia.value = tempPotencia.value
    powerStore.set(tempPotencia.value)
    
    profile.set({
      potencia: tempPotencia.value,
      tarifa: 'pvpc'
    })
    
    applyPower()
    showSavedIndicator()
  }
}

// Resetear
function handleReset() {
  resetData()
  tempPotencia.value = potencia.value
}

function showSavedIndicator() {
  saved.value = true
  setTimeout(() => {
    saved.value = false
  }, 2000)
}

const precioActual = computed(() => $prices.value?.currentPrice || 0)
const precioMedio = computed(() => $prices.value?.averagePrice || 0)
const hasChanges = computed(() => tempPotencia.value !== potencia.value)
</script>

<template>
  <div class="consumption-form">
    <!-- Tarifa PVPC -->
    <div class="mb-space-m">
      <div class="tariff-badge">
        <Zap :size="20" class="badge-icon" />
        <span class="badge-text">Tarifa PVPC (Datos oficiales REE)</span>
      </div>
      <p class="text-neutral-400 text-size--1 mt-space-2xs">
        Usamos los precios oficiales del operador del sistema en tiempo real
      </p>
    </div>

    <!-- Potencia contratada -->
    <div class="form-group">
      <label class="form-label text-neutral-100 mb-space-2xs">
        <span>Potencia contratada (kW)</span>
        <transition name="fade">
          <span v-if="saved" class="saved-indicator">
            <Check :size="16" />
            Guardado
          </span>
        </transition>
      </label>
      
      <div class="power-input-group">
        <InputField
          v-model="tempPotencia"
          label="Potencia contratada"
          placeholder="Ej: 4.6"
          :min="0.1"
          :max="15"
          :step="0.1"
        />
        
        <button 
          class="btn"
          data-type="accent"
          :class="{ 'has-changes': hasChanges }"
          :disabled="!hasChanges || tempPotencia <= 0"
          @click="handleApply"
        >
          <Check v-if="isApplied && !hasChanges" :size="18" />
          <span>{{ isApplied && !hasChanges ? 'Aplicado' : 'Aplicar' }}</span>
        </button>
        
        <button 
          v-if="isApplied"
          class="btn"
          @click="handleReset"
          title="Resetear cálculo"
        >
          <RotateCcw :size="18" />
        </button>
      </div>
      
      <p class="form-help text-neutral-400 text-size--1 mt-space-2xs">
        <Info :size="14" class="help-icon" />
        <span>
          {{ isApplied 
            ? `Calculando con ${potencia} kW. Los precios se multiplican por tu potencia.` 
            : 'Valor típico en hogares: 4.6 kW (vitrocerámica) o 3.45 kW (gas)'
          }}
        </span>
      </p>
    </div>

    <!-- Info del precio actual -->
    <div v-if="precioActual > 0" class="price-info-box mt-space-m">
      <div class="price-row">
        <span class="price-label text-neutral-300">Precio medio hoy:</span>
        <span class="price-value text-accent-500">{{ precioMedio.toFixed(4) }} €/kWh</span>
      </div>
      <div class="price-row">
        <span class="price-label text-neutral-300">Precio actual:</span>
        <span class="price-value text-accent-400">{{ precioActual.toFixed(4) }} €/kWh</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.consumption-form {
  display: flex;
  flex-direction: column;
}

.tariff-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(74, 167, 123, 0.15);
  border: 1px solid rgba(74, 167, 123, 0.3);
  border-radius: 8px;
  font-weight: 600;
}

.badge-icon {
  color: var(--accent-500);
  flex-shrink: 0;
}

.badge-text {
  color: var(--accent-500);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.saved-indicator {
  color: var(--accent-500);
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.power-input-group {
  display: flex;
  gap: 8px;
}

/* Ajustes para que InputField funcione bien en el grupo */
.power-input-group :deep(.box-input) {
  flex: 1;
  min-width: 0;
}

.power-input-group :deep(.form-input) {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--primary-700);
  background: var(--primary-900);
  color: var(--neutral-100);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.power-input-group :deep(.form-input:focus) {
  border-color: var(--accent-500);
}

.power-input-group :deep(.input-controls) {
  background-color: var(--primary-900);
}

.power-input-group :deep(.btn-control) {
  color: var(--neutral-400);
}

.power-input-group :deep(.btn-control:hover:not(:disabled)) {
  background-color: var(--primary-800);
  color: var(--accent-500);
}

.power-input-group :deep(.controls-divider) {
  background-color: var(--primary-700);
}

.btn-apply {
  padding: 0 20px;
  border-radius: 8px;
  border: 1px solid var(--primary-600);
  background: var(--primary-800);
  color: var(--neutral-300);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  height: fit-content;
}

.btn-apply:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-apply.has-changes {
  background: var(--accent-500);
  color: var(--primary-900);
  border-color: var(--accent-500);
}

.btn-apply.has-changes:hover:not(:disabled) {
  background: var(--accent-400);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(74, 167, 123, 0.3);
}

.btn-reset {
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 107, 107, 0.3);
  background: rgba(255, 107, 107, 0.1);
  color: #ff9999;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  height: fit-content;
}

.btn-reset:hover {
  background: rgba(255, 107, 107, 0.2);
  transform: translateY(-1px);
}

.form-help {
  opacity: 0.7;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.help-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.price-info-box {
  padding: 16px;
  background: rgba(74, 167, 123, 0.08);
  border-radius: 8px;
  border-left: 3px solid var(--accent-500);
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.price-label {
  font-size: 0.9rem;
}

.price-value {
  font-weight: 700;
  font-size: 1.05rem;
}

@media (max-width: 768px) {
  .power-input-group {
    flex-wrap: wrap;
  }
  
  .power-input-group :deep(.box-input) {
    width: 100%;
  }
  
  .btn-apply,
  .btn-reset {
    flex: 1;
  }
  
  .form-label {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
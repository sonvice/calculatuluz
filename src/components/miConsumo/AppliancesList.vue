<script setup>
import { ref, computed } from 'vue'
import { useStore } from '@nanostores/vue'
import { appliances, addAppliance, removeAppliance, updateAppliance } from '../../stores/consumptionStore'
import { 
  Plus, Edit2, Trash2, X, 
  UtensilsCrossed, Sparkles, Snowflake, 
  Monitor, Lightbulb, Zap 
} from 'lucide-vue-next'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import ConfirmDialog from './ConfirmDialog.vue'

ChartJS.register(ArcElement, Tooltip, Legend)

const $appliances = useStore(appliances)
const confirmDialog = ref(null)

// Estado del formulario
const showForm = ref(false)
const editingId = ref(null)
const formData = ref({
  name: '',
  watts: '',
  hours: '',
  category: 'general'
})

// Categorías predefinidas con iconos de Lucide
const categories = [
  { value: 'cocina', label: 'Cocina', icon: UtensilsCrossed, color: '#ff6b6b' },
  { value: 'limpieza', label: 'Limpieza', icon: Sparkles, color: '#4ecdc4' },
  { value: 'climatizacion', label: 'Climatización', icon: Snowflake, color: '#45b7d1' },
  { value: 'electronica', label: 'Electrónica', icon: Monitor, color: '#f4b860' },
  { value: 'iluminacion', label: 'Iluminación', icon: Lightbulb, color: '#feca57' },
  { value: 'general', label: 'General', icon: Zap, color: '#5fd4a7' }
]

// Electrodomésticos comunes
const commonAppliances = [
  { name: 'Nevera', watts: 150, hours: 24, category: 'cocina' },
  { name: 'Lavadora', watts: 2000, hours: 1, category: 'limpieza' },
  { name: 'Lavavajillas', watts: 1500, hours: 1.5, category: 'limpieza' },
  { name: 'Horno', watts: 2000, hours: 0.5, category: 'cocina' },
  { name: 'Microondas', watts: 1000, hours: 0.3, category: 'cocina' },
  { name: 'Aire acondicionado', watts: 1500, hours: 4, category: 'climatizacion' },
  { name: 'TV', watts: 100, hours: 4, category: 'electronica' },
  { name: 'Ordenador', watts: 300, hours: 8, category: 'electronica' },

]

// Datos para el gráfico por categoría
const categoryChartData = computed(() => {
  const list = $appliances.value || []
  const categoryConsumption = {}
  
  list.forEach(appliance => {
    const consumption = (appliance.watts * appliance.hours) / 1000
    if (!categoryConsumption[appliance.category]) {
      categoryConsumption[appliance.category] = 0
    }
    categoryConsumption[appliance.category] += consumption
  })
  
  const labels = []
  const data = []
  const backgroundColors = []
  
  Object.entries(categoryConsumption).forEach(([cat, value]) => {
    const categoryInfo = categories.find(c => c.value === cat)
    if (categoryInfo) {
      labels.push(categoryInfo.label)
      data.push(value)
      backgroundColors.push(categoryInfo.color)
    }
  })
  
  return {
    labels,
    datasets: [{
      data,
      backgroundColor: backgroundColors,
      borderWidth: 2,
      borderColor: '#0d1b2a'
    }]
  }
})

const categoryChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        color: '#c8dff5',
        font: { size: 11 },
        padding: 10
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
          const label = context.label || ''
          const value = context.parsed || 0
          return `${label}: ${value.toFixed(2)} kWh/día`
        }
      }
    }
  }
}

function openForm() {
  showForm.value = true
  editingId.value = null
  resetForm()
}

function resetForm() {
  formData.value = {
    name: '',
    watts: '',
    hours: '',
    category: 'general'
  }
}

function closeForm() {
  showForm.value = false
  editingId.value = null
  resetForm()
}

function selectCommon(appliance) {
  formData.value = { ...appliance }
}

function handleSubmit() {
  if (!formData.value.name || !formData.value.watts || !formData.value.hours) {
    confirmDialog.value?.open({
      type: 'alert',
      title: 'Campos incompletos',
      message: 'Por favor, completa todos los campos antes de continuar.',
      confirmText: 'Entendido'
    })
    return
  }

  if (editingId.value) {
    updateAppliance(editingId.value, formData.value)
    confirmDialog.value?.open({
      type: 'success',
      title: '¡Actualizado!',
      message: 'El electrodoméstico se ha actualizado correctamente.',
      confirmText: 'Aceptar'
    })
  } else {
    addAppliance(formData.value)
    confirmDialog.value?.open({
      type: 'success',
      title: '¡Añadido!',
      message: 'El electrodoméstico se ha añadido correctamente.',
      confirmText: 'Aceptar'
    })
  }

  closeForm()
}

function handleEdit(appliance) {
  editingId.value = appliance.id
  formData.value = { ...appliance }
  showForm.value = true
}

function handleRemove(id) {
  confirmDialog.value?.open({
    type: 'confirm',
    title: '¿Eliminar electrodoméstico?',
    message: 'Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminarlo?',
    confirmText: 'Sí, eliminar',
    cancelText: 'Cancelar',
    onConfirm: () => {
      removeAppliance(id)
    }
  })
}

function getCategoryInfo(category) {
  return categories.find(c => c.value === category) || categories[5]
}

function calculateDailyConsumption(watts, hours) {
  return ((watts * hours) / 1000).toFixed(2)
}
</script>

<template>
  <div class="appliances-container">
    <!-- Componente de confirmación -->
    <ConfirmDialog ref="confirmDialog" />

    <!-- Gráfico de distribución por categoría -->
    <div v-if="$appliances.length > 0" class="chart-container mb-space-m">
      <h4 class="chart-title">Consumo por categoría</h4>
      <div class="chart-wrapper">
        <Doughnut :data="categoryChartData" :options="categoryChartOptions" />
      </div>
    </div>

    <!-- Lista de electrodomésticos -->
    <div v-if="$appliances.length > 0" class="appliances-list mb-space-m">
      <div 
        v-for="appliance in $appliances" 
        :key="appliance.id" 
        class="appliance-card mb-space-xs"
      >
        <div class="appliance-header">
          <div class="category-icon" :style="{ color: getCategoryInfo(appliance.category).color }">
            <component :is="getCategoryInfo(appliance.category).icon" :size="24" />
          </div>
          <div class="appliance-info">
            <h4 class="appliance-name text-neutral-50 text-size-0">{{ appliance.name }}</h4>
            <span class="appliance-category text-neutral-400 text-size--2">
              {{ getCategoryInfo(appliance.category).label }}
            </span>
          </div>
          <div class="appliance-actions">
            <button 
              class="btn-icon btn-edit" 
              @click="handleEdit(appliance)"
              title="Editar"
            >
              <Edit2 :size="16" />
            </button>
            <button 
              class="btn-icon btn-remove" 
              @click="handleRemove(appliance.id)"
              title="Eliminar"
            >
              <Trash2 :size="16" />
            </button>
          </div>
        </div>

        <div class="appliance-stats">
          <div class="stat">
            <span class="stat-label text-neutral-400 text-size--1">Potencia:</span>
            <span class="stat-value text-neutral-100">{{ appliance.watts }} W</span>
          </div>
          <div class="stat">
            <span class="stat-label text-neutral-400 text-size--1">Horas/día:</span>
            <span class="stat-value text-neutral-100">{{ appliance.hours }} h</span>
          </div>
          <div class="stat stat-highlight">
            <span class="stat-label text-neutral-400 text-size--1">Consumo:</span>
            <span class="stat-value text-accent-500">{{ calculateDailyConsumption(appliance.watts, appliance.hours) }} kWh/día</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state d-flex text-center py-space-l mb-space-m">
      <Zap :size="48" class="empty-icon" />
      <p class="text-neutral-400 text-size-0">No has añadido ningún electrodoméstico</p>
      <p class="text-neutral-500 text-size--1 mt-space-2xs">
        Añade los aparatos que usas para calcular tu consumo real
      </p>
    </div>

    <!-- Botón añadir -->
    <button v-if="!showForm" class="btn-add mb-space-m" @click="openForm">
      <Plus :size="20" />
      <span>Añadir electrodoméstico</span>
    </button>

    <!-- Formulario modal -->
    <div v-if="showForm" class="form-modal" @click.self="closeForm">
      <div class="form-content">
        <div class="form-header mb-space-m">
          <h3 class="text-neutral-50 text-size-1">
            {{ editingId ? 'Editar' : 'Añadir' }} electrodoméstico
          </h3>
          <button class="btn-close" @click="closeForm">
            <X :size="20" />
          </button>
        </div>

        <!-- Electrodomésticos comunes -->
        <div class="common-section mb-space-m">
          <p class="text-neutral-300 text-size--1 mb-space-xs">Selecciona uno común:</p>
          <div class="common-grid">
            <button
              v-for="common in commonAppliances"
              :key="common.name"
              class="common-btn"
              @click="selectCommon(common)"
              type="button"
            >
              <component 
                :is="getCategoryInfo(common.category).icon" 
                :size="16" 
                :style="{ color: getCategoryInfo(common.category).color }"
              />
              <span>{{ common.name }}</span>
            </button>
          </div>
        </div>

        <div class="separator mb-space-m">
          <span class="separator-text text-neutral-400 text-size--1">o crea uno personalizado</span>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="form-group mb-space-s">
            <label class="form-label text-neutral-200 text-size--1 mb-space-2xs">
              Nombre del aparato
            </label>
            <input
              v-model="formData.name"
              type="text"
              class="form-input"
              placeholder="Ej: Lavadora, TV, etc."
              required
            />
          </div>

          <div class="form-row mb-space-s">
            <div class="form-group">
              <label class="form-label text-neutral-200 text-size--1 mb-space-2xs">
                Potencia (W)
              </label>
              <input
                v-model.number="formData.watts"
                type="number"
                class="form-input"
                min="1"
                max="10000"
                step="1"
                required
              />
              <span class="help-text text-neutral-400 text-size--2">Watios que consume</span>
            </div>

            <div class="form-group">
              <label class="form-label text-neutral-200 text-size--1 mb-space-2xs">
                Horas al día
              </label>
              <input
                v-model.number="formData.hours"
                type="number"
                class="form-input"
                min="0.1"
                max="24"
                step="0.1"
                required
              />
              <span class="help-text text-neutral-400 text-size--2">Tiempo de uso diario</span>
            </div>
          </div>

          <div class="form-group mb-space-m">
            <label class="form-label text-neutral-200 text-size--1 mb-space-2xs">
              Categoría
            </label>
            <select v-model="formData.category" class="form-select">
              <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
          </div>

          <div class="form-actions d-flex">
            <button type="button" class="btn" @click="closeForm">
              Cancelar
            </button>
            <button type="submit" data-type="accent" class="btn">
              {{ editingId ? 'Actualizar' : 'Añadir' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.appliances-container {
  position: relative;
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
  height: 250px;
}

.appliances-list {
  display: flex;
  flex-direction: column;
}

.appliance-card {
  background: var(--primary-800);
  border: 1px solid var(--primary-700);
  border-radius: 10px;
  padding: 16px;
  transition: all 0.2s;
}

.appliance-card:hover {
  border-color: var(--primary-600);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.appliance-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.category-icon {
  flex-shrink: 0;
}

.appliance-info {
  flex: 1;
}

.appliance-name {
  margin: 0;
  font-weight: 600;
}

.appliance-category {
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.appliance-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  opacity: 0.7;
  transition: all 0.2s;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c8dff5;
}

.btn-icon:hover {
  opacity: 1;
  background: rgba(74, 123, 167, 0.2);
}

.btn-icon.btn-remove:hover {
  background: rgba(255, 107, 107, 0.2);
  color: #ff9999;
}

.appliance-stats {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--primary-700);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat.stat-highlight {
  margin-left: auto;
  text-align: right;
}

.stat-label {
  font-size: 0.75rem;
}

.stat-value {
  font-weight: 600;
}

.empty-state {
  flex-direction: column;
  border: 1px dashed var(--primary-700);
  border-radius: 8px;
  --horizontal-alignment: center;
}

.empty-icon {
  color: #4a7ba7;
  margin-bottom: 12px;
}

.btn-add {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, var(--accent-500) 0%, var(--accent-400) 100%);
  color: var(--primary-900);
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 167, 123, 0.3);
}

/* Modal */
.form-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.form-content {
  background: var(--primary-800);
  border-radius: 12px;
  border: 1px solid var(--primary-700);
  padding: 24px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-header h3 {
  margin: 0;
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--neutral-400);
  cursor: pointer;
  padding: 4px;
  width: 32px;
  height: 32px;
  transition: all 0.2s;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  color: var(--neutral-100);
  background: rgba(255, 107, 107, 0.2);
}

.common-section {
  /* Existing styles */
}

.common-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.common-btn {
  padding: 10px;
  background: var(--primary-900);
  border: 1px solid var(--primary-700);
  border-radius: 6px;
  color: var(--neutral-200);
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.common-btn:hover {
  background: rgba(74, 123, 167, 0.2);
  border-color: var(--primary-600);
}

.separator {
  text-align: center;
  position: relative;
}

.separator-text {
  position: relative;
  z-index: 1;
  background: var(--primary-800);
  padding: 0 12px;
}

.separator::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--primary-700);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-label {
  font-weight: 600;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px;
  background: var(--primary-900);
  border: 1px solid var(--primary-700);
  border-radius: 6px;
  color: var(--neutral-100);
  font-size: 1rem;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--accent-500);
}

.help-text {
  margin-top: 4px;
}

.form-actions {
 --horizontal-alignment: center;
 & .btn{
   flex-grow: 1;
   display: flex;
   justify-content: center;
 }
}

.btn {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: transparent;
  color: var(--neutral-300);
  border: 1px solid var(--primary-600);
}

.btn-cancel:hover {
  background: var(--primary-700);
}

.btn-submit {
  background: linear-gradient(135deg, var(--accent-500) 0%, var(--accent-400) 100%);
  color: var(--primary-900);
  border: none;
}

.btn-submit:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(74, 167, 123, 0.3);
}

@media (max-width: 768px) {
  .appliance-stats {
    flex-wrap: wrap;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .common-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-wrapper {
    height: 200px;
  }
}
</style>
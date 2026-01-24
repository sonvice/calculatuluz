<template>
  <form role="form" aria-labelledby="calc-title" @submit.prevent="handleCalculate">
    <fieldset>
      <div class="price-indicator mb-space-m">
        <span class="text-size--1">Precio de la luz ahora mismo:</span>
        <div class="d-flex align-items-center gap-xs">
          <span class="text-weight-bold text-size-1">{{ actualPrice ? actualPrice.toFixed(4) : '...' }} €/kWh</span>
          <span class="badge" :class="priceLevel.class">
            <component :is="priceLevel.icon" :size="14" />
            {{ priceLevel.label }}
          </span>
        </div>
      </div>
      <legend id="calc-title" class="visually-hidden">
        Calculadora de consumo eléctrico
      </legend>
      <div class="form-calculator">

        <!-- Selección de Electrodoméstico -->
        <div>
          <label for="appliance" class="text-size--1 mb-space-3xs">
            Selecciona un electrodoméstico
          </label>
          <CustomSelect 
            id="appliance" 
            name="appliance" 
            :appliances="appliances" 
            v-model="selectedAppliance"
            aria-describedby="appliance-help" 
          />
          <p id="appliance-help" class="visually-hidden">
            Elige un electrodoméstico de la lista o introduce potencia manualmente.
          </p>
        </div>

        <!-- Inputs de potencia y horas -->
        <div class="wrapper-inputs">
          <div>
            <label for="power" class="text-size--1 mb-space-3xs">Potencia Eléctrica (W)</label>
            <InputField 
              id="power" 
              name="power" 
              placeholder="Ej: 1500" 
              v-model="power" 
              min="0" 
              max="3500" 
              step="50"
              :error="errors.power" 
            />
          </div>
          <div>
            <label for="hours" class="text-size--1 mb-space-3xs">Horas de uso diaria</label>
            <InputField 
              id="hours" 
              name="hours" 
              placeholder="Ej: 2.5" 
              v-model="hours" 
              min="0.5" 
              max="24" 
              step="0.5"
              :error="errors.hours" 
            />
          </div>
        </div>

        <!-- Botones -->
        <div class="button-group d-flex">
          <button 
            type="submit" 
            class="btn" 
            data-type="accent"
            :disabled="!isFormValid"
            :class="{ 'btn--disabled': !isFormValid }"
          >
            <span v-if="!hasCalculated">Calcular consumo</span>
            <span v-else>Recalcular</span>
          </button>
          <button 
            type="button" 
            class="btn"
            @click="resetForm"
            v-if="hasCalculated"
          >
            Nueva consulta
          </button>
        </div>
      </div>

      <!-- Resultados -->
      <transition name="results-fade">
        <div v-if="hasCalculated" class="results-section mt-space-l">
          <ResultsDisplay 
            :results="results" 
            :lastUpdated="priceData.lastUpdated" 
            :currentPrice="actualPrice" 
          />
          
          <!-- Gráfico mejorado -->
          <div class="mt-space-m">
            <ConsumptionChartImproved 
              :dailyCost="parseFloat(results.dailyCost)" 
              :monthlyCost="parseFloat(results.monthlyCost)"
              :annualCost="parseFloat(results.annualCost)" 
              :applianceName="selectedApplianceName"
              :hoursPerDay="hours"
            />
          </div>
        </div>
      </transition>

      <!-- Mensaje de ayuda cuando no hay cálculo pero el form es válido -->
      <transition name="helper-fade">
        <div v-if="!hasCalculated && isFormValid" class="helper-message mt-space-m">
          <MousePointerClick :size="18" class="helper-icon" />
          <p class="text-size--1 text-primary-200">
            Pulsa <strong class="text-primary-50">"Calcular consumo"</strong> para ver tu estimación
          </p>
        </div>
      </transition>
    </fieldset>
  </form>
</template>


<script setup>
import { ref, watch, reactive, computed, onMounted } from 'vue';
import { useStore } from '@nanostores/vue';
import { priceData } from '../stores/prices.js';
import { 
  TrendingDown, 
  Check, 
  Minus, 
  TrendingUp,
  MousePointerClick
} from 'lucide-vue-next';

import { appliances } from '../constant/index.js';
import CustomSelect from './CustomSelect.vue';
import InputField from './InputField.vue';
import ResultsDisplay from './ResultsDisplay.vue';
import ConsumptionChartImproved from './ConsumptionChartImproved.vue';


const props = defineProps({
  initialPower: {
    type: [Number, String],
    default: ''
  },
  initialApplianceName: {
    type: String,
    default: ''
  }
});


const selectedAppliance = ref('');
const power = ref('');
const hours = ref('');
const hasCalculated = ref(false);

const errors = reactive({
  power: '',
  hours: '',
});

const results = ref({
  dailyKwh: '0.0000',
  dailyCost: '0.000',
  monthlyCost: '0.000',
  annualCost: '0.000',
});

// Nanostore
const priceStore = useStore(priceData);
const actualPrice = computed(() => priceStore.value?.currentPrice ?? 0);

// Computed para el nivel de precio
const priceLevel = computed(() => {
  const price = actualPrice.value;
  if (price < 0.10) return { icon: TrendingDown, label: 'Muy barato', class: 'bg-success' };
  if (price < 0.15) return { icon: Check, label: 'Barato', class: 'bg-success' };
  if (price < 0.20) return { icon: Minus, label: 'Normal', class: 'bg-warning' };
  return { icon: TrendingUp, label: 'Caro', class: 'bg-danger' };
});

// Computed para validación del formulario
const isFormValid = computed(() => {
  const powerValue = parseFloat(power.value);
  const hoursValue = parseFloat(hours.value);
  return powerValue > 0 && hoursValue > 0 && actualPrice.value > 0;
});

// Computed para obtener el nombre del electrodoméstico seleccionado
const selectedApplianceName = computed(() => {
  if (!selectedAppliance.value || selectedAppliance.value === 'custom') {
    return 'Electrodoméstico personalizado';
  }
  const found = appliances.find(a => a.slug === selectedAppliance.value);
  return found ? found.label : 'Electrodoméstico';
});

onMounted(() => {
  if (props.initialPower) {
    power.value = props.initialPower;
    const found = appliances.find(a => a.label === props.initialApplianceName);
    if (found) {
      selectedAppliance.value = found.slug; 
    } else {
      selectedAppliance.value = 'custom';
    }
  }
});

// Actualizar potencia si se selecciona electrodoméstico
watch(selectedAppliance, (newVal) => {
  if (newVal && newVal !== 'custom') {
    const foundAppliance = appliances.find(app => app.slug === newVal);
    if (foundAppliance) {
      power.value = foundAppliance.value;
    }
  }
  // Reset del cálculo cuando cambia el electrodoméstico
  hasCalculated.value = false;
});

// Reset del cálculo cuando cambian los inputs (pero NO recalcular automáticamente)
watch([power, hours], () => {
  hasCalculated.value = false;
});

// Limpiar errores al escribir
watch(power, (newVal) => {
  if (errors.power && newVal !== '') errors.power = '';
});

watch(hours, (newVal) => {
  if (errors.hours && newVal !== '') errors.hours = '';
});

const handleCalculate = () => {
  errors.power = '';
  errors.hours = '';

  let valid = true;

  if (!power.value) {
    errors.power = 'Este campo es requerido';
    valid = false;
  } else if (isNaN(power.value)) {
    errors.power = 'Debes introducir un número';
    valid = false;
  } else if (parseFloat(power.value) <= 0) {
    errors.power = 'La potencia debe ser mayor que 0';
    valid = false;
  }

  if (!hours.value) {
    errors.hours = 'Este campo es requerido';
    valid = false;
  } else if (isNaN(hours.value)) {
    errors.hours = 'Debes introducir un número';
    valid = false;
  } else if (parseFloat(hours.value) <= 0) {
    errors.hours = 'Las horas deben ser mayores que 0';
    valid = false;
  }

  if (!valid) return;

  calculateConsumption();
  hasCalculated.value = true;
};

const calculateConsumption = () => {
  const powerValue = parseFloat(power.value) || 0;
  const hoursValue = parseFloat(hours.value) || 0;

  if (powerValue <= 0 || hoursValue <= 0 || !actualPrice.value) {
    resetResults();
    return;
  }

  const kwh = (powerValue * hoursValue) / 1000;
  const dailyNet = kwh * actualPrice.value;
  const VAT_FACTOR = 1.21;

  results.value = {
    dailyKwh: kwh.toFixed(4),
    dailyCost: (dailyNet * VAT_FACTOR).toFixed(3),
    monthlyCost: (dailyNet * VAT_FACTOR * 30).toFixed(3),
    annualCost: (dailyNet * VAT_FACTOR * 365).toFixed(3),
  };
};

const resetResults = () => {
  results.value = {
    dailyKwh: '0.000',
    dailyCost: '0.000',
    monthlyCost: '0.000',
    annualCost: '0.000',
  };
};

const resetForm = () => {
  selectedAppliance.value = '';
  power.value = '';
  hours.value = '';
  hasCalculated.value = false;
  resetResults();
};
</script>


<style scoped>
form fieldset {
  border: none;
  margin: 0;
  padding: 0;
}

label {
  display: inline-block;
}

.form-calculator {
  display: grid;
  gap: var(--space-m);
}

@media (min-width: 64em) {
  .form-calculator {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 90em) {
  .form-calculator {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

.button-group {
  margin-top: var(--space-m);
  gap: var(--space-s);
}


.wrapper-inputs {
  display: grid;
  gap: var(--space-s);
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .wrapper-inputs {
    grid-template-columns: 1fr 1fr;
  }
}

/* Resultados con borde superior */
.results-section {
  border-top: 1px solid var(--primary-700);
  padding-top: var(--space-m);
}

/* Mensaje de ayuda */
.helper-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  text-align: center;
  padding: var(--space-m);
  background: var(--primary-800);
  border-radius: var(--rounded-md);
  border: 1px dashed var(--primary-600);
}

.helper-message p {
  margin: 0;
}

.helper-icon {
  color: var(--primary-400);
  flex-shrink: 0;
}

/* Badge de precio */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3xs);
  padding: var(--space-3xs) var(--space-xs);
  border-radius: var(--rounded-full);
  font-size: var(--size--2);
  font-weight: var(--semi-bold);
}

.badge.bg-success {
  background: rgba(16, 185, 129, 0.2);
  color: var(--esmerald-green);
}

.badge.bg-warning {
  background: rgba(245, 158, 11, 0.2);
  color: var(--amber);
}

.badge.bg-danger {
  background: rgba(239, 68, 68, 0.2);
  color: var(--red);
}

/* Transiciones suaves */
.results-fade-enter-active,
.results-fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.results-fade-enter-from,
.results-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.helper-fade-enter-active,
.helper-fade-leave-active {
  transition: opacity 0.3s ease;
}

.helper-fade-enter-from,
.helper-fade-leave-to {
  opacity: 0;
}
</style>
<template>
  <form role="form" aria-labelledby="calc-title" @submit.prevent="handleCalculate">
    <fieldset>
      <div class="price-indicator mb-space-m">
        <span class="text-size--1">Precio de la luz ahora mismo:</span>
        <div class="d-flex align-items-center gap-xs">
          <span class="text-weight-bold text-size-1">{{ actualPrice ? actualPrice.toFixed(4) : '...' }} €/kWh</span>
          <span class="badge" :class="actualPrice < 0.15 ? 'bg-success' : 'bg-warning'">
            {{ actualPrice < 0.15 ? 'Barato ✅' : 'Normal ⚠️' }} </span>
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
          <CustomSelect id="appliance" name="appliance" :appliances="appliances" v-model="selectedAppliance"
            aria-describedby="appliance-help" />
          <p id="appliance-help" class="visually-hidden">
            Elige un electrodoméstico de la lista o introduce potencia manualmente.
          </p>
        </div>

        <!-- Inputs de potencia y horas -->
        <div class="wrapper-inputs">
          <div>
            <label for="power" class="text-size--1 mb-space-3xs">Potencia Eléctrica (W)</label>
            <InputField id="power" name="power" placeholder="Ej: 1500" v-model="power" min="0" max="3500" step="50"
              :error="errors.power" />
          </div>
          <div>
            <label for="hours" class="text-size--1 mb-space-3xs">Horas de uso diaria</label>
            <InputField id="hours" name="hours" placeholder="Ej: 2.5" v-model="hours" min="0.5" max="24" step="0.5"
              :error="errors.hours" />
          </div>
        </div>

        <!-- Botones -->
        <div class="button-group d-flex">
          <button type="submit" class="btn" data-type="accent">
            Calcular consumo
          </button>
          <button type="button" class="btn" @click="resetForm">
            Reiniciar
          </button>
        </div>
      </div>
      <!-- Resultados -->
      <ResultsDisplay :results="results" :lastUpdated="priceData.lastUpdated" :currentPrice="actualPrice" />
      <div v-if="results.dailyCost > 0" class="mt-space-m fade-in">
        <h3 class="text-size-0 mb-space-xs text-center">Proyección de Gasto</h3>
        <ConsumptionChart :dailyCost="results.dailyCost" :monthlyCost="results.monthlyCost"
          :annualCost="results.annualCost" />
      </div>
    </fieldset>
  </form>
</template>


<script setup>
import { ref, watch, reactive, computed, onMounted } from 'vue';
import { useStore } from '@nanostores/vue';
import { priceData } from '../stores/prices.js';

import { appliances } from '../constant/index.js';
import CustomSelect from './CustomSelect.vue';
import InputField from './InputField.vue';
import ResultsDisplay from './ResultsDisplay.vue';
import ConsumptionChart from './ConsumptionChart.vue';


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

onMounted(() => {
  if (props.initialPower) {
    power.value = props.initialPower;
    const found = appliances.find(a => a.label === props.initialApplianceName);
    if (found) {
      // Ahora seteamos el SLUG, no el value numérico
      selectedAppliance.value = found.slug; 
    } else {
      selectedAppliance.value = 'custom';
    }
  }
});

// Actualizar potencia si se selecciona electrodoméstico
watch(selectedAppliance, (newVal) => {
  if (newVal && newVal !== 'custom') {
    // 1. Buscamos el aparato en la lista usando el SLUG (que es único)
    const foundAppliance = appliances.find(app => app.slug === newVal);
    
    // 2. Si lo encontramos, extraemos su valor numérico para el input
    if (foundAppliance) {
       power.value = foundAppliance.value;
    }
  }
});

// Recalcular cuando cambian datos
watch([power, hours], () => calculateConsumption());
watch(() => actualPrice.value, () => calculateConsumption());

const handleCalculate = () => {
  errors.power = '';
  errors.hours = '';

  let valid = true;

  if (!power.value) {
    errors.power = '⚠️ Este campo es requerido';
    valid = false;
  } else if (isNaN(power.value)) {
    errors.power = '⚠️ Debes introducir un número';
    valid = false;
  }

  if (!hours.value) {
    errors.hours = '⚠️ Este campo es requerido';
    valid = false;
  } else if (isNaN(hours.value)) {
    errors.hours = '⚠️ Debes introducir un número';
    valid = false;
  }

  // Limpiar errores al escribir
  watch(power, (newVal) => {
    if (errors.power && newVal !== '') errors.power = '';
  });
  watch(hours, (newVal) => {
    if (errors.hours && newVal !== '') errors.hours = '';
  });

  if (!valid) return;

  calculateConsumption();
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
}

.button-group .btn {
  flex-grow: 1;
  justify-content: center;
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
</style>

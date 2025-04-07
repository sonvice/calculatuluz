<template>
  <div>
    <div class="form-calulator">
      <div>
        <p class="text-size--1 mb-space-3xs">Selecciona un electrodoméstico</p>
        <CustomSelect :appliances="appliances" v-model="selectedAppliance" />
      </div>
      <div class="wrapper-inputs">
        <InputField
          label="Potencia Eléctrica"
          suffix="W"
          placeholder="Ej: 1500"
          v-model="power"
          min="0"
          max="3500"
          step="50"
          note="Máx. Recomendado: 3500W" />
        <InputField
          label="Horas de uso Diario"
          placeholder="Ej: 2.5"
          v-model="hours"
          min="0.5"
          max="24"
          step="0.5"
          note="Usa punto decimal (ej: 1.5)" />
      </div>
      <div class="button-group d-flex">
        <button class="btn" data-type="accent" @click="handleCalculate">
          Calcular consumo
        </button>
        <button class="btn" @click="resetForm">Reiniciar</button>
      </div>
    </div>
    <ResultsDisplay
      :results="results"
      :lastUpdated="priceData.lastUpdated"
      :currentPrice="priceData.currentPrice" />
    <div class="chart-wrapper">
      <PriceChart
        v-if="priceData.prices.length"
        :prices="priceData.prices"
        :last-updated="priceData.lastUpdated"
        :current-price="priceData.currentPrice" />
      <div v-else>Cargando gráfico...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import CustomSelect from './CustomSelect.vue';
import InputField from './InputField.vue';
import ResultsDisplay from './ResultsDisplay.vue';
import PriceChart from './PriceChart.vue';
import { usePriceData } from './composables/usePriceData.js';

const { priceData } = usePriceData();

const selectedAppliance = ref('');
const power = ref('');
const hours = ref('');
const results = ref({
  dailyKwh: '0.0000',
  dailyCost: '0.000',
  monthlyCost: '0.000',
  annualCost: '0.000',
});

const appliances = [
  { value: 50, label: 'Bombilla LED', watts: '50W', image: '/images/bombilla.jpg' },
  { value: 150, label: 'Portátil', watts: '150W', image: '/images/laptop.jpg' },
  { value: 300, label: 'Televisor 50"', watts: '300W', image: '/images/tv.jpg' },
  { value: 800, label: 'Microondas', watts: '800W', image: '/images/microwave.jpg' },
  { value: 1200, label: 'Secador de pelo', watts: '1200W', image: '/images/hair-dryer.jpg' },
  { value: 2000, label: 'Lavadora', watts: '2000W', image: '/images/washing-machine.jpg' },
  { value: 'custom', label: 'Personalizado', watts: '', image: '/images/personalizado.jpg' },
];

watch(selectedAppliance, (newVal) => {
  if (newVal && newVal !== 'custom') {
    power.value = newVal;
  }
});

watch([power, hours], () => {
  calculateConsumption();
});

watch(() => priceData.value.currentPrice, () => {
  calculateConsumption();
});

const handleCalculate = () => {
  if (!power.value || !hours.value) {
    alert('⚠️ Debes completar todos los campos requeridos');
    return;
  }
  if (isNaN(power.value) || isNaN(hours.value)) {
    alert('⚠️ Los valores deben ser numéricos');
    return;
  }
  calculateConsumption();
};

const calculateConsumption = () => {
  if (!priceData.value.currentPrice) return;
  const powerValue = parseFloat(power.value) || 0;
  const hoursValue = parseFloat(hours.value) || 0;
  if (powerValue <= 0 || hoursValue <= 0) {
    resetResults();
    return;
  }
  const kwh = (powerValue * hoursValue) / 1000;
  const dailyCost = kwh * priceData.value.currentPrice;
  results.value = {
    dailyKwh: kwh.toFixed(4),
    dailyCost: dailyCost.toFixed(3),
    monthlyCost: (dailyCost * 30).toFixed(3),
    annualCost: (dailyCost * 365).toFixed(3),
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
.form-calulator {
  display: grid;
  gap: var(--space-m);
}
@media (min-width: 64em) {
  .form-calulator {
    grid-template-columns: 1fr 1fr;
  }
}
@media (min-width: 90em) {
  .form-calulator {
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
  gap: var(--space-l);
  grid-template-columns: 1fr;
}
@media (min-width: 768px) {
  .wrapper-inputs {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-s);
  }
}
</style>

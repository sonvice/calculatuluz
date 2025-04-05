<template>
  <div class="container">
    <CalculatorForm
      v-model:selectedAppliance="selectedAppliance"
      v-model:power="power"
      v-model:hours="hours"
      :appliances="appliances"
      @calculate="handleCalculate"
      @reset="resetForm"
    />
    
    <ConsumptionResults
      :results="results"
      :price-data="priceData"
      :formatted-date="formattedDate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import CalculatorForm from './CalculatorForm/CalculatorForm.vue';
import ConsumptionResults from './ConsumptionResults/ConsumptionResults.vue';

interface PriceData {
  currentPrice: number | null;
  lastUpdated: Date | null;
  prices: number[];
  minPrice: number | null;
  maxPrice: number | null;
}

interface Appliance {
  value: string | number;
  label: string;
  watts: string;
  image: string;
}

// Estado reactivo
const priceData = ref<PriceData>({
  currentPrice: null,
  lastUpdated: null,
  prices: [],
  minPrice: null,
  maxPrice: null
});

const selectedAppliance = ref<string | number>('');
const power = ref<string | number>('');
const hours = ref<string | number>('');

const results = ref({
  dailyKwh: '0.0000',
  dailyCost: '0.000',
  monthlyCost: '0.000',
  annualCost: '0.000'
});


// Computed
const formattedDate = computed(() => {
  if (!priceData.value.lastUpdated) return '';
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(priceData.value.lastUpdated));
});

// Watchers
watch(selectedAppliance, (newVal) => {
  if (newVal && newVal !== 'custom') {
    power.value = newVal;
  }
});

// Métodos
const handleCalculate = () => {
  if (!validateForm()) return;
  calculateConsumption();
};

const resetResults = () => {
    results.value = {
      dailyKwh: '0.000',
      dailyCost: '0.000',
      monthlyCost: '0.000',
      annualCost: '0.000'
    };
  };

const validateForm = (): boolean => {
  if (!power.value || !hours.value) {
    alert('⚠️ Debes completar todos los campos requeridos');
    return false;
  }
  
  if (isNaN(Number(power.value)) || isNaN(Number(hours.value))) {
    alert('⚠️ Los valores deben ser numéricos');
    return false;
  }
  
  return true;
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
  annualCost: (dailyCost * 365).toFixed(3)
};
};

const resetForm = () => {
  selectedAppliance.value = '';
  power.value = '';
  hours.value = '';
  results.value = {
    dailyKwh: '0.000',
    dailyCost: '0.000',
    monthlyCost: '0.000',
    annualCost: '0.000'
  };
};

// Lifecycle hooks
  // API Call
  onMounted(async () => {
    try {
      const apiUrl = new URL('/api/prices', window.location.origin);
      const response = await fetch(apiUrl, {
        headers: { Accept: 'application/json' },
      });
  
      if (!response.ok) throw new Error(`Error ${response.status}`);
  
      const data = await response.json();
      priceData.value = {
        currentPrice: data.currentPrice,
        lastUpdated: data.lastUpdated,
        prices: data.prices,
        minPrice: data.minPrice,
        maxPrice: data.maxPrice
      };
      
    } catch (error) {
      console.error('Error fetching prices:', error);
      alert('⚠️ No se pudieron cargar los precios actuales');
    }
  });
</script>

<style>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
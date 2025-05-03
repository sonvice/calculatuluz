<template>
  <form
    role="form"
    aria-labelledby="calc-title"
    @submit.prevent="handleCalculate"
  >
    <fieldset>
      <legend id="calc-title" class="visually-hidden">
        Calculadora de consumo eléctrico
      </legend>
      <div     class="form-calculator">

      <!-- Selección de Electrodoméstico -->
      <div>
        <label
          for="appliance"
          class="text-size--1 mb-space-3xs"
        >
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
            note="Máx. recomendado: 3500 W"
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
            note="Usa punto decimal (ej: 1.5)"
          />
        </div>
      </div>

      <!-- Botones -->
      <div class="button-group d-flex">
        <button
          type="submit"
          class="btn"
          data-type="accent"
        >
          Calcular consumo
        </button>
        <button
          type="button"
          class="btn"
          @click="resetForm"
        >
          Reiniciar
        </button>
      </div>
    </div>
      <!-- Resultados -->
      <ResultsDisplay
        :results="results"
        :lastUpdated="priceData.lastUpdated"
        :currentPrice="actualPrice"
      />
    </fieldset>
  </form>
</template>


<script setup>
  import { ref, watch, reactive } from 'vue';
  import { appliances } from '../constant/index.js';
  import CustomSelect from './CustomSelect.vue';
  import InputField from './InputField.vue';
  import ResultsDisplay from './ResultsDisplay.vue';
  import { usePriceData } from '../utils/usePriceData.js';

  const { priceData, actualPrice } = usePriceData();

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

  watch(selectedAppliance, (newVal) => {
    if (newVal && newVal !== 'custom') {
      power.value = newVal;
    }
  });

  watch([power, hours], () => {
    calculateConsumption();
  });

  watch(
    () => priceData.value.currentPrice,
    () => {
      calculateConsumption();
    }
  );

  const handleCalculate = () => {
    // 1) Limpiamos errores anteriores
    errors.power = '';
    errors.hours = '';

    let valid = true;

    // 2) Validación de “requerido” y “numérico”
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

    // —————— WATCHERS PARA LIMPIAR ERRORES AL ESCRIBIR ——————
    watch(power, (newVal) => {
      if (errors.power && newVal !== '') {
        errors.power = '';
      }
    });
    watch(hours, (newVal) => {
      if (errors.hours && newVal !== '') {
        errors.hours = '';
      }
    });

    // 3) Si todo OK, seguimos adelante
    if (!valid) return;
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
    const dailyNet = kwh * priceData.value.currentPrice;
    const VAT_FACTOR = 1.21;

    const dailyGross = dailyNet * VAT_FACTOR;
    const monthlyGross = dailyGross * 30;
    const annualGross = dailyGross * 365;

    results.value = {
      dailyKwh: kwh.toFixed(4),
      dailyCost: dailyGross.toFixed(3), // ya con IVA
      monthlyCost: monthlyGross.toFixed(3), // ya con IVA
      annualCost: annualGross.toFixed(3), // ya con IVA
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
  display:inline-block;
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

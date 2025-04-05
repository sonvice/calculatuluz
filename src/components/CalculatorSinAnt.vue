<template>
  <div class="form-calulator">
    <div>
      <p class="text-size--1 mb-space-3xs">Selecciona un electrodoméstico</p>
      <div class="custom-select" ref="dropdown">
        <div class="select-header" @click="toggleDropdown">
          <div v-if="!selectedAppliance" class="placeholder d-flex">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round">
              <path
                d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Elegir electrodoméstico
          </div>
          <div v-else class="selected-appliance">
            {{ selectedApplianceLabel }}
          </div>
        </div>
        <div v-show="isDropdownOpen" class="dropdown-options">
          <div
            v-for="appliance in appliances"
            :key="appliance.value"
            class="dropdown-option"
            @click="selectAppliance(appliance.value)">
            <img :src="appliance.image" alt="icono" width="24" />
            <div class="option-details d-flex">
              <span class="appliance-name">{{ appliance.label }}</span>
              <span class="power-consumption">{{ appliance.watts }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="wrapper-inputs">
      <div class="box-input d-flex relative">
        <p class="text-size--1 mb-space-3xs">
          Potencia Eléctrica <span class="input-suffix">( W )</span>
        </p>
        <div class="d-flex">
          <input
            type="number"
            v-model="power"
            placeholder="Ej: 1500"
            min="0"
            max="3500"
            step="50" />
        </div>
        <small class="text-size--2 absolute">Máx. Recomendado: 3500W</small>
      </div>

      <div class="box-input d-flex relative">
        <p class="text-size--1 mb-space-3xs">Horas de uso Diario</p>
        <div class="d-flex">
          <input
            type="number"
            v-model="hours"
            placeholder="Ej: 2.5"
            min="0.5"
            max="24"
            step="0.5" />
        </div>
        <small class="text-size--2 absolute">Usa punto decimal (ej: 1.5)</small>
      </div>
    </div>
    <div class="button-group d-flex">
      <button class="btn" data-type="accent" @click="handleCalculate">
        Calcular consumo
      </button>
      <button class="btn" @click="resetForm">Reiniciar</button>
    </div>
  </div>
  <div class="results">
    <h2 class="text-size-1 text-accent-500 mt-space-l">Resultados</h2>
    <small v-if="priceData.lastUpdated" class="text-size--2 text-primary-200">
      Precio actualizado: {{ formattedDate }} ({{
        priceData.currentPrice?.toFixed(4)
      }}
      €/kWh)
    </small>
    <div class="d-flex mt-space-s">
      <div>
        <h3 class="text-size--1">Consumo Diario</h3>
        <span class="text-size-2 fw-700">{{ results.dailyKwh }} kWh</span>
      </div>
      <div>
        <h3 class="text-size--1">Costo Diario</h3>
        <span class="text-size-2 fw-700">{{ results.dailyCost }} €</span>
      </div>
      <div>
        <h3 class="text-size--1">Costo Mensual</h3>
        <span class="text-size-2 fw-700">{{ results.monthlyCost }} €</span>
      </div>
      <div>
        <h3 class="text-size--1">Costo Anual</h3>
        <span class="text-size-2 fw-700">{{ results.annualCost }} €</span>
      </div>
    </div>
  </div>
  <div class="chart-wrapper">
      <PriceChart v-if="priceData.prices.length" :prices="priceData.prices" :last-updated="priceData.lastUpdated"
      :current-price="priceData.currentPrice" />
      <div v-else>Cargando gráfico...</div>
    </div>
</template>

<script setup>
  import { ref, computed, watch, onMounted } from 'vue';
import PriceChart from './PriceChart.vue'; 
  const priceData = ref({
    currentPrice: null,
    lastUpdated: null,
    prices: [],
    minPrice: null,
    maxPrice: null,
  });

  const dropdown = ref(null);
  const isDropdownOpen = ref(false);
  const selectedAppliance = ref('');
  const power = ref('');
  const hours = ref('');

  const results = ref({
    dailyKwh: '0.0000',
    dailyCost: '0.000',
    monthlyCost: '0.000',
    annualCost: '0.000',
  });

  const formattedDate = computed(() => {
    if (!priceData.value.lastUpdated) return '';

    const date = new Date(priceData.value.lastUpdated);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  });

  const appliances = [
    {
      value: 50,
      label: 'Bombilla LED',
      watts: '50W',
      image: '/images/bombilla.jpg',
    },
    {
      value: 150,
      label: 'Portátil',
      watts: '150W',
      image: '/images/laptop.jpg',
    },
    {
      value: 300,
      label: 'Televisor 50"',
      watts: '300W',
      image: '/images/tv.jpg',
    },
    {
      value: 800,
      label: 'Microondas',
      watts: '800W',
      image: '/images/microwave.jpg',
    },
    {
      value: 1200,
      label: 'Secador de pelo',
      watts: '1200W',
      image: '/images/hair-dryer.jpg',
    },
    {
      value: 2000,
      label: 'Lavadora',
      watts: '2000W',
      image: '/images/washing-machine.jpg',
    },
    {
      value: 'custom',
      label: 'Personalizado',
      watts: '',
      image: '/images/personalizado.jpg',
    },
  ];

  // Computed properties
  const isCustomAppliance = computed(
    () => selectedAppliance.value === 'custom'
  );
  const selectedApplianceLabel = computed(() => {
    const appliance = appliances.find(
      (a) => a.value === selectedAppliance.value
    );
    return appliance?.label || '';
  });

  // Watchers
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
        maxPrice: data.maxPrice,
      };
    } catch (error) {
      console.error('Error fetching prices:', error);
      alert('⚠️ No se pudieron cargar los precios actuales');
    }
  });

  // Functions
  const handleCalculate = () => {
    // Validar campos vacíos
    if (!power.value || !hours.value) {
      alert('⚠️ Debes completar todos los campos requeridos');
      return;
    }

    // Validar tipo de datos numéricos
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

  const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value;
  };

  const selectAppliance = (value) => {
    selectedAppliance.value = value;
    isDropdownOpen.value = false;
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
    @media (min-width: 64em) {
      display: grid;
      gap: var(--space-m);
      grid-template-columns: 1fr 1fr;
    }
    @media (min-width: 90em) {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }
  .button-group {
    --vertical-alignment: flex-end;
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
    @media (min-width: 768px) {
      grid-template-columns: 1fr 1fr;
      gap: var(--space-s);
    }
  }
  .box-input {
    flex-direction: column;
    --vertical-alignment: stretch;
    --gutter: 0;
  }
  .box-input input {
    padding: 8px 12px;
    border-radius: 4px;
    color: #333;
    background-color: var(--neutral-50);
  }
  .box-input > small {
    bottom: calc(var(--space-s) * -1);
  }

  .box-input > div {
    flex-grow: 1;
    --vertical-alignment: stretch;
  }

  .custom-select {
    position: relative;
    width: 100%;
    border: 1px solid #d9d9d9;
    background-color: var(--neutral-50);
    border-radius: 4px;
    padding: 8px 12px;
    cursor: pointer;
  }
  .selected-appliance {
    color: var(--primary-900);
  }
  .select-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dropdown-options {
    position: absolute;
    width: 100%;
    left: 0;
    top: 100%;
    margin-top: 4px;
    background: white;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1;
    max-height: 300px;
    overflow-y: auto;
  }

  .dropdown-option {
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.3s;
  }

  .dropdown-option:hover {
    background: #f5f5f5;
  }

  .result-item {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    text-align: center;
  }

  .appliance-name {
    font-weight: 500;
    color: var(--primary-900);
  }

  .power-consumption {
    color: #666;
    font-size: 0.875rem;
  }

  .update-info {
    display: block;
    color: #666;
    margin-top: 0.5rem;
  }
</style>

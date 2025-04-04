<template>
    <div class="calculator">
      <div class="price-info">
        <h3>
          💡 Precio electricidad: <span class="highlight">
            {{ formattedPrice }}
          </span>/kWh
        </h3>
        <p class="disclaimer">
          {{ priceSourceText }}
          Actualizado: {{ formattedUpdateTime }}
        </p>
      </div>
  
      <form @submit.prevent="calculateConsumption">
        <div class="input-group">
          <label for="applianceSelect">Selecciona un electrodoméstico:</label>
          <select
            id="applianceSelect"
            v-model="selectedAppliance"
            class="full-width custom-select"
          >
            <option value="">-- Elegir de la lista --</option>
            <option value="50">💡 Bombilla LED (50W)</option>
            <option value="150">💻 Portátil (150W)</option>
            <option value="300">📺 Televisor 50" (300W)</option>
            <option value="800">🍲 Microondas (800W)</option>
            <option value="1200">🌪️ Secador pelo (1200W)</option>
            <option value="2000">🧺 Lavadora (2000W)</option>
            <option value="custom">⚙️ Personalizado</option>
          </select>
        </div>
  
        <div class="input-group">
          <label for="power">Potencia eléctrica:</label>
          <input
            type="number"
            id="power"
            v-model.number="power"
            placeholder="Ej: 1500 (vatios)"
            :disabled="!isCustomAppliance"
            step="50"
            min="0"
            class="full-width"
          />
          <small class="helper-text">Máx. recomendado: 3500W</small>
        </div>
  
        <div class="input-group">
          <label for="hours">Horas de uso diario:</label>
          <input
            type="number"
            id="hours"
            v-model.number="hours"
            placeholder="Ej: 2.5 horas"
            min="0.5"
            step="0.5"
            class="full-width"
          />
          <small class="helper-text">Usa punto decimal (ej: 1.5)</small>
        </div>
  
        <div class="actions">
          <button type="submit" class="calculate-btn" :disabled="isLoading">
            <span class="btn-text" :style="{ visibility: isLoading ? 'hidden' : 'visible' }">
              📊 Calcular consumo
            </span>
            <span class="loading-spinner" :style="{ display: isLoading ? 'inline-block' : 'none' }"></span>
          </button>
          <button type="button" class="reset-btn" @click="resetForm">🔄 Reiniciar</button>
        </div>
      </form>
  
      <div class="result">
        <h3>📈 Resultados:</h3>
        <div class="result-item">
          <span>Consumo diario:</span>
          <span id="kwh">{{ results.dailyKwh }} kWh</span>
        </div>
        <div class="result-item">
          <span>Costo diario:</span>
          <span id="dailyCost">{{ results.dailyCost }} €</span>
        </div>
        <div class="result-item">
          <span>Costo mensual:</span>
          <span id="monthlyCost">{{ results.monthlyCost }} €</span>
        </div>
        <div class="result-item">
          <span>Costo anual:</span>
          <span id="annualCost">{{ results.annualCost }} €</span>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, computed, onMounted,watch } from 'vue';
  
  const props = defineProps({
    initialPower: {
      type: String,
      default: ''
    }
  });
  
  const priceData = reactive({
    currentPrice: 0.15,
    lastUpdated: new Date().toISOString(),
    source: 'historical',
  });
  
  const selectedAppliance = ref('');
  const power = ref(props.initialPower || '');
  const hours = ref(1);
  const isLoading = ref(false);
  const results = reactive({
    dailyKwh: '0.00',
    dailyCost: '0.00',
    monthlyCost: '0.00',
    annualCost: '0.00',
  });
  
  // Formateadores
  const formatter = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 4,
  });
  
  const formattedPrice = computed(() => 
    priceData.currentPrice.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    })
  );
  
  const formattedUpdateTime = computed(() => 
    new Date(priceData.lastUpdated).toLocaleTimeString('es-ES')
  );
  
  const priceSourceText = computed(() => {
    if (priceData.source === 'historical') return 'Datos históricos - ';
    if (priceData.source === 'cache') return 'Datos cacheados - ';
    return '';
  });
  
  const isCustomAppliance = computed(() => 
    selectedAppliance.value === 'custom'
  );
  
  // Cargar datos de precio
  onMounted(async () => {
    try {
      const apiUrl = new URL('/api/prices', window.location.origin);
      const response = await fetch(apiUrl, {
        headers: { Accept: 'application/json' },
      });
  
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
  
      const apiData = await response.json();
      Object.assign(priceData, {
        currentPrice: apiData.currentPrice,
        lastUpdated: apiData.lastUpdated,
        source: 'api',
      });
    } catch (error) {
      console.error('Error fetching price data:', error.message || error);
    }
  });
  
  // Calculos
  const calculateConsumption = async () => {
    isLoading.value = true;
    
    const powerValue = parseFloat(power.value) || 0;
    const hoursValue = parseFloat(hours.value) || 0;
  
    if (powerValue <= 0 || hoursValue <= 0) {
      alert('⚠️ Valores deben ser mayores que cero');
      isLoading.value = false;
      return;
    }
  
    await new Promise(resolve => setTimeout(resolve, 300));
  
    const kwh = (powerValue * hoursValue) / 1000;
    const daily = kwh * priceData.currentPrice;
  
    results.dailyKwh = kwh.toFixed(4);
    results.dailyCost = formatter.format(daily);
    results.monthlyCost = formatter.format(daily * 30);
    results.annualCost = formatter.format(daily * 365);
  
    isLoading.value = false;
  };
  
  // Reset
  const resetForm = () => {
    selectedAppliance.value = '';
    power.value = props.initialPower || '';
    hours.value = 1;
    Object.assign(results, {
      dailyKwh: '0.00',
      dailyCost: '0.00',
      monthlyCost: '0.00',
      annualCost: '0.00',
    });
  };
  
  // Actualizar potencia cuando cambia el select
  watch(selectedAppliance, (newVal) => {
    if (newVal && newVal !== 'custom') {
      power.value = newVal;
    }
  });
  </script>
  
  <style scoped>
  /* Todos los estilos originales se mantienen igual */
  :root {
    --primary: #2196f3;
    --secondary: #27ae60;
    --background: #f8f9fa;
  }
  
  .calculator {
    max-width: 600px;
    margin: 2rem auto;
    padding: 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .price-info {
    text-align: center;
    padding: 1rem;
    margin-bottom: 2rem;
    background: var(--background);
    border-radius: 8px;
  }
  
  .highlight {
    color: var(--accent-500);
    font-weight: 600;
  }
  
  .disclaimer {
    font-size: 0.85rem;
    color: #666;
    margin-top: 0.5rem;
  }
  
  .input-group {
    margin-bottom: 1.5rem;
  }
  
  .full-width {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 6px;
    font-size: 1rem;
  }
  
  .custom-select {
    &,
    &::picker(select) {
      appearance: base-select;
    }
  }
  
  .helper-text {
    display: block;
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: #666;
  }
  
  .actions {
    display: grid;
    gap: 1rem;
    margin-top: 2rem;
  }
  
  button {
    padding: 1rem;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: transform 0.1s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  button:active {
    transform: scale(0.98);
  }
  
  .calculate-btn {
    background: var(--primary);
    color: white;
  }
  
  .reset-btn {
    background: #e2e8f0;
    color: #2d3748;
  }
  
  .result {
    margin-top: 2rem;
    padding: 1.5rem;
    background: var(--background);
    border-radius: 8px;
  }
  
  .result-item {
    display: flex;
    justify-content: space-between;
    margin: 0.5rem 0;
    padding: 0.75rem;
    background: white;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  .loading-spinner {
    display: none;
    width: 1.2rem;
    height: 1.2rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  @media (max-width: 480px) {
    .calculator {
      padding: 1.5rem;
      margin: 1rem;
    }
  
    .result-item {
      flex-direction: column;
      gap: 0.3rem;
    }
  }
  </style>
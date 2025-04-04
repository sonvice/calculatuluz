<template>
    <div class="d-grid">
      <div>
        <p class="text-size--1 mb-space-3xs">Selecciona un electrodoméstico</p>
        <a-select
          v-model:value="selectedAppliance"
          size="large"
          class="custom-select"
          placeholder="-- Elegir de la lista --"
        >
          <a-select-option value="" disabled>
            <div class="d-flex">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings-icon lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> Elegir electrodoméstico
            </div>
          </a-select-option>
          
          <a-select-option
            v-for="appliance in appliances"
            :key="appliance.value"
            :value="appliance.value"
          >
            <div class="d-flex option-content">
              <img 
                :src="appliance.image" 
                alt="icono"
                width="24"
              />
              <div class="d-flex">
                <span class="appliance-name">{{ appliance.label }}</span>
                <span class="power-consumption">{{ appliance.watts }}</span>
              </div>
            </div>
          </a-select-option>
        </a-select>
      </div>
  
      <div>
        <p class="text-size--1 mb-space-3xs">Potencia Eléctrica</p>
        <a-input-number
          v-model:value="power"
          size="large"
          :min="0"
          :max="3500"
          :step="50"
          :disabled="!isCustomAppliance"
          placeholder="Ej: 1500"
          addon-after="W"
          class="full-width"
        />
        <small class="text-size--2">Máx. Recomendado: 3500W</small>
      </div>
  
      <div>
        <p class="text-size--1 mb-space-3xs">Horas de uso Diario</p>
        <a-input-number
          v-model:value="hours"
          size="large"
          :min="0.5"
          :max="24"
          :step="0.5"
          placeholder="Ej: 2.5"
        />
        <small class="text-size--2">Usa punto decimal (ej: 1.5)</small>
      </div>
  
      <div class="d-flex">
        <a-button type="primary" size="large" @click="calculateConsumption">Calcular consumo</a-button>
        <a-button type="default" size="large" @click="resetForm">Reiniciar</a-button>
      </div>
  
    </div>
    <div>
      <h2 class="text-size-1 text-accent-500 mt-space-l">Resultados</h2>
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
  </template>
  
  <script setup>
  import { ref, computed, watch } from 'vue';
  import { Select, InputNumber, message } from 'ant-design-vue';
  
  const ASelect = Select;
  const PRECIO_KWH = 0.15; // Precio fijo del kWh
  
  const selectedAppliance = ref('');
  const power = ref('');
  const hours = ref('');
  
  const results = ref({
    dailyKwh: '0.0000',
    dailyCost: '0,0000',
    monthlyCost: '0,0000',
    annualCost: '0,0000'
  });
  
  const appliances = [
    {
      value: 50,
      label: 'Bombilla LED',
      watts: '50W',
      image: '/images/bombilla.jpg'
    },
    {
      value: 150,
      label: 'Portátil',
      watts: '150W',
      image: '/images/laptop.jpg'
    },
    {
      value: 300,
      label: 'Televisor 50"',
      watts: '300W',
      image: '/images/tv.jpg'
    },
    {
      value: 800,
      label: 'Microondas',
      watts: '800W',
      image: '/images/microwave.jpg'
    },
    {
      value: 1200,
      label: 'Secador de pelo',
      watts: '1200W',
      image: '/images/hair-dryer.jpg'
    },
    {
      value: 2000,
      label: 'Lavadora',
      watts: '2000W',
      image: '/images/washing-machine.jpg'
    },
    {
      value: 'custom',
      label: 'Personalizado',
      watts: '',
      image: '/images/personalizado.jpg'
    }
  ];
  
  const isCustomAppliance = computed(() => 
    selectedAppliance.value === 'custom'
  );
  
  watch(selectedAppliance, (newVal) => {
    if (newVal && newVal !== 'custom') {
      power.value = newVal;
    }
  });
  
  const calculateConsumption = () => {
    if (!power.value || !hours.value) {
      message.error('⚠️ Completa todos los campos requeridos');
      return;
    }
  
    const powerValue = parseFloat(power.value);
    const hoursValue = parseFloat(hours.value);
  
    if (isNaN(powerValue)) {
      message.error('⚠️ Ingresa una potencia válida');
      return;
    }
  
    if (powerValue > 3500) {
      message.error('⚠️ La potencia máxima permitida es 3500W');
      return;
    }
  
    if (powerValue <= 0 || hoursValue <= 0) {
      message.error('⚠️ Los valores deben ser mayores que cero');
      return;
    }
  
    const kwh = (powerValue * hoursValue) / 1000;
    const dailyCost = kwh * PRECIO_KWH;
  
    results.value = {
      dailyKwh: kwh.toFixed(4),
      dailyCost: dailyCost.toFixed(4),
      monthlyCost: (dailyCost * 30).toFixed(4),
      annualCost: (dailyCost * 365).toFixed(4)
    };
  };
  
  const resetForm = () => {
    selectedAppliance.value = '';
    power.value = '';
    hours.value = '';
    results.value = {
      dailyKwh: '0.0000',
      dailyCost: '0,0000',
      monthlyCost: '0,0000',
      annualCost: '0,0000'
    };
  };
  </script>
  
  <style scoped>
  .appliance-icon {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }
  
  .custom-select {
    min-width: 16rem;
    width: 100%;
  }
  
  </style>
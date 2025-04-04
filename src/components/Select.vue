<template>
  <div class="d-grid">
    <div>
      <p class="text-size--1 mb-space-3xs">Selecciona un electrodoméstico</p>
    
    <a-select
      v-model:value="selectedValue"
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
    <a-input v-model:value.lazy="value1" size="large" autofocus placeholder="Lazy usage" />
    <small class="text-size--2">Máx. Recomendado:3500W</small>
  </div>
  <div>
    <p class="text-size--1 mb-space-3xs">Horas de uso Diario</p>
    <a-input v-model:value.lazy="value1" size="large" autofocus placeholder="Lazy usage" />
    <small class="text-size--2">Usa punto decimal (ej: 1.5)</small>
  </div>
    <div class="d-flex">
      <a-button type="primary" size="large" @click="handleClick">Calcular consumo</a-button>
      <a-button type="default" size="large" @click="handleClick">Reiniciar</a-button>
    </div>
  </div>
  <div>
    <h2 class="text-size-1 text-accent-500 mt-space-l">Resultados</h2>
    <div class="d-flex mt-space-s">
      <div>
        <h3 class="text-size--1">Consumo Diario</h3>
        <span class="text-size-2 fw-700">0.0500 kWh</span>
      </div>
      <div>
        <h3 class="text-size--1">Costo Diario</h3>
        <span class="text-size-2 fw-700">0,0138 €</span>
      </div>
      <div>
        <h3 class="text-size--1">Costo Mensual</h3>
        <span class="text-size-2 fw-700">0,4134 €</span>
      </div>
      <div>
        <h3 class="text-size--1">Costo Anual</h3>
        <span class="text-size-2 fw-700">5,0297 €</span>
      </div>

    </div>
  </div>
  </template>
  <script setup>
import { Select } from 'ant-design-vue';
const ASelect = Select;
import { ref } from 'vue';
const selectedValue = ref('');

const appliances = [
  {
    value: 50,
    label: 'Bombilla LED',
    watts: '50W',
    image: '/images/bombilla.jpg' // Coloca tus imágenes en public/images
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
  </script>

<style scoped>

.appliance-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}
.custom-select{
    min-width: 16rem;
    width: 100%;
}

</style>
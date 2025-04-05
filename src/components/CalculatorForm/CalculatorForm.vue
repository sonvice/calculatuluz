<template>
    <div class="calculator-form">
      <div class="form-section">
        <ApplianceSelect
          v-model="selectedAppliance"
          :appliances="appliances"
        />
      </div>
  
      <div class="form-section">
        <BaseInput
          :model-value="power"
          label="Potencia Eléctrica"
          placeholder="Ej: 1500"
          :min="0"
          :max="3500"
          :step="50"
          suffix="W"
          hint="Máx. Recomendado: 3500W"
          :validator="validatePower"
        />
      </div>
  
      <div class="form-section">
        <BaseInput
          :model-value="hours"
          label="Horas de uso Diario"
          placeholder="Ej: 2.5"
          :min="0.5"
          :max="24"
          :step="0.5"
          hint="Usa punto decimal (ej: 1.5)"
          :validator="validateHours"
        />
      </div>
  
      <div class="action-buttons">
        <BaseButton type="accent" @click="emitCalculate">Calcular consumo</BaseButton>
        <BaseButton @click="emitReset">Reiniciar</BaseButton>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import BaseInput from '../base/BaseInput.vue';
  import BaseButton from '../base/BaseButton.vue';
  import ApplianceSelect from '../ApplianceSelect/ApplianceSelect.vue';
  
  interface Props {
    selectedAppliance: string | number;
    power: number | string;
    hours: number | string;
    appliances: Array<{
      value: string | number;
      label: string;
      watts: string;
      image: string;
    }>;
  }
  
  defineProps(['selectedAppliance', 'power', 'hours']);
  
  const emit = defineEmits([
    'update:selectedAppliance',
    'update:power',
    'update:hours',
    'calculate',
    'reset'
  ]);
  
  const validatePower = (value: number) => {
    return value >= 0 && value <= 3500;
  };
  
  const validateHours = (value: number) => {
    return value >= 0.5 && value <= 24;
  };
  
  const emitCalculate = () => {
    emit('calculate');
  };
  
  const emitReset = () => {
    emit('reset');
  };

  const appliances: Appliance[] = [
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

  </script>
  
  <style scoped>
  .calculator-form {
    display: grid;
    gap: 1.5rem;
  }
  
  .form-section {
    margin-bottom: 1rem;
  }
  
  .action-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  </style>
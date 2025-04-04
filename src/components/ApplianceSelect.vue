<template>
    <div class="custom-select" ref="dropdown">
      <div class="select-header" @click="toggleDropdown">
        <div v-if="!modelValue" class="placeholder d-flex">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path
              d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Elegir electrodoméstico
        </div>
        <div v-else class="selected-appliance">
          {{ selectedLabel }}
        </div>
      </div>
      <div v-show="isOpen" class="dropdown-options">
        <div v-for="appliance in appliances" :key="appliance.value" class="dropdown-option"
          @click="select(appliance.value)">
          <img :src="appliance.image" alt="icono" width="24" />
          <div class="option-details">
            <span class="appliance-name">{{ appliance.label }}</span>
            <span class="power-consumption">{{ appliance.watts }}</span>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue';
  
  const props = defineProps({
    appliances: Array,
    modelValue: [String, Number]
  });
  
  const emit = defineEmits(['update:modelValue']);
  
  const dropdown = ref(null);
  const isOpen = ref(false);
  
  const selectedLabel = computed(() => {
    return props.appliances.find(a => a.value === props.modelValue)?.label || '';
  });
  
  const toggleDropdown = () => {
    isOpen.value = !isOpen.value;
  };
  
  const select = (value) => {
    emit('update:modelValue', value);
    isOpen.value = false;
  };
  </script>
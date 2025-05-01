<template>
  <div class="custom-select text-primary-200" ref="dropdown">
    <div class="select-header" @click="toggleDropdown">
      <div v-if="!selectedLabel" class="placeholder d-flex">
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
        {{ selectedLabel }}
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
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  appliances: {
    type: Array,
    required: true
  },
  modelValue: {
    type: [Number, String],
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const isDropdownOpen = ref(false);
const dropdown = ref(null);

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const selectAppliance = (value) => {
  emit('update:modelValue', value);
  isDropdownOpen.value = false;
};

const selectedLabel = computed(() => {
  const appliance = props.appliances.find(a => a.value === props.modelValue);
  return appliance ? appliance.label : '';
});
</script>

<style scoped>
.custom-select {
  position: relative;
  width: 100%;
  border: 1px solid #d9d9d9;
  background-color: var(--neutral-50);
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
}
.select-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.selected-appliance {
  color: var(--primary-900);
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
.appliance-name {
  font-weight: 500;
  color: var(--primary-900);
}
.power-consumption {
  color: #666;
  font-size: 0.875rem;
}
</style>

<template>
  <div class="custom-select" ref="dropdownRef">
    <div class="select-header" @click="toggleDropdown">
      <div v-if="!modelValue" class="placeholder d-flex">
        <!-- <SettingsIcon /> -->
        Elegir electrodoméstico
      </div>
      <div v-else class="selected-appliance">
        {{ selectedApplianceLabel }}
      </div>
    </div>
    <Transition name="dropdown">
      <div v-show="isOpen" class="dropdown-options">
        <div
          v-for="appliance in appliances"
          :key="appliance.value"
          class="dropdown-option"
          @click="selectAppliance(appliance.value)">
          <img :src="appliance.image" alt="icono" width="24" />
          <div class="option-details">
            <span class="appliance-name">{{ appliance.label }}</span>
            <span class="power-consumption">{{ appliance.watts }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  /* import SettingsIcon from './SettingsIcon.vue'; */

  interface Appliance {
    value: string | number;
    label: string;
    watts: string;
    image: string;
  }

  interface Props {
    modelValue: string | number;
    appliances: Appliance[];
  }

  const props = defineProps<Props>();
  const emit = defineEmits<{
    (e: 'update:modelValue', value: string | number): void;
  }>();

  const dropdownRef = ref<HTMLElement | null>(null);
  const isOpen = ref(false);

  const selectedApplianceLabel = computed(() => {
    return (
      props.appliances.find((a) => a.value === props.modelValue)?.label || ''
    );
  });

  const toggleDropdown = () => {
    isOpen.value = !isOpen.value;
  };

  const selectAppliance = (value: string | number) => {
    emit('update:modelValue', value);
    isOpen.value = false;
  };

  const clickOutsideHandler = (event: MouseEvent) => {
    if (
      dropdownRef.value &&
      !dropdownRef.value.contains(event.target as Node)
    ) {
      isOpen.value = false;
    }
  };

  onMounted(() => {
    document.addEventListener('click', clickOutsideHandler);
  });

  onUnmounted(() => {
    document.removeEventListener('click', clickOutsideHandler);
  });
</script>

<style scoped>
  /* Mantener tus estilos originales */
  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: opacity 0.2s, transform 0.2s;
    transform-origin: top center;
  }

  .dropdown-enter-from,
  .dropdown-leave-to {
    opacity: 0;
    transform: scaleY(0.95);
  }
</style>

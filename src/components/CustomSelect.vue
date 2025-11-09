<template>
  <div class="custom-select-wrapper">
    <select :id="id" :name="name" ref="selectElement" :aria-describedby="ariaDescribedby">
      <!-- SlimSelect generará las opciones dinámicamente -->
    </select>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import SlimSelect from 'slim-select';
import 'slim-select/styles'

const props = defineProps({
  appliances: {
    type: Array,
    required: true
  },
  modelValue: {
    type: [Number, String],
    default: ''
  },
  id: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    default: ''
  },
  ariaDescribedby: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const selectElement = ref(null);
let slimSelect = null;

// Transformar appliances a formato SlimSelect
const transformApplianceToOption = (appliance) => ({
  text: appliance.label,
  value: appliance.value.toString(),
  html: `
    <div class="slim-option-content d-flex">
      <img src="${appliance.image}" alt="${appliance.label}" width="24" height="24" />
      <div class="option-details">
        <span class="appliance-name">${appliance.label}</span>
        <span class="power-consumption">${appliance.watts}</span>
      </div>
    </div>
  `,
  data: {
    originalData: appliance
  }
});

// Configuración personalizada para SlimSelect
const getSlimSelectConfig = () => ({
  select: selectElement.value,
  settings: {
    showSearch: false,
    placeholderText: `
      <div class="placeholder-content">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        Elegir electrodoméstico
      </div>
    `,
    allowDeselect: false,
    closeOnSelect: true,
    contentPosition: 'absolute',
    openPosition: 'auto'
  },
  events: {
    afterChange: (newVal) => {
      if (newVal && newVal.length > 0) {
        const selectedValue = newVal[0].value;
        emit('update:modelValue', selectedValue);
      } else {
        emit('update:modelValue', '');
      }
    }
  }
});

// Inicializar SlimSelect
const initializeSlimSelect = () => {
  if (!selectElement.value) return;

  // Limpiar instancia previa si existe
  if (slimSelect) {
    slimSelect.destroy();
  }

  // Configurar datos iniciales
  const initialData = props.appliances.map(transformApplianceToOption);

  slimSelect = new SlimSelect({
    ...getSlimSelectConfig(),
    data: initialData
  });

  // Establecer valor inicial si existe
  if (props.modelValue) {
    const stringValue = props.modelValue.toString();
    slimSelect.setSelected([stringValue]);
  }
};

onMounted(() => {
  nextTick(() => {
    initializeSlimSelect();
  });
});

// Actualizar cuando cambien los appliances
watch(() => props.appliances, (newAppliances) => {
  if (slimSelect && newAppliances.length > 0) {
    const newData = newAppliances.map(transformApplianceToOption);
    slimSelect.setData(newData);

    // Restaurar la selección actual si existe
    if (props.modelValue) {
      const stringValue = props.modelValue.toString();
      slimSelect.setSelected([stringValue]);
    }
  }
}, { deep: true });

// Sincronizar con v-model
watch(() => props.modelValue, (newValue) => {
  if (slimSelect && newValue !== undefined && newValue !== null) {
    const stringValue = newValue.toString();
    const currentSelected = slimSelect.getSelected();

    if (currentSelected.length === 0 || currentSelected[0] !== stringValue) {
      slimSelect.setSelected([stringValue]);
    }
  }
});

// Destruir instancia al desmontar
onBeforeUnmount(() => {
  if (slimSelect) {
    slimSelect.destroy();
    slimSelect = null;
  }
});
</script>

<style scoped>
.custom-select-wrapper {
  width: 100%;
  position: relative;
}

/* Ocultar el select nativo */
.custom-select-wrapper select {
  display: none;
}


:deep(.ss-main) {
  --ss-main-height: 46px;
  border: 2px solid var(--primary-500);
}

:deep(.ss-main:focus) {
  --ss-focus-color: var(--accent-500);
}

:deep(.ss-option .ss-selected .ss-option-content) {

  --ss-primary-color: var(--accent-500) !important;
  background-color: var(--accent-50);
}

.slim-option-content {
  display: flex;
  gap: var(--space-s);
}

</style>

<template>
  <div class="custom-select-wrapper">
    <select :id="id" :name="name" ref="selectElement" :aria-describedby="ariaDescribedby">
    </select>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import SlimSelect from 'slim-select';
import 'slim-select/styles'

// Definimos los SVGs crudos para SlimSelect (ya que no acepta componentes Vue dentro del string HTML)
const iconMap = {
  Lightbulb: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
  Laptop: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></svg>',
  MonitorPlay: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10 7 5 3-5 3z"/><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>',
  Tv: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>',
  Fan: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z"/><path d="M12 12v.01"/></svg>',
  Refrigerator: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6Z"/><path d="M5 10h14"/><path d="M15 7v6"/></svg>',
  Utensils: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>',
  CookingPot: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="m4 8 16-4"/><path d="m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.55a2 2 0 0 1 2.43 1.46l.45 1.8"/></svg>',
  Microwave: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="15" x="2" y="4" rx="2"/><path d="M6 8h7v7H6z"/><path d="M6 12h7"/><path d="M18 8v7"/><path d="M18 12h0"/></svg>',
  Heater: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 8h-2"/><path d="M2 12h20"/><path d="M20 16h-2"/><path d="M4 8h2"/><path d="M4 16h2"/><path d="M8 4v16"/><path d="M16 4v16"/><path d="M12 4v16"/></svg>',
  Droplets: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>',
  WashingMachine: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h3"/><path d="M17 6h.01"/><rect width="18" height="20" x="3" y="2" rx="2"/><circle cx="12" cy="13" r="5"/><path d="M12 18a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 1 0-5"/></svg>',
  Shirt: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>',
  AirVent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 8h12"/><path d="M18.3 17.7a2.5 2.5 0 0 1-3.16 3.83 2.53 2.53 0 0 1-1.14-2V12"/><path d="M6.6 15.6A2 2 0 1 0 10 17v-5"/></svg>',
  ThermometerSun: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9a4 4 0 0 0-2 7.5M12 3v2M6.6 18.4l-1.4 1.4M20 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0ZM4 13H2M6.34 4.6l-1.4-1.4"/></svg>',
  Waves: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>',
  Settings: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  Cpu: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>'
};

// ... props y emits ... (se mantienen igual)
const props = defineProps({
  appliances: { type: Array, required: true },
  modelValue: { type: [Number, String], default: '' },
  id: { type: String, default: '' },
  name: { type: String, default: '' },
  ariaDescribedby: { type: String, default: '' }
});
const emit = defineEmits(['update:modelValue']);
const selectElement = ref(null);
let slimSelect = null;

// Transformar appliances a formato SlimSelect (USANDO EL ICONO SVG)
const transformApplianceToOption = (appliance) => {
  const iconSvg = iconMap[appliance.icon] || iconMap['Settings'];

  // --- CORRECCIÓN AQUÍ ---
  // Usamos 'slug' como ID único. Si es 'custom' (que no tiene slug), usamos su value.
  const uniqueId = appliance.slug || appliance.value;

  return {
    text: appliance.label,
    value: uniqueId.toString(), // Ahora el value es 'lavadora', 'radiador', etc.
    html: `
      <div class="slim-option-content d-flex align-items-center">
        <span class="appliance-icon text-accent-500">${iconSvg}</span>
        <div class="option-details">
          <span class="appliance-name">${appliance.label}</span>
          ${appliance.watts ? `<span class="power-consumption text-neutral-400 text-size--1">${appliance.watts}</span>` : ''}
        </div>
      </div>
    `,
    data: { originalData: appliance }
  };
};

const getSlimSelectConfig = () => ({
  select: selectElement.value,
  settings: {
    showSearch: false,
    placeholderText: 'Elegir electrodoméstico',
    allowDeselect: false,
    closeOnSelect: true
  },
  events: {
    afterChange: (newVal) => {
      if (newVal && newVal.length > 0) {
        emit('update:modelValue', newVal[0].value);
      } else {
        emit('update:modelValue', '');
      }
    }
  }
});

const initializeSlimSelect = () => {
  if (!selectElement.value) return;
  if (slimSelect) slimSelect.destroy();

  const initialData = props.appliances.map(transformApplianceToOption);

  slimSelect = new SlimSelect({
    ...getSlimSelectConfig(),
    data: initialData
  });

  if (props.modelValue) {
    slimSelect.setSelected([props.modelValue.toString()]);
  }
};

onMounted(() => {
  nextTick(() => initializeSlimSelect());
});

watch(() => props.appliances, (newAppliances) => {
  if (slimSelect && newAppliances.length > 0) {
    const newData = newAppliances.map(transformApplianceToOption);
    slimSelect.setData(newData);
    if (props.modelValue) slimSelect.setSelected([props.modelValue.toString()]);
  }
}, { deep: true });

watch(() => props.modelValue, (newValue) => {
  if (slimSelect && newValue !== undefined) {
    const strVal = newValue.toString();
    const current = slimSelect.getSelected();
    if (current.length === 0 || current[0] !== strVal) {
      slimSelect.setSelected([strVal]);
    }
  }
});

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

/* ─── Trigger (dentro del scope de Vue) ───────────────────────────── */
:deep(.ss-main) {
  background-color: var(--primary-800);
  border: 1px solid var(--primary-600);
  border-radius: var(--rounded-md);
  color: var(--neutral-50);
  min-height: 48px;
  padding: 6px 12px;
  font-size: var(--size-0);
  font-family: inherit;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
:deep(.ss-main:focus),
:deep(.ss-main.ss-open) {
  border-color: var(--primary-400);
  box-shadow: 0 0 0 3px hsl(222, 36%, 46%, 0.3);
  outline: none;
}
:deep(.ss-main.ss-dir-below) {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
:deep(.ss-main.ss-dir-above) {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
:deep(.ss-arrow path) {
  stroke: var(--neutral-400);
  stroke-width: 20;
  transition: stroke 0.18s ease;
}
:deep(.ss-main.ss-open .ss-arrow path) {
  stroke: var(--neutral-50);
}
</style>

<!-- slim-select appends .ss-content to <body>, not inside the wrapper — must use global selectors -->
<style>
/* ─── Panel ────────────────────────────────────────────────────────── */
.ss-content {
  background-color: hsl(218, 60%, 25%) !important;
  border: 1px solid hsl(219, 62%, 33%) !important;
  border-radius: 8px !important;
  box-shadow: 0 12px 40px rgba(0, 10, 36, 0.65) !important;
  overflow: hidden;
}
.ss-content.ss-dir-below {
  border-top: none !important;
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
}
.ss-content.ss-dir-above {
  border-bottom: none !important;
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

/* scrollbar */
.ss-list {
  scrollbar-width: thin;
  scrollbar-color: hsl(219, 62%, 33%) transparent;
}
.ss-list::-webkit-scrollbar { width: 4px; }
.ss-list::-webkit-scrollbar-track { background: transparent; }
.ss-list::-webkit-scrollbar-thumb {
  background-color: hsl(219, 62%, 33%);
  border-radius: 4px;
}

/* ─── Opciones ─────────────────────────────────────────────────────── */
.ss-content .ss-list .ss-option {
  background-color: hsl(218, 60%, 25%) !important;
  color: #e9e9e9 !important;
  padding: 10px 14px !important;
  border-left: 3px solid transparent !important;
  transition: background-color 0.15s ease, border-left-color 0.15s ease;
}
.ss-content .ss-list .ss-option + .ss-option {
  border-top: 1px solid hsl(219, 70%, 29%, 0.4);
}
.ss-content .ss-list .ss-option:hover:not(.ss-disabled) {
  background-color: hsl(219, 70%, 29%) !important;
  border-left-color: hsl(153, 84%, 38%) !important;
  color: #f5f5f5 !important;
}
.ss-content .ss-list .ss-option.ss-highlighted,
.ss-content .ss-list .ss-option:not(.ss-disabled).ss-selected {
  background-color: hsl(219, 62%, 33%) !important;
  border-left-color: hsl(222, 30%, 55%) !important;
  color: #f5f5f5 !important;
  font-weight: 600;
}

/* ─── Contenido de opción (icono + texto) ──────────────────────────── */
.ss-content .slim-option-content {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ss-content .appliance-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  color: hsl(153, 84%, 38%);
}
.ss-content .appliance-icon svg {
  display: block;
  width: 20px;
  height: 20px;
}
.ss-content .option-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.ss-content .appliance-name {
  font-weight: 500;
  color: #f5f5f5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ss-content .power-consumption {
  font-size: 0.8rem;
  color: #9f9f9f;
  line-height: 1;
}
</style>
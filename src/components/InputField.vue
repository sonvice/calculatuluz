<template>
  <div class="box-input d-flex relative">
    <div class="input-wrapper">
      <input
        ref="inputRef"
        type="number"
        :value="modelValue"
        @input="handleInput"
        @blur="handleBlur"
        :placeholder="placeholder"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :aria-label="label || placeholder"
        :aria-describedby="error ? `${componentId}-error` : note ? `${componentId}-note` : undefined"
        :aria-invalid="!!error"
        :class="['form-input', { 'input-error': error, 'input-disabled': disabled }]"
      />
      
      <div class="input-controls">
        <button
          type="button"
          class="btn-control btn-increment"
          @click="increment"
          :disabled="disabled || isMaxReached"
          :aria-label="`Incrementar ${label || 'valor'}`"
          tabindex="-1"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M6 2V10M2 6H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        
        <div class="controls-divider"></div>
        
        <button
          type="button"
          class="btn-control btn-decrement"
          @click="decrement"
          :disabled="disabled || isMinReached"
          :aria-label="`Decrementar ${label || 'valor'}`"
          tabindex="-1"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M2 6H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
    
    <small 
      v-if="note && !error" 
      :id="`${uid}-note`"
      class="text-size--2 input-note"
    >
      {{ note }}
    </small>
    
    <small 
      v-if="error" 
      :id="`${uid}-error`"
      class="text-size--2 text-red-500 input-error-message"
      role="alert"
    >
      {{ error }}
    </small>
  </div>
</template>

<script setup>
import { ref, computed, getCurrentInstance } from 'vue';

// Contador global para IDs únicos (evita problemas de hidratación)
let uid = 0;

const props = defineProps({
  label: String,
  placeholder: String,
  suffix: String,
  modelValue: [String, Number],
  min: {
    type: [String, Number],
    default: undefined
  },
  max: {
    type: [String, Number],
    default: undefined
  },
  step: {
    type: [String, Number],
    default: 1
  },
  note: String,
  error: String,
  disabled: Boolean,
});

const emit = defineEmits(['update:modelValue']);

const inputRef = ref(null);
// Usar el UID de la instancia de Vue o generar uno incremental
const instance = getCurrentInstance();
const componentId = instance ? `input-${instance.uid}` : `input-${uid++}`;

const numericValue = computed(() => {
  const val = parseFloat(props.modelValue);
  return isNaN(val) ? 0 : val;
});

const numericMin = computed(() => {
  return props.min !== undefined ? parseFloat(props.min) : -Infinity;
});

const numericMax = computed(() => {
  return props.max !== undefined ? parseFloat(props.max) : Infinity;
});

const numericStep = computed(() => {
  return parseFloat(props.step) || 1;
});

const isMinReached = computed(() => {
  return numericValue.value <= numericMin.value;
});

const isMaxReached = computed(() => {
  return numericValue.value >= numericMax.value;
});

// Función para redondear correctamente y evitar problemas de punto flotante
const roundToPrecision = (value, step) => {
  // Determinar el número de decimales del step
  const stepStr = step.toString();
  const decimals = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
  
  // Redondear al número correcto de decimales
  return parseFloat(value.toFixed(decimals));
};

const handleInput = (event) => {
  const value = event.target.value;
  emit('update:modelValue', value);
};

const handleBlur = (event) => {
  // Validar y ajustar el valor al perder el foco
  let value = parseFloat(event.target.value);
  
  if (isNaN(value)) {
    value = props.min !== undefined ? numericMin.value : 0;
  } else {
    if (props.min !== undefined && value < numericMin.value) {
      value = numericMin.value;
    }
    if (props.max !== undefined && value > numericMax.value) {
      value = numericMax.value;
    }
    // Redondear al perder el foco para limpiar decimales extra
    value = roundToPrecision(value, numericStep.value);
  }
  
  emit('update:modelValue', value);
};

const increment = () => {
  if (props.disabled || isMaxReached.value) return;
  
  let newValue = numericValue.value + numericStep.value;
  
  // Redondear para evitar problemas de punto flotante
  newValue = roundToPrecision(newValue, numericStep.value);
  
  if (props.max !== undefined && newValue > numericMax.value) {
    newValue = numericMax.value;
  }
  
  emit('update:modelValue', newValue);
  inputRef.value?.focus();
};

const decrement = () => {
  if (props.disabled || isMinReached.value) return;
  
  let newValue = numericValue.value - numericStep.value;
  
  // Redondear para evitar problemas de punto flotante
  newValue = roundToPrecision(newValue, numericStep.value);
  
  if (props.min !== undefined && newValue < numericMin.value) {
    newValue = numericMin.value;
  }
  
  emit('update:modelValue', newValue);
  inputRef.value?.focus();
};
</script>

<style scoped>
.box-input {
  flex-direction: column;
  gap: var(--space-3xs, 0.25rem);
}

.input-wrapper {
  width: 100%;
  position: relative;
  display: flex;
  align-items: stretch;
}

.form-input {
  flex: 1;
  padding: 8px 12px;
  padding-right: 48px; /* Espacio para los controles */
  border: 1px solid var(--neutral-300, #d1d5db);
  border-radius: var(--rounded-m, 6px);
  color: var(--neutral-900, #111827);
  background-color: var(--neutral-50, #fafafa);
  font-size: var(--text-size-0, 1rem);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  /* Ocultar spinners nativos */
  -moz-appearance: textfield;
}

.form-input::-webkit-outer-spin-button,
.form-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.form-input:hover:not(:disabled) {
  border-color: var(--neutral-400, #9ca3af);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-500, #3b82f6);
  box-shadow: 0 0 0 3px var(--primary-100, rgba(59, 130, 246, 0.1));
}

.form-input.input-error {
  border-color: var(--red-500, #ef4444);
}

.form-input.input-error:focus {
  box-shadow: 0 0 0 3px var(--red-100, rgba(239, 68, 68, 0.1));
}

.form-input:disabled,
.form-input.input-disabled {
  background-color: var(--neutral-100, #f3f4f6);
  color: var(--neutral-400, #9ca3af);
  cursor: not-allowed;
}

.input-controls {
  position: absolute;
  right: 1px;
  top: 1px;
  bottom: 1px;
  display: flex;
  flex-direction: column;
  background-color: var(--neutral-50, #fafafa);
  border-radius: 0 var(--rounded-m, 6px) var(--rounded-m, 6px) 0;
  overflow: hidden;
}

.form-input:focus ~ .input-controls {
  background-color: var(--neutral-50, #fafafa);
}

.btn-control {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  flex: 1;
  padding: 0;
  border: none;
  background-color: transparent;
  color: var(--neutral-600, #4b5563);
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.btn-control:hover:not(:disabled) {
  background-color: var(--neutral-100, #f3f4f6);
  color: var(--primary-600, #2563eb);
}

.btn-control:active:not(:disabled) {
  background-color: var(--neutral-200, #e5e7eb);
  color: var(--primary-700, #1d4ed8);
}

.btn-control:focus-visible {
  outline: 2px solid var(--primary-500, #3b82f6);
  outline-offset: -2px;
  z-index: 1;
}

.btn-control:disabled {
  color: var(--neutral-300, #d1d5db);
  cursor: not-allowed;
}

.controls-divider {
  height: 1px;
  background-color: var(--neutral-200, #e5e7eb);
  margin: 0 4px;
}

.input-note {
  color: var(--neutral-500, #6b7280);
}

.input-error-message {
  color: var(--red-500, #ef4444);
}

/* Mejoras de accesibilidad */
.btn-control:focus-visible {
  outline: 2px solid var(--primary-500, #3b82f6);
  outline-offset: -2px;
}

/* Modo oscuro (si está habilitado) */
[data-theme="dark"] .form-input {
  background-color: var(--neutral-800, #1f2937);
  color: var(--neutral-100, #f3f4f6);
  border-color: var(--neutral-600, #4b5563);
}

[data-theme="dark"] .form-input:hover:not(:disabled) {
  border-color: var(--neutral-500, #6b7280);
}

[data-theme="dark"] .input-controls {
  background-color: var(--neutral-800, #1f2937);
}

[data-theme="dark"] .btn-control {
  color: var(--neutral-400, #9ca3af);
}

[data-theme="dark"] .btn-control:hover:not(:disabled) {
  background-color: var(--neutral-700, #374151);
  color: var(--primary-400, #60a5fa);
}

[data-theme="dark"] .controls-divider {
  background-color: var(--neutral-600, #4b5563);
}
</style>
<template>
    <div class="input-group">
      <label v-if="label" class="text-size--1 mb-space-3xs">{{ label }}</label>
      <div class="input-wrapper">
        <input
          :type="type"
          :value="modelValue"
          :placeholder="placeholder"
          :min="min"
          :max="max"
          :step="step"
          @input="handleInput"
          class="base-input"
        />
        <span v-if="suffix" class="input-suffix">{{ suffix }}</span>
      </div>
      <small v-if="hint" class="text-size--2">{{ hint }}</small>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  
  const props = defineProps({
    modelValue: [String, Number],
    label: String,
    type: {
      type: String,
      default: 'number'
    },
    placeholder: String,
    min: [Number, String],
    max: [Number, String],
    step: [Number, String],
    suffix: String,
    hint: String,
    validator: Function
  });
  
  const emit = defineEmits(['update:modelValue', 'validation']);
  
  const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    let value: string | number = target.value;
    
    if (props.type === 'number') {
      value = parseFloat(value);
      value = isNaN(value) ? '' : value;
    }
  
    // Validación en tiempo real
    if (props.validator) {
      const isValid = props.validator(value);
      emit('validation', isValid);
    }
  
    emit('update:modelValue', value);
  };
  </script>
  
  <style scoped>
  .input-group {
    margin-bottom: 1rem;
  }
  
  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .base-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .input-suffix {
    position: absolute;
    right: 10px;
    color: #666;
  }
  </style>
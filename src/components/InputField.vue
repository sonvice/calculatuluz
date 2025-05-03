<template>
  <div class="box-input d-flex relative">
    <!-- <p class="text-size--1 mb-space-3xs">
      {{ label }} <span v-if="suffix" class="input-suffix">({{ suffix }})</span>
    </p> -->
    <div class="d-flex">
      <input
        type="number"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :placeholder="placeholder"
        :min="min"
        :max="max"
        :class="['form-input', { 'input-error': error }]"
        :step="step" />
    </div>
    <!-- <small class="text-size--2 absolute note" v-if="note">{{ note }}</small> -->
    <small v-if="error" class="text-size--2 text-red absolute--bottom">
      {{ error }}
    </small>
  </div>
</template>

<script setup>
  const props = defineProps({
    label: String,
    placeholder: String,
    suffix: String,
    modelValue: [String, Number],
    min: [String, Number],
    max: [String, Number],
    step: [String, Number],
    note: String,
    error: String,
  });
</script>

<style scoped>
  .input-error {
    border-color: #e53e3e; /* Rojo para indicar error */
  }
  .absolute--bottom {
    position: absolute;
    bottom: -1.5rem;
    left: 0;
  }
  .text-red {
    color: #e53e3e;
  }
  .box-input {
    flex-direction: column;
    --vertical-alignment: stretch;
    --gutter: 0;
  }
  .box-input input {
    padding: 8px 12px;
    border-radius: 4px;
    color: #333;
    background-color: var(--neutral-50);
  }
  .box-input > .note {
    bottom: calc(var(--space-s) * -1);
  }
  .box-input > div {
    flex-grow: 1;
    --vertical-alignment: stretch;
  }
</style>

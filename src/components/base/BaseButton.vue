<template>
    <button
      :class="['base-button', { 'accent': type === 'accent' }]"
      @click="$emit('click')"
    >
      <slot></slot>
    </button>
  </template>
  
  <script setup lang="ts">
  defineProps<{
    type?: 'accent' | 'secondary';
  }>();
  </script>
  
  <style scoped>
  .base-button {
    padding: 0.75rem 1.5rem;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .base-button.accent {
    background: var(--color-accent-500);
    color: white;
    border-color: transparent;
  }
  
  .base-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  </style>
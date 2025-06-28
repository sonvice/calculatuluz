<template>
  <div v-if="!hydrated || $loading" class="card-skeleton mt-space-m"></div>
  <section v-else class="guidance-card rounded-md mt-space-m bg-primary-900 bg-texture">
    <ul role="list" class="guidance-list text-primary-50 m-space-0 d-grid">
      <!-- Media diaria vs pico máximo -->
      <li>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="icon text-primary-200 lucide lucide-chart-no-axes-column-icon lucide-chart-no-axes-column">
          <line x1="18" x2="18" y1="20" y2="10" />
          <line x1="12" x2="12" y1="20" y2="4" />
          <line x1="6" x2="6" y1="20" y2="14" />
        </svg>
        <div class="content">
          <p class="text text-primary-50">
            La <strong>media diaria</strong> está al <strong>{{ averageProgressPercentage }}%</strong> del pico máximo.
            <span class="tooltip-container">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="icon-small text-primary-50 lucide lucide-info-icon lucide-info">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <div class="tooltip">Porcentaje que representa el precio medio diario respecto al precio máximo del día.
                Un valor bajo indica que, en promedio, los precios están lejos del pico.</div>
            </span>
          </p>
          <div class="progress-bar">
            <div class="progress-fill primary-fill" :style="{ width: averageProgressPercentage + '%' }"></div>
          </div>
        </div>
      </li>

      <!-- Precio actual vs pico máximo -->
      <li>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="icon text-accent-500 lucide lucide-zap-icon lucide-zap">
          <path
            d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
        </svg>
        <div class="content">
          <p class="text text-primary-50">
            Ahora estás al <strong>{{ currentProgressPercentage }}%</strong> del pico máximo del día.
            <span class="tooltip-container">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="icon-small text-primary-50 lucide lucide-info-icon lucide-info">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <div class="tooltip">Porcentaje del precio actual en relación al máximo diario. Un % bajo indica un buen
                momento para consumir.</div>
            </span>
          </p>
          <div class="progress-bar">
            <div class="progress-fill accent-fill" :style="{ width: currentProgressPercentage + '%' }"></div>
          </div>
        </div>
      </li>

      <!-- Cambio próxima hora -->
      <li v-if="nextDifferenceValue !== null">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="icon text-primary-200 lucide lucide-refresh-cw-icon lucide-refresh-cw">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M8 16H3v5" />
        </svg>
        <div class="content">
          <p class="text text-primary-50">
            Cambio próxima hora: <strong :class="nextDifferenceClass">{{ nextDifferenceValue }}%</strong>
          </p>
          <p class="subtext text-primary-100 text-size--1 mt-space-2xs">
            {{ nextDifferenceValue > 0
              ? 'Se espera que la tarifa suba en la siguiente hora. Considera posponer consumos intensivos.'
              : (nextDifferenceValue < 0
                ? 'La tarifa bajará en la próxima hora. Es un buen momento para programar electrodomésticos.'
                : 'El precio se mantendrá estable durante la próxima hora.') }} </p>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useStore } from '@nanostores/vue';
import { priceData, loading } from '../stores/prices.js';
const store = useStore(priceData);
const $loading = useStore(loading);
const hydrated = ref(false);
onMounted(() => { hydrated.value = true; });

// % media diaria sobre pico máximo
const averageProgressPercentage = computed(() => {
  const max = store.value.maxPrice?.value || 1;
  const avg = store.value.averagePrice || 0;
  return Math.round((avg / max) * 100);
});

// % precio actual sobre pico máximo
const currentProgressPercentage = computed(() => {
  const max = store.value.maxPrice?.value || 1;
  const now = store.value.currentPrice != null
    ? store.value.currentPrice
    : store.value.prices?.[new Date().getHours()]?.price || 0;
  return Math.round((now / max) * 100);
});

// % cambio próxima hora
const nextDifferenceValue = computed(() => {
  if (!store.value.prices?.length) return null;
  const h = new Date().getHours();
  const current = store.value.prices[h]?.price || 0;
  const next = store.value.prices[(h + 1) % 24]?.price || 0;
  if (current === 0) return null;
  return ((next - current) / current * 100).toFixed(1);
});

// Clase para cambio próxima hora
const nextDifferenceClass = computed(() => {
  const val = parseFloat(nextDifferenceValue.value);
  if (isNaN(val)) return 'text-neutral-700';
  return val > 0 ? 'text-red-600' : val < 0 ? 'text-green-600' : 'text-neutral-700';
});
</script>

<style scoped>
.guidance-list li {
  display: flex;
  align-items: flex-start;
  flex: 1;
  position: relative;
  padding: var(--space-m) var(--space-l);
}

.guidance-list li+li {
  border-left: 1px solid var(--primary-700);
}

.icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

.icon-small {
  width: 16px;
  height: 16px;
  vertical-align: middle;
}

.content {
  margin-left: var(--space-m);
  flex: 1;
}

.text {
  margin: 0;
  font-size: var(--font-size-sm);
}

.progress-bar {
  background: var(--neutral-200);
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  margin-top: var(--space-xs);
}

.progress-fill {
  height: 100%;
  transition: width 0.4s ease;
}

.primary-fill {
  background: var(--primary-500);
}

.accent-fill {
  background: var(--accent-500);
}

.tooltip-container {
  position: relative;
  display: inline-block;
  cursor: pointer;
  vertical-align: middle;
}

.tooltip-container .tooltip {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-bottom: 8px;
  z-index: 10;
  width: max(18rem, 100%);
}

.tooltip-container:hover .tooltip {
  display: block;
}

.card-skeleton {
  width: 100%;
  min-height: 8.125rem;
  background: var(--primary-900);
  animation: pulse 1.5s infinite;
  border-radius: 4px;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}
</style>

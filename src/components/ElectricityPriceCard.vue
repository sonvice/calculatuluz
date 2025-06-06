<template>
  <header class="price-header">
    <div>
      <div class="header-content">
        <div class="last-updated d-flex mb-space-s text-size--1 text-primary-200">
         <p>Actualizado: <time :datetime=formattedLastUpdated>{{ formattedLastUpdated }}</time></p> 
          <div class="mt-space-m">
            <small>Puedes consultar el precio de mañana</small>
            <GlobalPriceSwitch />
          </div>
        </div>

        <div v-if="!hydrated" class="cards-grid rounded-md">
          <div class="skeleton rounded-md"></div>
          <div class="skeleton rounded-md"></div>
          <div class="skeleton rounded-md"></div>
          <div class="skeleton rounded-md"></div>
        </div>

        <div v-else class="cards-grid">
          <!-- Precio Actual -->
          <div class="price-card current rounded-md bg-primary-900 bg-texture">
            <div class="card-header">
              <span class="card-badge text-primary-50 bg-accent-500"
                >Ahora</span
              >
              <h3 class="card-title text-primary-100">Precio Actual</h3>
              <div class="time-indicator">
                <span class="current-hour text-primary-200"
                  >{{ currentHour }}h</span
                >
              </div>
            </div>
            <div class="card-content">
              <p class="price-display text-primary-50 d-flex">
                <span>{{ formattedCurrentPrice }}</span>
                <span class="price-trend">
                  <!-- Arrow based on nextPriceDifference -->
                  <TrendArrow :value="nextPriceDifference" />
                  <span class="trend-percentage">
                    {{ nextPriceDifference }}%
                    <div class="trend-tooltip">
                      {{ trendExplanation }}
                      <div class="tooltip-arrow"></div>
                    </div>
                  </span>
                </span>
              </p>
              <div class="next-hour-info bg-primary-500">
                <div class="next-price text-primary-100">
                  <span>Próxima hora:</span>
                  <strong>{{ formattedNextPrice }}</strong>
                </div>
                <p class="text-size--1 text-primary-200">
                  Cambio en {{ minutesRemaining }} min.
                </p>
              </div>
            </div>
          </div>

          <!-- Media Diaria -->
          <div class="price-card average rounded-md bg-primary-900 bg-texture">
            <div class="card-header">
              <h3 class="card-title text-primary-100">Media Diaria</h3>
              <div class="comparison-badge text-primary-200">
                <span :class="comparisonClass"
                  >{{ comparisonPercentage }}%</span
                >
                vs. ayer
              </div>
            </div>
            <div class="card-content">
              <p class="price-display secondary text-primary-50">
                {{ formattedAveragePrice }}
              </p>
              <div class="progress-bar bg-primary-100">
                <div class="progress-fill" :style="averageProgressStyle"></div>
              </div>
              <div class="trend-description text-primary-100">
                <template v-if="comparisonPercentage !== '--'">
                  <span v-if="Math.abs(comparisonPercentageValue) > 0">
                    Los precios están un
                    <strong
                      >{{
                        Math.abs(comparisonPercentageValue).toFixed(1)
                      }}%</strong
                    >
                    {{
                      comparisonPercentageValue > 0 ? 'más altos' : 'más bajos'
                    }}
                    que ayer.<br />
                    <!--  La media actual está al {{ averageProgressPercentage }}% del precio máximo diario. -->
                  </span>
                  <span v-else>
                    Los precios se mantienen estables respecto a ayer.<br />
                    <!-- La media actual está al {{ averageProgressPercentage }}% del precio máximo diario. -->
                  </span>
                </template>
                <span v-else>Cargando datos históricos...</span>
              </div>
            </div>
          </div>

          <!-- Mínimo Diario -->
          <div class="price-card min rounded-md bg-primary-900 bg-texture">
            <div class="card-header">
              <h3 class="card-title text-primary-100">Mínimo Diario</h3>
              <div class="time-range text-primary-200">
                <span class="text-primary-50">Desde</span>
                {{ priceData.value.minPrice?.timeRange || '--:--' }}
              </div>
            </div>
            <div class="card-content">
              <p class="price-display text-accent-500">
                {{ formattedMinPrice }}
              </p>
              <div class="savings-hint text-primary-50">
                Ahorra hasta <strong>{{ formattedSavings }}</strong> por kWh si
                programas tu consumo en la hora más barata.
              </div>
            </div>
          </div>

          <!-- Máximo Diario -->
          <div class="price-card max rounded-md bg-primary-900 bg-texture">
            <div class="card-header">
              <h3 class="card-title text-primary-100">Máximo Diario</h3>
              <div class="time-range text-primary-200">
                {{ priceData.value.maxPrice?.timeRange || '--:--' }}
              </div>
            </div>
            <div class="card-content">
              <p class="price-display warning text-primary-50">
                {{ formattedMaxPrice }}
              </p>
              <div class="warning-message">
                ⚠️ Evita consumos intensivos en este horario
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref } from 'vue';
  import { useStore } from '@nanostores/vue';
  import { priceData } from '../stores/prices.js';
  import TrendArrow from './TrendArrow.vue';
  import GlobalPriceSwitch from './GlobalPriceSwitch.vue';

  const hydrated = ref(false);
  const now = ref(Date.now());
  let interval;

  // Reemplazo de usePriceData
  const priceStore = useStore(priceData);

  // Formateador
  const formatter = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });

  // Actualización de la hora
  onMounted(() => {
    hydrated.value = true;
    interval = setInterval(() => {
      now.value = Date.now();
    }, 60000);
  });
  onUnmounted(() => clearInterval(interval));

  // Fecha de actualización
  const formattedLastUpdated = computed(() => {
    const date = new Date(priceStore.value.lastUpdated);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  });

  // Datos actuales y próximos
  const currentHour = computed(() =>
    new Date().getHours().toString().padStart(2, '0')
  );

  const formattedCurrentPrice = computed(() =>
    formatter.format(
      priceStore.value.prices?.[new Date().getHours()]?.price ??
        priceStore.value.currentPrice ??
        0
    )
  );

  const formattedNextPrice = computed(() =>
    formatter.format(
      priceStore.value.prices?.[(new Date().getHours() + 1) % 24]?.price ?? 0
    )
  );

  const minutesRemaining = computed(() => 60 - new Date().getMinutes() - 1);

  // Diferencia con la próxima hora
  const nextPriceDifference = computed(() => {
    const hour = new Date().getHours();
    const cur = priceStore.value.prices?.[hour]?.price ?? 0;
    const nxt = priceStore.value.prices?.[(hour + 1) % 24]?.price ?? 0;
    if (!cur) return 0;
    return Number((((nxt - cur) / cur) * 100).toFixed(1));
  });

  const trendExplanation = computed(() => {
    const d = nextPriceDifference.value;
    if (d > 0) return `El precio aumentará un ${d}% la próxima hora`;
    if (d < 0) return `El precio disminuirá un ${Math.abs(d)}% la próxima hora`;
    return 'El precio se mantendrá estable en la próxima hora';
  });

  // Media diaria
  const averageProgressPercentage = computed(() => {
    const max = priceStore.value.maxPrice?.value ?? 1;
    const avg = priceStore.value.averagePrice ?? 0;
    return Math.round((avg / max) * 100);
  });

  const averageProgressStyle = computed(() => ({
    width: `${averageProgressPercentage.value}%`,
  }));

  const formattedAveragePrice = computed(() =>
    formatter.format(priceStore.value.averagePrice ?? 0)
  );

  const formattedMinPrice = computed(() =>
    priceStore.value.minPrice?.value
      ? formatter.format(priceStore.value.minPrice.value)
      : ''
  );

  const formattedMaxPrice = computed(() =>
    priceStore.value.maxPrice?.value
      ? formatter.format(priceStore.value.maxPrice.value)
      : ''
  );

  // Comparación diaria
  const comparisonPercentage = computed(() => {
    const cur = priceStore.value.averagePrice ?? 0;
    const prev = priceStore.value.previousAverage ?? 0;
    if (prev === 0) return cur ? '+0.0' : '--';
    const pct = ((cur - prev) / prev) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}`;
  });

  const comparisonPercentageValue = computed(
    () => parseFloat(comparisonPercentage.value) || 0
  );

  const comparisonClass = computed(() => {
    const val = comparisonPercentageValue.value;
    return val > 0 ? 'positive' : val < 0 ? 'negative' : 'neutral';
  });

  // Ahorro
  const savingPerKWh = computed(() => {
    const current =
      priceStore.value.currentPrice ??
      priceStore.value.prices?.[new Date().getHours()]?.price ??
      0;
    const min = priceStore.value.minPrice?.value ?? current;
    return Math.max(0, current - min);
  });

  const formattedSavings = computed(() => formatter.format(savingPerKWh.value));
</script>

<style scoped>
  .skeleton {
    /* mismo tamaño aproximado que tu <header> real */
    min-height: 220px;
    padding: 1rem;
    background: var(--primary-900);
  }
  /* Actual price */

  .trend-percentage {
    position: relative;
    cursor: help;
    border-bottom: 1px dotted #cbd5e0;
  }

  .trend-tooltip {
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
    white-space: nowrap;
    margin-bottom: 8px;
    z-index: 10;
  }

  .trend-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
  }

  .trend-percentage:hover .trend-tooltip {
    display: block;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .time-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .time-progress {
    flex-grow: 1;
    height: 4px;
    background: #e2e8f0;
    border-radius: 2px;
    overflow: hidden;
  }

  .next-hour-info {
    margin-top: 1rem;
    padding: 0.75rem;
    border-radius: 8px;
  }

  .next-price {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.25rem;
  }

  .time-remaining {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: #718096;
    font-size: 0.9rem;
    margin: 0;
  }

  .icon-small {
    width: 14px;
    height: 14px;
  }

  .trend-percentage {
    margin-left: 0.25rem;
    font-size: 0.9em;
  }

  .price-trend {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    vertical-align: middle;
  }

  .trend-percentage {
    font-size: 0.85em;
    font-weight: 500;
  }

  /* Animación de parpadeo para cambios */
  .trend-up {
    animation: pulse-up 1.5s infinite;
  }

  .trend-down {
    animation: pulse-down 1.5s infinite;
  }

  @keyframes pulse-up {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes pulse-down {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
  /* Fin actual price */

  .trend-description {
    font-size: 0.9rem;
    margin-top: 1rem;
    line-height: 1.4;
  }

  .trend-description strong {
    font-weight: 600;
    color: inherit;
  }

  /* Para mantener consistencia con la tarjeta de Mínimo */

  .savings-hint {
    background: #f0fff4;
    color: #38a169;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 0.9rem;
    margin-top: 1rem;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .price-card {
    padding: 1.5rem;
    transition: all 0.3s ease;
  }

  .price-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .current {
    border-left: 6px solid var(--accent-500);
  }

  .average {
    border-left: 6px solid #2196f3;
  }

  .min {
    border-left: 6px solid #ffc107;
  }

  .max {
    border-left: 6px solid #f44336;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    gap: 0.5rem;
  }

  .card-title {
    font-size: 1.1rem;
    margin: 0;
  }

  .price-display {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0.5rem 0;
  }

  .secondary {
    font-size: 1.5rem;
  }

  .warning {
    color: #f44336;
  }

  .time-range {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .progress-bar {
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: #2196f3;
    transition: width 0.5s ease;
  }

  .savings-hint {
    background: #f0fff4;
    color: #38a169;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 0.9rem;
    margin-top: 1rem;
  }

  .warning-message {
    background: #fff5f5;
    color: #e53e3e;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 0.9rem;
    margin-top: 1rem;
  }

  .last-updated {
    gap: 0.5rem;
    --horizontal-alignment:space-between;
    --vertical-alignment:end;
  }

  .card-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .comparison-badge {
    font-size: 0.9rem;
  }

  .positive {
    color: #4caf50;
  }

  .negative {
    color: #f44336;
  }

  @media (max-width: 768px) {
    .cards-grid {
      grid-template-columns: 1fr;
    }

    .price-display {
      font-size: 1.4rem;
    }
  }
</style>

<template>
  <div class="consumption-chart">
    <!-- Título con contexto -->
    <div class="chart-header">
      <h3 class="chart-title">Proyección de Gasto</h3>
      <p class="chart-context">
        Usando <strong>{{ applianceName }}</strong> durante {{ formattedHours }}
      </p>
    </div>

    <!-- Gráfico de barras horizontales -->
    <div class="bar-chart" role="img" :aria-label="ariaDescription">
      
      <!-- Barra Diario -->
      <div class="bar-row">
        <div class="bar-label">
          <span class="period">Diario</span>
        </div>
        <div class="bar-container">
          <div class="bar-track">
            <div 
              class="bar-fill bar-fill--daily" 
              :style="{ width: dailyBarWidth + '%' }"
            ></div>
          </div>
          <span class="bar-value">{{ formatCurrency(dailyCost) }}</span>
        </div>
      </div>

      <!-- Barra Mensual - Destacada -->
      <div class="bar-row bar-row--highlighted">
        <div class="bar-label">
          <span class="period">Mensual</span>
          <span class="label-badge">Más relevante</span>
        </div>
        <div class="bar-container">
          <div class="bar-track bar-track--highlighted">
            <div 
              class="bar-fill bar-fill--monthly" 
              :style="{ width: monthlyBarWidth + '%' }"
            ></div>
          </div>
          <span class="bar-value bar-value--highlighted">{{ formatCurrency(monthlyCost) }}</span>
          <span class="consumption-indicator" :class="consumptionLevel.class">
            <component :is="consumptionLevel.icon" :size="14" />
            {{ consumptionLevel.label }}
          </span>
        </div>
      </div>

      <!-- Barra Anual -->
      <div class="bar-row">
        <div class="bar-label">
          <span class="period">Anual</span>
        </div>
        <div class="bar-container">
          <div class="bar-track">
            <div 
              class="bar-fill bar-fill--annual" 
              :style="{ width: annualBarWidth + '%' }"
            ></div>
          </div>
          <span class="bar-value">{{ formatCurrency(annualCost) }}</span>
        </div>
      </div>
    </div>

    <!-- Insight principal -->
    <div class="chart-insight" v-if="annualCost > 0">
      <div class="insight-icon">
        <PiggyBank :size="22" />
      </div>
      <div class="insight-content">
        <p class="insight-main">
          <strong>{{ applianceName }}</strong> te costará aproximadamente 
          <strong class="highlight-value">{{ formatCurrency(annualCost) }}/año</strong>
        </p>
        <p class="insight-secondary">
          Equivale a {{ formatCurrency(monthlyCost) }} cada mes en tu factura
        </p>
      </div>
    </div>

    <!-- Comparativas cotidianas -->
    <div class="comparison-section" v-if="monthlyCost > 0">
      <p class="comparison-title">Equivalencia aproximada</p>
      <div class="comparison-grid">
        <div class="comparison-item" v-if="monthlyCost >= 0.5">
          <Coffee :size="16" class="comparison-icon" />
          <span class="comparison-text">{{ Math.round(monthlyCost / 1.5) }} cafés/mes</span>
        </div>
        <div class="comparison-item" v-if="annualCost >= 10">
          <Clapperboard :size="16" class="comparison-icon" />
          <span class="comparison-text">{{ Math.round(annualCost / 8) }} cines/año</span>
        </div>
        <div class="comparison-item" v-if="annualCost >= 30">
          <Receipt :size="16" class="comparison-icon" />
          <span class="comparison-text">{{ (annualCost / 12).toFixed(1) }}€/mes extra</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { 
  Lightbulb, 
  Zap, 
  Flame, 
  AlertTriangle,
  PiggyBank,
  Coffee,
  Clapperboard,
  Receipt
} from 'lucide-vue-next';

const props = defineProps({
  dailyCost: {
    type: Number,
    default: 0
  },
  monthlyCost: {
    type: Number,
    default: 0
  },
  annualCost: {
    type: Number,
    default: 0
  },
  applianceName: {
    type: String,
    default: 'Este electrodoméstico'
  },
  hoursPerDay: {
    type: [Number, String],
    default: 0
  }
});

// Formateo de horas
const formattedHours = computed(() => {
  const h = parseFloat(props.hoursPerDay) || 0;
  if (h === 1) return '1 hora al día';
  if (h < 1) return `${(h * 60).toFixed(0)} minutos al día`;
  return `${h} horas al día`;
});

// Calcular anchos de barra relativos
const maxValue = computed(() => Math.max(props.annualCost, 1));

const dailyBarWidth = computed(() => {
  if (props.dailyCost <= 0) return 0;
  return Math.max(8, (props.dailyCost / maxValue.value) * 100);
});

const monthlyBarWidth = computed(() => {
  if (props.monthlyCost <= 0) return 0;
  return Math.max(15, (props.monthlyCost / maxValue.value) * 100);
});

const annualBarWidth = computed(() => {
  if (props.annualCost <= 0) return 0;
  return 100;
});

// Nivel de consumo para indicador
const consumptionLevel = computed(() => {
  const monthly = props.monthlyCost;
  if (monthly < 2) return { icon: Lightbulb, label: 'Bajo', class: 'level--low' };
  if (monthly < 10) return { icon: Zap, label: 'Moderado', class: 'level--medium' };
  if (monthly < 25) return { icon: Flame, label: 'Alto', class: 'level--high' };
  return { icon: AlertTriangle, label: 'Muy alto', class: 'level--very-high' };
});

// Formato de moneda
const formatCurrency = (value) => {
  if (value < 0.01) return '< 0,01 €';
  if (value < 1) return value.toFixed(2).replace('.', ',') + ' €';
  return value.toFixed(2).replace('.', ',') + ' €';
};

// Descripción para accesibilidad
const ariaDescription = computed(() => {
  return `Gráfico de consumo: Diario ${formatCurrency(props.dailyCost)}, Mensual ${formatCurrency(props.monthlyCost)}, Anual ${formatCurrency(props.annualCost)}`;
});
</script>

<style scoped>
.consumption-chart {
  background: var(--primary-900);
  border-radius: var(--rounded-lg);
  padding: var(--space-m);
  border: 1px solid var(--primary-700);
}

/* Header del gráfico */
.chart-header {
  text-align: center;
  margin-bottom: var(--space-m);
  padding-bottom: var(--space-s);
  border-bottom: 1px solid var(--primary-700);
}

.chart-title {
  font-size: var(--size-0);
  font-weight: var(--bold);
  color: var(--primary-50);
  margin: 0 0 var(--space-3xs) 0;
}

.chart-context {
  font-size: var(--size--1);
  color: var(--primary-300);
  margin: 0;
}

.chart-context strong {
  color: var(--primary-100);
}

/* Gráfico de barras */
.bar-chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.bar-row {
  display: grid;
  grid-template-columns: 90px 1fr;
  align-items: center;
  gap: var(--space-s);
}

.bar-row--highlighted {
  background: var(--primary-800);
  border-radius: var(--rounded-md);
  padding: var(--space-s);
  margin-inline: calc(var(--space-s) * -1);
  border-left: 3px solid var(--esmerald-green);
}

.bar-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.period {
  font-size: var(--size--1);
  font-weight: var(--semi-bold);
  color: var(--primary-100);
}

.label-badge {
  font-size: var(--size--2);
  color: var(--esmerald-green);
  font-weight: var(--bold);
}

.bar-container {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.bar-track {
  flex: 1;
  height: 24px;
  background: var(--primary-700);
  border-radius: var(--rounded-sm);
  overflow: hidden;
  min-width: 60px;
}

.bar-track--highlighted {
  height: 32px;
  background: var(--primary-600);
}

.bar-fill {
  height: 100%;
  border-radius: var(--rounded-sm);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.bar-fill--daily {
  background: var(--primary-400);
}

.bar-fill--monthly {
  background: linear-gradient(90deg, var(--esmerald-green), var(--accent-400));
}

.bar-fill--annual {
  background: var(--primary-300);
}

.bar-value {
  font-size: var(--size--1);
  font-weight: var(--bold);
  color: var(--primary-100);
  white-space: nowrap;
  min-width: 70px;
}

.bar-value--highlighted {
  font-size: var(--size-0);
  color: var(--primary-50);
}

/* Indicador de nivel de consumo */
.consumption-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3xs);
  font-size: var(--size--2);
  padding: var(--space-3xs) var(--space-xs);
  border-radius: var(--rounded-full);
  white-space: nowrap;
}

.level--low {
  background: rgba(16, 185, 129, 0.2);
  color: var(--esmerald-green);
}

.level--medium {
  background: rgba(245, 158, 11, 0.2);
  color: var(--amber);
}

.level--high {
  background: rgba(249, 115, 22, 0.2);
  color: var(--orange);
}

.level--very-high {
  background: rgba(239, 68, 68, 0.2);
  color: var(--red);
}

/* Insight principal */
.chart-insight {
  display: flex;
  align-items: flex-start;
  gap: var(--space-s);
  margin-top: var(--space-m);
  padding: var(--space-s);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
  border-radius: var(--rounded-md);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.insight-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(16, 185, 129, 0.15);
  border-radius: var(--rounded-md);
  color: var(--esmerald-green);
  flex-shrink: 0;
}

.insight-content {
  flex: 1;
}

.insight-main {
  font-size: var(--size--1);
  color: var(--primary-100);
  margin: 0 0 var(--space-3xs) 0;
  line-height: 1.4;
}

.insight-main strong {
  color: var(--primary-50);
}

.highlight-value {
  color: var(--esmerald-green) !important;
}

.insight-secondary {
  font-size: var(--size--2);
  color: var(--primary-300);
  margin: 0;
}

/* Comparativas */
.comparison-section {
  margin-top: var(--space-m);
  padding-top: var(--space-s);
  border-top: 1px dashed var(--primary-700);
}

.comparison-title {
  font-size: var(--size--2);
  color: var(--primary-400);
  margin: 0 0 var(--space-s) 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: var(--semi-bold);
}

.comparison-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-s) var(--space-m);
}

.comparison-item {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
}

.comparison-icon {
  color: var(--primary-400);
  flex-shrink: 0;
}

.comparison-text {
  font-size: var(--size--1);
  color: var(--primary-200);
}

/* Responsive */
@media (max-width: 480px) {
  .consumption-chart {
    padding: var(--space-s);
  }

  .bar-row {
    grid-template-columns: 75px 1fr;
  }

  .bar-row--highlighted {
    margin-inline: calc(var(--space-2xs) * -1);
    padding: var(--space-2xs);
  }

  .consumption-indicator {
    width: 100%;
    justify-content: center;
    margin-top: var(--space-2xs);
  }

  .comparison-grid {
    flex-direction: column;
    gap: var(--space-2xs);
  }
}
</style>
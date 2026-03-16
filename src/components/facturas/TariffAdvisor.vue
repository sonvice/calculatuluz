<script setup>
import { computed } from 'vue'
import { TrendingDown, Leaf, CheckCircle, Zap, Award, Star, Info } from 'lucide-vue-next'

const props = defineProps({
  pricePerKwh: { type: Number, default: null },
  consumptionKwh: { type: Number, default: null },
  provider: { type: String, default: null },
})

// ─── Tariff data (updated March 2026) ────────────────────────────────────────
const TARIFFS = [
  {
    id: 'plenitude',
    name: 'Plenitude',
    plan: 'Tarifa Fácil',
    price: 0.105,
    badges: ['Más barata'],
    renewable: true,
    noTie: true,
    note: 'Aparece entre las más baratas en comparadores',
  },
  {
    id: 'naturgy',
    name: 'Naturgy',
    plan: 'Por Uso Luz',
    price: 0.1099,
    badges: [],
    renewable: true,
    noTie: true,
    note: 'Precio estable 24h, entre las más baratas del mercado libre',
  },
  {
    id: 'totalenergies',
    name: 'TotalEnergies',
    plan: 'A Tu Aire Siempre',
    price: 0.114,
    badges: ['Top comparadores'],
    renewable: true,
    noTie: true,
    note: 'Tarifa fija más valorada en comparadores a marzo 2026',
  },
  {
    id: 'endesa',
    name: 'Endesa',
    plan: 'One Luz / Conecta',
    price: 0.117,
    badges: ['Más popular'],
    renewable: false,
    noTie: true,
    note: 'Contratación digital, sin permanencia',
  },
  {
    id: 'octopus',
    name: 'Octopus Energy',
    plan: 'Octopus Relax',
    price: 0.119,
    badges: ['Potencia barata'],
    renewable: false,
    noTie: true,
    note: 'Potencia muy competitiva, fija 24h',
  },
  {
    id: 'repsol',
    name: 'Repsol',
    plan: 'Ahorro Plus',
    price: 0.13,
    badges: ['Con Waylet'],
    renewable: false,
    noTie: true,
    note: 'Descuentos adicionales si usas Waylet en gasolineras',
  },
]

const tariffs = computed(() =>
  TARIFFS.map((t) => {
    const monthlyDelta = props.consumptionKwh
      ? ((props.pricePerKwh ?? 0) - t.price) * props.consumptionKwh
      : null
    return {
      ...t,
      monthlySaving: monthlyDelta,
      annualSaving: monthlyDelta != null ? monthlyDelta * 12 : null,
      cheaper: monthlyDelta != null ? monthlyDelta > 0 : null,
    }
  })
)

// If user already beats cheapest tariff
const userAlreadyCheap = computed(() => {
  if (!props.pricePerKwh) return false
  return props.pricePerKwh <= TARIFFS[0].price
})

const bestSaving = computed(() =>
  tariffs.value.reduce((max, t) =>
    (t.monthlySaving ?? -Infinity) > (max.monthlySaving ?? -Infinity) ? t : max
  )
)

function fmtEur(v) {
  if (v == null) return null
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(v)
}
</script>

<template>
  <section class="advisor" aria-labelledby="advisor-title">

    <!-- Header -->
    <div class="advisor__header">
      <div class="advisor__title-row">
        <span class="advisor__icon" aria-hidden="true">
          <TrendingDown :size="18" />
        </span>
        <h3 id="advisor-title" class="advisor__title">
          Comparativa de tarifas en España
        </h3>
      </div>

      <!-- User price context -->
      <div v-if="pricePerKwh" class="advisor__context">
        <template v-if="userAlreadyCheap">
          <span class="advisor__context-good">
            <CheckCircle :size="14" aria-hidden="true" />
            Tu tarifa actual ({{ pricePerKwh.toFixed(4) }} €/kWh) ya es competitiva
          </span>
        </template>
        <template v-else>
          <span class="advisor__context-neutral">
            Tu precio actual con
            <strong>{{ provider || 'tu comercializadora' }}</strong>:
            <strong class="advisor__current-price">{{ pricePerKwh.toFixed(4) }} €/kWh</strong>
          </span>
          <span v-if="bestSaving.monthlySaving > 0" class="advisor__potential">
            Podrías ahorrar hasta
            <strong class="advisor__saving-highlight">{{ fmtEur(bestSaving.monthlySaving) }}/mes</strong>
            ({{ fmtEur(bestSaving.annualSaving) }}/año)
          </span>
        </template>
      </div>
      <p v-else class="advisor__context-neutral">
        Tarifas de mercado libre más competitivas en España (marzo 2026)
      </p>
    </div>

    <!-- Tariff cards -->
    <div class="advisor__scroll" role="list" aria-label="Comparativa de tarifas">
      <article
        v-for="(t, i) in tariffs"
        :key="t.id"
        class="tariff-card"
        :class="{
          'tariff-card--best': i === 0,
          'tariff-card--worse': t.cheaper === false,
        }"
        role="listitem"
      >
        <!-- Top badges -->
        <div class="tariff-card__badges" aria-hidden="true">
          <span v-if="i === 0" class="badge badge--best">
            <Award :size="11" /> Más barata
          </span>
          <span v-for="b in t.badges" :key="b" class="badge badge--info">{{ b }}</span>
        </div>

        <!-- Provider & plan -->
        <div class="tariff-card__head">
          <span class="tariff-card__provider">{{ t.name }}</span>
          <span class="tariff-card__plan">{{ t.plan }}</span>
        </div>

        <!-- Price -->
        <div class="tariff-card__price" aria-label="`Precio: ${t.price.toFixed(4)} euros por kilovatio hora`">
          <span class="tariff-card__price-val">{{ t.price.toFixed(4) }}</span>
          <span class="tariff-card__price-unit">€/kWh</span>
        </div>

        <!-- Saving vs user -->
        <div v-if="t.monthlySaving != null" class="tariff-card__saving">
          <template v-if="t.cheaper">
            <TrendingDown :size="13" class="tariff-card__saving-icon" aria-hidden="true" />
            <span class="tariff-card__saving-amount">
              {{ fmtEur(t.monthlySaving) }}/mes
            </span>
            <span class="tariff-card__saving-label">menos que ahora</span>
          </template>
          <template v-else-if="t.cheaper === false">
            <span class="tariff-card__saving-higher">Más cara que tu tarifa actual</span>
          </template>
        </div>

        <!-- Features -->
        <ul class="tariff-card__features" aria-label="Características">
          <li v-if="t.renewable">
            <Leaf :size="12" aria-hidden="true" />
            Energía renovable
          </li>
          <li v-if="t.noTie">
            <CheckCircle :size="12" aria-hidden="true" />
            Sin permanencia
          </li>
          <li>
            <Zap :size="12" aria-hidden="true" />
            Precio fijo 24h
          </li>
        </ul>

        <p class="tariff-card__note">{{ t.note }}</p>
      </article>
    </div>

    <!-- Disclaimer -->
    <p class="advisor__disclaimer">
      <Info :size="12" aria-hidden="true" />
      Precios orientativos marzo 2026. Verifica condiciones actuales en la web de cada comercializadora antes de contratar.
    </p>
  </section>
</template>

<style scoped>
.advisor {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding: var(--space-m);
  background: var(--primary-900);
  border: 1px solid var(--primary-700);
  border-radius: 14px;
}

/* ── Header ─────────────────────────────────────────── */
.advisor__header { display: flex; flex-direction: column; gap: 0.5rem; }

.advisor__title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.advisor__icon {
  display: flex;
  color: var(--esmerald-green);
  flex-shrink: 0;
}
.advisor__title {
  font-size: var(--size-0);
  font-weight: 700;
  color: var(--neutral-50);
  margin: 0;
  line-height: 1.2;
}
.advisor__badge-pro {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.45rem;
  background: linear-gradient(135deg, var(--amber), var(--orange));
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--primary-900);
  flex-shrink: 0;
}

.advisor__context {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--size--1);
}
.advisor__context-neutral { color: var(--primary-200); font-size: var(--size--1); }
.advisor__context-good {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--esmerald-green);
  font-size: var(--size--1);
  font-weight: 600;
}
.advisor__current-price { color: var(--neutral-50); font-variant-numeric: tabular-nums; }
.advisor__potential {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--primary-200);
}
.advisor__saving-highlight {
  color: var(--esmerald-green);
  font-variant-numeric: tabular-nums;
}

/* ── Scroll container ───────────────────────────────── */
.advisor__scroll {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
}

/* ── Tariff card ────────────────────────────────────── */
.tariff-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.9rem;
  background: var(--primary-800);
  border: 1px solid var(--primary-700);
  border-radius: 12px;
  transition: border-color 0.15s;
  min-width: 0;
}
.tariff-card--best {
  border-color: var(--esmerald-green);
  background: color-mix(in srgb, var(--primary-800) 94%, var(--esmerald-green));
}
.tariff-card--worse {
  opacity: 0.7;
}

.tariff-card__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  min-height: 20px;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.15rem 0.45rem;
  border-radius: 20px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}
.badge--best {
  background: color-mix(in srgb, var(--esmerald-green) 15%, transparent);
  color: var(--esmerald-green);
  border: 1px solid color-mix(in srgb, var(--esmerald-green) 30%, transparent);
}
.badge--info {
  background: color-mix(in srgb, var(--amber) 12%, transparent);
  color: var(--amber);
  border: 1px solid color-mix(in srgb, var(--amber) 25%, transparent);
}

.tariff-card__head {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.tariff-card__provider {
  font-size: var(--size--1);
  font-weight: 700;
  color: var(--neutral-50);
  line-height: 1.2;
}
.tariff-card__plan {
  font-size: 0.7rem;
  color: var(--primary-300);
  line-height: 1.2;
}

.tariff-card__price {
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
  margin-top: 0.15rem;
}
.tariff-card__price-val {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--neutral-50);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.tariff-card__price-unit {
  font-size: 0.72rem;
  color: var(--primary-300);
  font-weight: 500;
}

.tariff-card__saving {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
}
.tariff-card__saving-icon { color: var(--esmerald-green); flex-shrink: 0; }
.tariff-card__saving-amount {
  font-size: var(--size--1);
  font-weight: 700;
  color: var(--esmerald-green);
  font-variant-numeric: tabular-nums;
}
.tariff-card__saving-label {
  font-size: 0.68rem;
  color: var(--primary-300);
}
.tariff-card__saving-higher {
  font-size: 0.68rem;
  color: var(--red-400, #f87171);
}

.tariff-card__features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.tariff-card__features li {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  color: var(--primary-200);
}
.tariff-card__features li svg { color: var(--primary-400); flex-shrink: 0; }

.tariff-card__note {
  font-size: 0.65rem;
  color: var(--primary-400);
  line-height: 1.4;
  margin: 0;
  margin-top: auto;
}

/* ── Disclaimer ─────────────────────────────────────── */
.advisor__disclaimer {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  font-size: 0.65rem;
  color: var(--primary-500);
  line-height: 1.4;
  margin: 0;
}
.advisor__disclaimer svg { flex-shrink: 0; margin-top: 0.1rem; }

/* ── Responsive ─────────────────────────────────────── */
@media (max-width: 860px) {
  .advisor__scroll {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .advisor {
    padding: var(--space-s);
  }
  .advisor__scroll {
    display: flex;
    overflow-x: auto;
    gap: 0.6rem;
    padding-bottom: 4px;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x mandatory;
  }
  .advisor__scroll::-webkit-scrollbar { display: none; }
  .tariff-card {
    min-width: 200px;
    flex-shrink: 0;
    scroll-snap-align: start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tariff-card { transition: none; }
}
</style>

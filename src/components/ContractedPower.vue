<template>
  <div class="contrated d-flex py-space-m">
    <!-- Listado de franjas horarias con coste -->
    <div v-if="currentHourCost"
      class="current-hour-summary rounded-sm text-neutral-50 d-flex bg-primary-800 px-space-s py-space-2xs rounded">
      <span class="hour-label text-size--1 text-bold">{{ currentHourCost.hour }}:</span>
      <span class="price-label text-size--1 ml-space-xs">{{ currentHourCost.price.toFixed(4) }} €/kWh</span>

      <!-- ✅ Mostrar estimación solo si se ha aplicado -->
      <span v-if="$applied" class="cost-label text-accent-400 text-size--1 ml-space-xs">
        → <strong>{{ currentHourCost.estimatedCost.toFixed(4) }} €</strong>
      </span>
    </div>
    <!-- Bloque de potencia contratada -->
    <div class="contracted-power d-flex">
      <div>
        <label for="contracted-power" class="text-neutral-50 d-flex mb-space-3xs text-size--1">
          ⚡ Potencia contratada (kW)
          <span class="tooltip-container">
            <InfoIcon class="icon-small" />
            <div class="tooltip">
              Coste estimado por hora = Precio PVPC × Potencia contratada × 1 h.<br />
              Ej: 5,5 kW x 0,10 €/kWh = 0,55 €.<br />
              <em>Estimación solo de consumo variable.</em>
            </div>
          </span>
        </label>
        <div class="input-power">
          <input id="contracted-power" type="number" step="0.1" min="0" :disabled="$applied" :value="$power"
            @input="onPowerChange" />
          <div class="btn-power d-flex">
            <button @click="applyPower" :disabled="$applied" class="btn" data-type="accent" data-size="small">
              {{ $applied ? 'Aplicado' : 'Aplicar potencia' }}
            </button>
            <button @click="resetData" :disabled="!$applied" class="btn" data-size="small">
              Resetear
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from '@nanostores/vue'
import { priceData, power, applied, applyPower, resetData } from '../stores/prices.js'
import { InfoIcon } from 'lucide-vue-next'

const $priceData = useStore(priceData)
const $power = useStore(power)
const $applied = useStore(applied)

function onPowerChange(e) {
  const val = parseFloat(e.target.value)
  if (!isNaN(val) && val > 0) {
    power.set(val)
    applied.set(false)
  }
}

const hoursWithCost = computed(() => {
  const data = $priceData.value // <--- asegúrate de acceder correctamente al valor
  return (data.prices || []).map(slot => ({
    ...slot,
    estimatedCost: slot.estimatedCost ?? null
  }))
})

const currentHourCost = computed(() => {
  const data = $priceData.value
  const now = new Date()
  const currentHour = now.getHours()

  const slot = data.prices.find(p => {
    const [hourStr] = p.hour.split(':')
    return parseInt(hourStr) === currentHour
  })

  if (!slot) return null

  const estimatedCost = slot.price * $power.value
  return {
    hour: slot.hour,
    price: slot.price,
    estimatedCost: parseFloat(estimatedCost.toFixed(4))
  }
})
</script>




<style scoped>
  .contrated{
    --horizontal-alignment: center;
  --vertical-alignment:flex-end;
  }
.contracted-power {
  --horizontal-alignment: start;
  --gutter: var(--space-3xs);
  --vertical-alignment:flex-end;
}

.input-power {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-s);
  align-items: start;

  @media(min-width:40em) {
    grid-template-columns: 1fr 1fr;
    align-items: stretch;
  }

  & input {
    border-radius: 4px;
    padding-inline: var(--space-xs);
  }
  & input:disabled{
    color: var(--primary-100);
  }

}

.btn-power {
  --gutter: var(--space-xs);
  & .btn{
    flex-grow: 1;
  }
}

button:disabled {
  background-color: light-dark(rgba(239, 239, 239, 0.3), rgba(19, 1, 1, 0.3));
  color: light-dark(rgba(16, 16, 16, 0.3), rgba(255, 255, 255, 0.3));
  border-color: light-dark(rgba(118, 118, 118, 0.3), rgba(195, 195, 195, 0.3));
}

.tooltip-container {
  display: inline-block;
  position: relative;
  cursor: pointer;
  margin-left: 0.25rem;
}

.tooltip {
  display: none;
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: var(--size--1);
  z-index: 10;
  width: max(19rem, 100%);
  text-align: left;
  line-height: 1.5;
}

.tooltip-container:hover .tooltip {
  display: block;
}

.icon-small {
  width: var(--space-s);
  height: var(--space-s);
  vertical-align: middle;
}
</style>

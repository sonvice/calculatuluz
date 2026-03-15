<template>
  <div v-if="currentHourCost" class="contrated py-space-xs">
    <div class="current-hour-summary text-neutral-50 d-flex">
      <span class="hour-label text-size--1 text-bold">{{ currentHourCost.hour }}:</span>
      <span class="price-label text-size--1 ml-space-xs">{{ currentHourCost.price.toFixed(4) }} €/kWh</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from '@nanostores/vue'
import { priceData, power } from '../stores/prices.js'

const $priceData = useStore(priceData)
const $power = useStore(power)

const currentHourCost = computed(() => {
  const data = $priceData.value
  const now = new Date()
  const currentHour = now.getHours()

  const slot = data.prices.find(p => {
    const [hourStr] = p.hour.split(':')
    return parseInt(hourStr) === currentHour
  })

  if (!slot) return null

  return {
    hour: slot.hour,
    price: slot.price,
  }
})
</script>

<style scoped>
.contrated {
  display: flex;
  justify-content: center;
}

.current-hour-summary {
  align-items: center;
  gap: var(--space-2xs);
}
</style>

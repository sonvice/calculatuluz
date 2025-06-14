<template>
  <header class="bg-primary-900 py-space-s">
    <div class="container">
      <div class="header-price d-flex">
      <div class="text-primary-100 text-center">
        <div class="header-price__now d-flex align-center">
          <img 
            src="/images/light_bulb.png" 
            width="40"
            height="40" 
            alt="light_bulb" 
            class="header-price__logo" 
          />
          <div class="d-flex">
            <div class="current-price">
              <span>Precio actual: </span>
              <span class="header-price__price fw-700">{{ formattedCurrentPrice }}</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from '@nanostores/vue';
import { priceData } from '../stores/prices.js'; // Importar la store

const priceStore = useStore(priceData); // Obtener la store reactiva

const formatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

// Calcula el precio actual en función del rango horario de la data de la API
const currentPriceFromData = computed(() => {
  // Si no hay precios, usamos el currentPrice por defecto
  if (!priceStore.value.prices || !priceStore.value.prices.length) {
    return priceStore.value.currentPrice || 0;
  }

  const currentHour = new Date().getHours();

  // Busca el objeto cuyo rango horario contenga la hora actual
  const matchingPrice = priceStore.value.prices.find(item => {
    if (!item.hour) return false;
    const [startStr, endStr] = item.hour.split(' - ');
    const startHour = parseInt(startStr.split(':')[0]);
    const endHour = parseInt(endStr.split(':')[0]);

    // Caso normal: rango dentro del mismo día
    if (startHour < endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      // Rango que abarca medianoche (ej. "23:00 - 00:00")
      return currentHour >= startHour || currentHour < endHour;
    }
  });

  return matchingPrice ? matchingPrice.price : priceStore.value.currentPrice;
});

// Formateador con valor por defecto
const formattedCurrentPrice = computed(() => {
  return formatter.format(currentPriceFromData.value || 0);
});
</script>

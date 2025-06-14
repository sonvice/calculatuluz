// src/stores/prices.js
import { atom } from 'nanostores'
import { persistentAtom } from '@nanostores/persistent'

/** Día seleccionado (today / tomorrow) */
export const day = persistentAtom('selected-day', 'today', {
  encode: JSON.stringify,
  decode: (value) => {
    if (typeof window === 'undefined') return 'today'
    try {
      const parsed = JSON.parse(value)
      return parsed === 'tomorrow' ? 'tomorrow' : 'today'
    } catch {
      return 'today'
    }
  }
})

export const loading = atom(true)

/** Datos originales desde la API (€/kWh) */
export const originalData = atom({
  currentPrice: null,
  averagePrice: null,
  previousAverage: null,
  lastUpdated: null,
  prices: [],
  minPrice: null,
  maxPrice: null,
  tomorrowAvailable: false
})

/** Datos usados en la UI (con o sin estimaciones) */
export const priceData = atom({
  currentPrice: null,
  averagePrice: null,
  previousAverage: null,
  lastUpdated: null,
  prices: [],
  minPrice: null,
  maxPrice: null,
  tomorrowAvailable: false
})

/** Potencia contratada (kW) */
export const power = persistentAtom('contracted-power', 5.5, {
  encode: JSON.stringify,
  decode(v) {
    try {
      const p = JSON.parse(v)
      return typeof p === 'number' && p > 0 ? p : 5.5
    } catch {
      return 5.5
    }
  }
})

/** Flag que indica si se aplicó la potencia */
export const applied = persistentAtom('power-applied', false, {
  encode: JSON.stringify,
  decode(v) {
    try { return JSON.parse(v) === true } catch { return false }
  }
})

/** Fetch de precios desde tu API */
export async function fetchPrices(fetchDay) {
  loading.set(true)
  try {
    const url = new URL('/api/prices', window.location.origin)
    if (fetchDay === 'tomorrow') {
      url.searchParams.set('day', 'tomorrow')
    }
    url.searchParams.set('_t', Date.now()) // cache buster

    const res = await fetch(url)
    const data = await res.json()

    originalData.set(data)

    if (applied.get()) {
      // Si ya hay potencia aplicada, recalcular
      const newPrices = data.prices.map(slot => ({
        ...slot,
        estimatedCost: parseFloat((slot.price * power.get()).toFixed(4))
      }))
      priceData.set({ ...data, prices: newPrices })
    } else {
      priceData.set(data)
    }

    // Guardamos el flag de si hay datos para mañana
    localStorage.setItem('power-applied', JSON.stringify(applied.get()))
  } catch (e) {
    console.error('Fetch error:', e)
  } finally {
    loading.set(false)
  }
}

// Suscribirse a cambios del día
day.subscribe((newDay) => {
  if (typeof window !== 'undefined') {
    fetchPrices(newDay)
    localStorage.setItem('selected-day', JSON.stringify(newDay))
  }
})

// En cliente, al arrancar
if (typeof window !== 'undefined') {
  const wasApplied = JSON.parse(localStorage.getItem('power-applied') || 'false')
  applied.set(wasApplied)
  fetchPrices(day.get())
}

/** Aplica potencia: recalcula estimatedCost */
export function applyPower() {
  const base = originalData.get()
  const kW = power.get()

  const newPrices = base.prices.map(slot => ({
    ...slot,
    estimatedCost: parseFloat((slot.price * kW).toFixed(4))
  }))

  priceData.set({ ...base, prices: newPrices })
  applied.set(true)
  localStorage.setItem('power-applied', 'true')
}

/** Reset: vuelve a los precios originales sin estimatedCost */
export function resetData() {
  const base = originalData.get()
  priceData.set(base)
  applied.set(false)
  localStorage.setItem('power-applied', 'false')
}

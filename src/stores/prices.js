// src/stores/prices.js
import { atom } from 'nanostores'
import { DateTime } from 'luxon'

export const day       = atom('today')
export const loading   = atom(true)
export const priceData = atom({
  currentPrice:     null,
  averagePrice:     null,
  previousAverage:  null,
  lastUpdated:      null,
  prices:           [],
  minPrice:         null,
  maxPrice:         null,
  tomorrowAvailable:false
})

async function fetchPrices(fetchDay) {
  loading.set(true)
  try {
    const url = new URL('/api/prices', window.location.origin)
    if (fetchDay === 'tomorrow') url.searchParams.set('day', 'tomorrow')
    const res  = await fetch(url, { headers: { Accept: 'application/json' } })
    const data = await res.json()
    priceData.set({ ...data })
  } catch (e) {
    console.error('Error fetching prices:', e)
  } finally {
    loading.set(false)
  }
}

// dispara cada vez que cambie day en cliente
day.subscribe((newDay) => {
  if (typeof window !== 'undefined') {
    fetchPrices(newDay)
  }
})

// sólo en cliente, la primera vez
if (typeof window !== 'undefined') {
  fetchPrices(day.get())
}

// src/stores/prices.js
import { atom } from 'nanostores'
import { persistentAtom } from '@nanostores/persistent'

export const day = persistentAtom('selected-day', 'today', {
  encode: JSON.stringify,
  decode: (value) => {
    // Solo en cliente y con valor válido
    if (typeof window === 'undefined') return 'today'
    try {
      const parsed = JSON.parse(value)
      return parsed === 'tomorrow' ? 'tomorrow' : 'today'
    } catch {
      return 'today'
    }
  }
})
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
  loading.set(true);
  try {
    const url = new URL('/api/prices', window.location.origin);
    if (fetchDay === 'tomorrow') {
      url.searchParams.set('day', 'tomorrow');
    }
    
    // Forzar actualización cada minuto
    url.searchParams.set('_t', Date.now()); 

    const res = await fetch(url);
    const data = await res.json();
    
    // Actualización crítica (mergear datos)
    priceData.set({
      ...priceData.get(), 
      ...data, 
      prices: data.prices 
    });

  } catch (e) {
    console.error('Fetch error:', e);
  } finally {
    loading.set(false);
  }
}

// dispara cada vez que cambie day en cliente
day.subscribe((newDay) => {
  if (typeof window !== 'undefined') {
    // Sincronizar con API y localStorage
    fetchPrices(newDay)
    localStorage.setItem('selected-day', JSON.stringify(newDay))
  }
})

// sólo en cliente, la primera vez
if (typeof window !== 'undefined') {
  fetchPrices(day.get())
}

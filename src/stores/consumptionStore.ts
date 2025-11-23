// src/stores/consumptionStore.ts
import { atom, map } from 'nanostores'
import { power as powerStore } from './prices'

// Potencia por defecto: 4.6 kW (hogares con vitrocerámica en España)
const DEFAULT_POWER = 4.6

// Tipo de electrodoméstico
export interface Appliance {
  id: string
  name: string
  watts: number
  hours: number
  category?: string
}

// Perfil del usuario (simplificado - solo PVPC)
export interface UserProfile {
  potencia: number
  tarifa: 'pvpc'
}

// Resumen de consumo calculado
export interface ConsumptionSummary {
  totalWhDia: number
  totalKwhDia: number
  totalKwhMes: number
  costeDia: number
  costeMes: number
  costePotenciaDia: number
  costePotenciaMes: number
}

// Store de perfil - sincronizado con powerStore de prices.js
export const profile = map<UserProfile>({
  potencia: DEFAULT_POWER,
  tarifa: 'pvpc'
})

// Sincronizar potencia inicial desde prices.js
if (typeof window !== 'undefined') {
  const initialPower = powerStore.get()
  // Solo usar powerStore si ya tiene un valor guardado distinto del default anterior
  profile.set({ 
    potencia: initialPower && initialPower !== 5.5 ? initialPower : DEFAULT_POWER, 
    tarifa: 'pvpc' 
  })
}

// Sincronización bidireccional
profile.subscribe((value) => {
  if (typeof window !== 'undefined' && value.potencia !== powerStore.get()) {
    powerStore.set(value.potencia)
  }
})

powerStore.subscribe((power) => {
  if (typeof window !== 'undefined' && power !== profile.get().potencia) {
    profile.set({ potencia: power, tarifa: 'pvpc' })
  }
})

// Store de electrodomésticos
export const appliances = atom<Appliance[]>([])

// Store del resumen
export const summary = map<ConsumptionSummary>({
  totalWhDia: 0,
  totalKwhDia: 0,
  totalKwhMes: 0,
  costeDia: 0,
  costeMes: 0,
  costePotenciaDia: 0,
  costePotenciaMes: 0
})

// Cargar desde localStorage
if (typeof window !== 'undefined') {
  const savedProfile = localStorage.getItem('user-profile')
  const savedAppliances = localStorage.getItem('user-appliances')
  
  if (savedProfile) {
    try {
      const parsed = JSON.parse(savedProfile)
      profile.set({ potencia: parsed.potencia || DEFAULT_POWER, tarifa: 'pvpc' })
    } catch (e) {
      console.error('Error loading profile:', e)
    }
  }
  
  if (savedAppliances) {
    try {
      appliances.set(JSON.parse(savedAppliances))
    } catch (e) {
      console.error('Error loading appliances:', e)
    }
  }
}

// Persistir cambios
profile.subscribe((value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user-profile', JSON.stringify(value))
  }
})

appliances.subscribe((value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user-appliances', JSON.stringify(value))
  }
})

// Helpers CRUD
export function addAppliance(appliance: Omit<Appliance, 'id'>) {
  const newAppliance: Appliance = {
    ...appliance,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  appliances.set([...appliances.get(), newAppliance])
}

export function removeAppliance(id: string) {
  appliances.set(appliances.get().filter(a => a.id !== id))
}

export function updateAppliance(id: string, updates: Partial<Appliance>) {
  appliances.set(
    appliances.get().map(a => a.id === id ? { ...a, ...updates } : a)
  )
}
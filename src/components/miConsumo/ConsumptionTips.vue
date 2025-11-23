<script setup>
import { computed } from 'vue'
import { useStore } from '@nanostores/vue'
import { appliances, summary, profile } from '../../stores/consumptionStore'
import { priceData } from '../../stores/prices'
import { AlertTriangle, Lightbulb, Info, CheckCircle, TrendingUp } from 'lucide-vue-next'

const $appliances = useStore(appliances)
const $summary = useStore(summary)
const $profile = useStore(profile)
const $prices = useStore(priceData)

// Análisis de consumo y generación de tips personalizados
const tips = computed(() => {
  const tips = []
  const appliancesList = $appliances.value || []
  const summaryData = $summary.value
  const profileData = $profile.value
  const prices = $prices.value
  
  // 1. Consumo total alto
  if (summaryData.totalKwhDia > 15) {
    tips.push({
      icon: AlertTriangle,
      type: 'warning',
      title: 'Consumo elevado',
      text: `Tu consumo diario de ${summaryData.totalKwhDia.toFixed(1)} kWh está por encima de la media española (10-12 kWh/día). Revisa tus electrodomésticos.`,
      savings: 'Hasta 30€/mes'
    })
  }
  
  // 2. Electrodomésticos de alto consumo
  const highPowerAppliances = appliancesList.filter(a => a.watts > 1500 && a.hours > 2)
  if (highPowerAppliances.length > 0) {
    const names = highPowerAppliances.map(a => a.name).join(', ')
    tips.push({
      icon: Lightbulb,
      type: 'tip',
      title: 'Aparatos de alta potencia',
      text: `Detectamos ${highPowerAppliances.length} aparato(s) de alto consumo: ${names}. Úsalos en horarios valle.`,
      savings: 'Hasta 20€/mes'
    })
  }
  
  // 3. Aparatos 24h
  const alwaysOn = appliancesList.filter(a => a.hours >= 20)
  if (alwaysOn.length > 1) {
    tips.push({
      icon: Info,
      type: 'info',
      title: 'Consumo continuo',
      text: `Tienes ${alwaysOn.length} aparatos funcionando 24h. Verifica que sean necesarios y considera modelos más eficientes.`,
      savings: 'Hasta 15€/mes'
    })
  }
  
  // 4. Precio medio alto
  if (prices && profileData.tarifa === 'pvpc' && prices.averagePrice > 0.15) {
    tips.push({
      icon: Lightbulb,
      type: 'tip',
      title: 'Precio elevado hoy',
      text: `El precio medio hoy es ${prices.averagePrice.toFixed(4)} €/kWh. Pospón lavadoras y lavavajillas a las horas valle.`,
      savings: 'Hasta 5€/día'
    })
  }
  
  // 5. Tarifa fija cara
  if (profileData.tarifa === 'fija' && profileData.precioFijo > 0.16) {
    tips.push({
      icon: AlertTriangle,
      type: 'warning',
      title: 'Tarifa fija cara',
      text: `Tu precio fijo (${profileData.precioFijo.toFixed(4)} €/kWh) está por encima del PVPC medio. Considera cambiar a PVPC.`,
      savings: 'Hasta 40€/mes'
    })
  }
  
  // 6. Potencia contratada
  const potenciaEstimada = Math.max(...appliancesList.map(a => a.watts)) / 1000
  if (profileData.potencia > potenciaEstimada * 1.5) {
    tips.push({
      icon: Lightbulb,
      type: 'tip',
      title: 'Potencia sobredimensionada',
      text: `Tienes contratados ${profileData.potencia} kW pero tu consumo pico no supera ${potenciaEstimada.toFixed(1)} kW. Puedes reducir potencia.`,
      savings: 'Hasta 10€/mes'
    })
  }
  
  // 7. Sin electrodomésticos registrados
  if (appliancesList.length === 0) {
    tips.push({
      icon: Info,
      type: 'info',
      title: 'Añade tus electrodomésticos',
      text: 'Para obtener consejos personalizados, añade los aparatos que usas en tu hogar.',
      savings: null
    })
  }
  
  // 8. Consejos generales si hay pocos tips específicos
  if (tips.length < 3) {
    tips.push({
      icon: CheckCircle,
      type: 'success',
      title: '¡Buen perfil de consumo!',
      text: 'Tu consumo está dentro de rangos normales. Mantén estos hábitos y revisa periódicamente.',
      savings: null
    })
    
    tips.push({
      icon: Lightbulb,
      type: 'tip',
      title: 'Horarios valle',
      text: 'La franja más barata suele ser de 00:00 a 08:00. Programa lavadoras y carga de vehículos en este horario.',
      savings: 'Hasta 25€/mes'
    })
  }
  
  return tips
})

// Calcular ahorro potencial total
const totalSavings = computed(() => {
  return tips.value
    .filter(t => t.savings)
    .map(t => {
      const match = t.savings.match(/(\d+)/)
      return match ? parseInt(match[1]) : 0
    })
    .reduce((a, b) => a + b, 0)
})

const tipTypeConfig = {
  warning: { 
    bg: 'rgba(255, 107, 107, 0.1)', 
    border: '#ff6b6b', 
    text: '#ff9999',
    iconColor: '#ff6b6b'
  },
  tip: { 
    bg: 'rgba(244, 184, 96, 0.1)', 
    border: '#f4b860', 
    text: '#f4b860',
    iconColor: '#f4b860'
  },
  info: { 
    bg: 'rgba(74, 123, 167, 0.1)', 
    border: '#4a7ba7', 
    text: '#c8dff5',
    iconColor: '#4a7ba7'
  },
  success: { 
    bg: 'rgba(95, 212, 167, 0.1)', 
    border: '#5fd4a7', 
    text: '#5fd4a7',
    iconColor: '#5fd4a7'
  }
}
</script>

<template>
  <div class="tips-container">
    <!-- Indicador de ahorro total -->
    <div v-if="totalSavings > 0" class="savings-banner mb-space-m">
      <div class="savings-icon">
        <TrendingUp :size="24" />
      </div>
      <div class="savings-content">
        <strong class="savings-title">Potencial de ahorro mensual</strong>
        <div class="savings-amount">Hasta {{ totalSavings }}€/mes</div>
      </div>
    </div>

    <!-- Tips -->
    <div 
      v-for="(tip, index) in tips" 
      :key="index"
      class="tip-card"
      :style="{
        background: tipTypeConfig[tip.type].bg,
        borderLeftColor: tipTypeConfig[tip.type].border
      }"
    >
      <div class="tip-header">
        <component 
          :is="tip.icon" 
          :size="24" 
          class="tip-icon"
          :style="{ color: tipTypeConfig[tip.type].iconColor }"
        />
        <h4 class="tip-title">{{ tip.title }}</h4>
      </div>
      
      <p class="tip-text">{{ tip.text }}</p>
      
      <div v-if="tip.savings" class="tip-savings">
        <span class="savings-badge">{{ tip.savings }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tips-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.savings-banner {
  background: linear-gradient(135deg, rgba(95, 212, 167, 0.15) 0%, rgba(95, 212, 167, 0.05) 100%);
  border: 2px solid rgba(95, 212, 167, 0.3);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.savings-icon {
  background: var(--accent-500);
  color: var(--primary-900);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.savings-content {
  flex: 1;
}

.savings-title {
  display: block;
  color: #e8f1ff;
  font-size: 0.85rem;
  margin-bottom: 4px;
}

.savings-amount {
  color: var(--accent-500);
  font-size: 1.5rem;
  font-weight: 700;
}

.tip-card {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
  transition: transform 0.2s;
}

.tip-card:hover {
  transform: translateX(4px);
}

.tip-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.tip-icon {
  flex-shrink: 0;
}

.tip-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #e8f1ff;
}

.tip-text {
  margin: 0 0 8px 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #c8dff5;
}

.tip-savings {
  margin-top: 8px;
}

.savings-badge {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(95, 212, 167, 0.2);
  color: #5fd4a7;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}



.btn-cta {
  display: inline-block;
  padding: 10px 20px;
  background: linear-gradient(135deg, #4a7ba7 0%, #5a8bb7 100%);
  color: #fff;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 123, 167, 0.3);
}

@media (max-width: 768px) {
  .savings-banner {
    flex-direction: column;
    text-align: center;
  }
  
  .savings-amount {
    font-size: 1.3rem;
  }
}
</style>
<script setup>
import { ref, computed } from 'vue'
import { useStore } from '@nanostores/vue'
import { priceData, loading, day } from '../stores/prices'
import { 
  Zap, 
  Clock, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  Home, 
  Euro, 
  FileText, 
  HelpCircle,
  RefreshCw,
  Calculator,
  Percent,
  CalendarDays
} from 'lucide-vue-next'

// ============================================
// CONSTANTES REGULADAS 2025 (Tarifa 2.0TD)
// ============================================

const PEAJES_POTENCIA = {
  punta: 22.958932,
  valle: 0.442165,
}

const PEAJES_ENERGIA = {
  punta: 0.034234,
  llano: 0.01654,
  valle: 0.000079,
}

const CARGOS_POTENCIA = {
  punta: 3.971618,
  valle: 0.255423,
}

const CARGOS_ENERGIA = {
  punta: 0.058305,
  llano: 0.011661,
  valle: 0.002915,
}

const PAGOS_CAPACIDAD = {
  punta: 0.00078,
  llano: 0.00013,
  valle: 0,
}

const IMPUESTO_ELECTRICO = 0.0511269632
const IVA = 0.21
const BONO_SOCIAL_DIA = 0.0127424301
const MARGEN_COMERCIALIZACION = 3.113
const ALQUILER_CONTADOR = 0.81
const RETRIBUCION_OMIE = 0.000042

const POTENCIAS_COMUNES = [2.3, 3.45, 4.6, 5.75, 6.9, 8.05, 9.2, 10.35, 11.5, 13.8]

// ============================================
// STORE CONNECTION
// ============================================
const $priceData = useStore(priceData)
const $loading = useStore(loading)
const $day = useStore(day)

// ============================================
// STATE
// ============================================
const datos = ref({
  tipoMercado: 'pvpc',
  potenciaPunta: 4.6,
  potenciaValle: 4.6,
  consumoPunta: 50,
  consumoLlano: 80,
  consumoValle: 120,
  diasFacturados: 30,
  alquilerContador: true,
  bonoSocial: 'ninguno',
  precioPotencia: 0.10,
  precioEnergiaPunta: 0.18,
  precioEnergiaLlano: 0.14,
  precioEnergiaValle: 0.08,
})

const seccionesExpandidas = ref({
  potencia: false,
  energia: false,
  otros: false,
  info: false,
})

// ============================================
// COMPUTED: Precios PVPC desde el store
// ============================================
const preciosPVPC = computed(() => {
  const prices = $priceData.value?.prices || []
  
  if (prices.length === 0) {
    return { punta: 0.12, llano: 0.09, valle: 0.05, promedio: 0.08 }
  }

  const now = new Date()
  const isWeekend = now.getDay() === 0 || now.getDay() === 6
  
  let puntaSum = 0, puntaCount = 0
  let llanoSum = 0, llanoCount = 0
  let valleSum = 0, valleCount = 0
  
  prices.forEach((slot, index) => {
    const hour = index
    const precio = slot.price || 0
    
    if (isWeekend || hour < 8) {
      valleSum += precio
      valleCount++
    } else if ((hour >= 10 && hour < 14) || (hour >= 18 && hour < 22)) {
      puntaSum += precio
      puntaCount++
    } else {
      llanoSum += precio
      llanoCount++
    }
  })
  
  return {
    punta: puntaCount > 0 ? puntaSum / puntaCount : 0.12,
    llano: llanoCount > 0 ? llanoSum / llanoCount : 0.09,
    valle: valleCount > 0 ? valleSum / valleCount : 0.05,
    promedio: $priceData.value?.averagePrice || 0.08,
  }
})

const precioActual = computed(() => $priceData.value?.currentPrice || null)

// ============================================
// COMPUTED: Cálculo de factura
// ============================================
const factura = computed(() => {
  const diasAnyo = 365
  const factorDias = datos.value.diasFacturados / diasAnyo
  
  let terminoPotencia, terminoEnergia

  if (datos.value.tipoMercado === 'pvpc') {
    const peajesPunta = datos.value.potenciaPunta * PEAJES_POTENCIA.punta * factorDias
    const peajesValle = datos.value.potenciaValle * PEAJES_POTENCIA.valle * factorDias
    const cargosPunta = datos.value.potenciaPunta * CARGOS_POTENCIA.punta * factorDias
    const cargosValle = datos.value.potenciaValle * CARGOS_POTENCIA.valle * factorDias
    const margenComercializacion = datos.value.potenciaPunta * MARGEN_COMERCIALIZACION * factorDias

    terminoPotencia = {
      peajesPunta, peajesValle, cargosPunta, cargosValle, margenComercializacion,
      total: peajesPunta + peajesValle + cargosPunta + cargosValle + margenComercializacion,
    }

    const peajesEnergiaPunta = datos.value.consumoPunta * PEAJES_ENERGIA.punta
    const peajesEnergiaLlano = datos.value.consumoLlano * PEAJES_ENERGIA.llano
    const peajesEnergiaValle = datos.value.consumoValle * PEAJES_ENERGIA.valle
    const cargosEnergiaPunta = datos.value.consumoPunta * CARGOS_ENERGIA.punta
    const cargosEnergiaLlano = datos.value.consumoLlano * CARGOS_ENERGIA.llano
    const cargosEnergiaValle = datos.value.consumoValle * CARGOS_ENERGIA.valle
    const pagosCapacidadPunta = datos.value.consumoPunta * PAGOS_CAPACIDAD.punta
    const pagosCapacidadLlano = datos.value.consumoLlano * PAGOS_CAPACIDAD.llano
    const consumoTotal = datos.value.consumoPunta + datos.value.consumoLlano + datos.value.consumoValle
    const omie = consumoTotal * RETRIBUCION_OMIE

    const costeEnergia = 
      datos.value.consumoPunta * preciosPVPC.value.punta +
      datos.value.consumoLlano * preciosPVPC.value.llano +
      datos.value.consumoValle * preciosPVPC.value.valle

    terminoEnergia = {
      peajesPunta: peajesEnergiaPunta, peajesLlano: peajesEnergiaLlano, peajesValle: peajesEnergiaValle,
      cargosPunta: cargosEnergiaPunta, cargosLlano: cargosEnergiaLlano, cargosValle: cargosEnergiaValle,
      pagosCapacidadPunta, pagosCapacidadLlano, omie, costeEnergia,
      total: peajesEnergiaPunta + peajesEnergiaLlano + peajesEnergiaValle +
        cargosEnergiaPunta + cargosEnergiaLlano + cargosEnergiaValle +
        pagosCapacidadPunta + pagosCapacidadLlano + omie + costeEnergia,
    }
  } else {
    const potenciaTotal = datos.value.potenciaPunta * (datos.value.precioPotencia || 0) * datos.value.diasFacturados
    terminoPotencia = {
      peajesPunta: 0, peajesValle: 0, cargosPunta: 0, cargosValle: 0, margenComercializacion: 0,
      total: potenciaTotal,
    }

    const energiaPunta = datos.value.consumoPunta * (datos.value.precioEnergiaPunta || 0)
    const energiaLlano = datos.value.consumoLlano * (datos.value.precioEnergiaLlano || 0)
    const energiaValle = datos.value.consumoValle * (datos.value.precioEnergiaValle || 0)

    terminoEnergia = {
      peajesPunta: 0, peajesLlano: 0, peajesValle: 0,
      cargosPunta: 0, cargosLlano: 0, cargosValle: 0,
      pagosCapacidadPunta: 0, pagosCapacidadLlano: 0, omie: 0,
      costeEnergia: energiaPunta + energiaLlano + energiaValle,
      total: energiaPunta + energiaLlano + energiaValle,
    }
  }

  const alquilerContador = datos.value.alquilerContador ? ALQUILER_CONTADOR * (datos.value.diasFacturados / 30) : 0
  const bonoSocialCargo = datos.value.diasFacturados * BONO_SOCIAL_DIA
  const otrosConceptos = { alquilerContador, bonoSocial: bonoSocialCargo, total: alquilerContador + bonoSocialCargo }

  const subtotal = terminoPotencia.total + terminoEnergia.total + otrosConceptos.total
  const impuestoElectrico = subtotal * IMPUESTO_ELECTRICO
  const baseImponible = subtotal + impuestoElectrico
  const iva = baseImponible * IVA
  let total = baseImponible + iva

  let descuentoBonoSocial = 0
  if (datos.value.bonoSocial === 'vulnerable') descuentoBonoSocial = total * 0.25
  else if (datos.value.bonoSocial === 'vulnerable_severo') descuentoBonoSocial = total * 0.40
  total = total - descuentoBonoSocial

  return { terminoPotencia, terminoEnergia, otrosConceptos, subtotal, impuestoElectrico, baseImponible, iva, descuentoBonoSocial, total }
})

const consumoTotal = computed(() => datos.value.consumoPunta + datos.value.consumoLlano + datos.value.consumoValle)
const precioMedioKwh = computed(() => consumoTotal.value > 0 ? factura.value.total / consumoTotal.value : 0)
const costeDiario = computed(() => factura.value.total / datos.value.diasFacturados)
const estimacionAnual = computed(() => costeDiario.value * 365)

// Porcentajes para la barra
const porcentajePotencia = computed(() => (factura.value.terminoPotencia.total / factura.value.total) * 100)
const porcentajeEnergia = computed(() => (factura.value.terminoEnergia.total / factura.value.total) * 100)
const porcentajeOtros = computed(() => (factura.value.otrosConceptos.total / factura.value.total) * 100)
const porcentajeImpuestos = computed(() => ((factura.value.impuestoElectrico + factura.value.iva) / factura.value.total) * 100)

// ============================================
// METHODS
// ============================================
function toggleSeccion(seccion) {
  seccionesExpandidas.value[seccion] = !seccionesExpandidas.value[seccion]
}

function formatearEuros(valor) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)
}

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(valor)
}
</script>

<template>
  <div class="simulador">
    <!-- Precio actual en tiempo real -->
    <div v-if="datos.tipoMercado === 'pvpc'" class="precio-live">
      <div class="precio-live__header">
        <RefreshCw :class="['precio-live__icon', { 'is-loading': $loading }]" :size="18" />
        <span v-if="precioActual !== null" class="precio-live__actual">
          Precio PVPC ahora: <strong>{{ formatearPrecio(precioActual) }} €/kWh</strong>
        </span>
        <span v-else class="precio-live__loading">Cargando precio actual...</span>
      </div>
      <div class="precio-live__periodos">
        <span class="precio-badge precio-badge--punta">
          <span class="precio-badge__dot"></span>
          Punta: {{ formatearPrecio(preciosPVPC.punta) }} €
        </span>
        <span class="precio-badge precio-badge--llano">
          <span class="precio-badge__dot"></span>
          Llano: {{ formatearPrecio(preciosPVPC.llano) }} €
        </span>
        <span class="precio-badge precio-badge--valle">
          <span class="precio-badge__dot"></span>
          Valle: {{ formatearPrecio(preciosPVPC.valle) }} €
        </span>
      </div>
    </div>

    <div class="simulador__grid">
      <!-- ========== FORMULARIO ========== -->
      <div class="simulador__form">
        
        <!-- Tipo de mercado -->
        <section class="form-card">
          <h3 class="form-card__title">
            <Home :size="20" />
            Tipo de Contrato
          </h3>
          <div class="mercado-tabs">
            <button
              :class="['mercado-tab', { 'is-active': datos.tipoMercado === 'pvpc' }]"
              @click="datos.tipoMercado = 'pvpc'"
            >
              <span class="mercado-tab__title">PVPC</span>
              <span class="mercado-tab__desc">Precio variable</span>
            </button>
            <button
              :class="['mercado-tab', { 'is-active': datos.tipoMercado === 'libre' }]"
              @click="datos.tipoMercado = 'libre'"
            >
              <span class="mercado-tab__title">Precio Fijo</span>
              <span class="mercado-tab__desc">Mercado libre</span>
            </button>
          </div>
        </section>

        <!-- Potencia contratada -->
        <section class="form-card">
          <h3 class="form-card__title">
            <Zap :size="20" />
            Potencia Contratada
          </h3>
          <div class="form-grid form-grid--2">
            <div class="form-field">
              <label class="form-label">Potencia Punta</label>
              <select v-model.number="datos.potenciaPunta" class="form-select">
                <option v-for="p in POTENCIAS_COMUNES" :key="p" :value="p">{{ p.toFixed(2) }} kW</option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Potencia Valle</label>
              <select v-model.number="datos.potenciaValle" class="form-select">
                <option v-for="p in POTENCIAS_COMUNES" :key="p" :value="p">{{ p.toFixed(2) }} kW</option>
              </select>
            </div>
          </div>
          <p class="form-hint">
            <Info :size="14" />
            Puedes tener más potencia en valle para cargar vehículos eléctricos
          </p>
        </section>

        <!-- Consumo por periodos -->
        <section class="form-card">
          <h3 class="form-card__title">
            <TrendingUp :size="20" />
            Consumo Eléctrico (kWh)
          </h3>
          <div class="consumo-periodos">
            <div class="consumo-periodo consumo-periodo--punta">
              <div class="consumo-periodo__header">
                <span class="consumo-periodo__dot"></span>
                <span class="consumo-periodo__name">Punta</span>
              </div>
              <input type="number" min="0" v-model.number="datos.consumoPunta" class="form-input" />
              <span class="consumo-periodo__hours">10-14h y 18-22h</span>
            </div>
            <div class="consumo-periodo consumo-periodo--llano">
              <div class="consumo-periodo__header">
                <span class="consumo-periodo__dot"></span>
                <span class="consumo-periodo__name">Llano</span>
              </div>
              <input type="number" min="0" v-model.number="datos.consumoLlano" class="form-input" />
              <span class="consumo-periodo__hours">8-10h, 14-18h, 22-24h</span>
            </div>
            <div class="consumo-periodo consumo-periodo--valle">
              <div class="consumo-periodo__header">
                <span class="consumo-periodo__dot"></span>
                <span class="consumo-periodo__name">Valle</span>
              </div>
              <input type="number" min="0" v-model.number="datos.consumoValle" class="form-input" />
              <span class="consumo-periodo__hours">0-8h + fines de semana</span>
            </div>
          </div>
          <div class="consumo-total">
            <span>Consumo total</span>
            <strong>{{ consumoTotal }} kWh</strong>
          </div>
        </section>

        <!-- Días facturados -->
        <section class="form-card">
          <h3 class="form-card__title">
            <CalendarDays :size="20" />
            Periodo
          </h3>
          <div class="form-field">
            <label class="form-label">Días facturados</label>
            <input type="number" min="1" max="62" v-model.number="datos.diasFacturados" class="form-input form-input--short" />
          </div>
        </section>

        <!-- Precios mercado libre -->
        <section v-if="datos.tipoMercado === 'libre'" class="form-card form-card--highlight">
          <h3 class="form-card__title">
            <Euro :size="20" />
            Precios de tu Tarifa
          </h3>
          <div class="form-field">
            <label class="form-label">Precio Potencia (€/kW/día)</label>
            <input type="number" step="0.001" min="0" v-model.number="datos.precioPotencia" class="form-input form-input--short" />
          </div>
          <div class="form-grid form-grid--3">
            <div class="form-field">
              <label class="form-label">€/kWh Punta</label>
              <input type="number" step="0.001" min="0" v-model.number="datos.precioEnergiaPunta" class="form-input" />
            </div>
            <div class="form-field">
              <label class="form-label">€/kWh Llano</label>
              <input type="number" step="0.001" min="0" v-model.number="datos.precioEnergiaLlano" class="form-input" />
            </div>
            <div class="form-field">
              <label class="form-label">€/kWh Valle</label>
              <input type="number" step="0.001" min="0" v-model.number="datos.precioEnergiaValle" class="form-input" />
            </div>
          </div>
        </section>

        <!-- Opciones adicionales -->
        <section class="form-card">
          <h3 class="form-card__title">
            <FileText :size="20" />
            Opciones
          </h3>
          <label class="form-checkbox">
            <input type="checkbox" v-model="datos.alquilerContador" />
            <span class="form-checkbox__mark"></span>
            <span>Alquiler de contador</span>
          </label>
          <div class="form-field">
            <label class="form-label">Bono Social</label>
            <select v-model="datos.bonoSocial" class="form-select">
              <option value="ninguno">No tengo bono social</option>
              <option value="vulnerable">Vulnerable (25% dto.)</option>
              <option value="vulnerable_severo">Vulnerable severo (40% dto.)</option>
            </select>
          </div>
        </section>
      </div>

      <!-- ========== RESULTADOS ========== -->
      <div class="simulador__results">
        
        <!-- Total destacado -->
        <div class="result-total">
          <span class="result-total__label">Total Factura</span>
          <span class="result-total__amount">{{ formatearEuros(factura.total) }}</span>
          <span class="result-total__period">{{ datos.diasFacturados }} días · {{ consumoTotal }} kWh</span>
        </div>

        <!-- Barra de desglose -->
        <div class="result-bar">
          <div class="result-bar__chart">
            <div class="result-bar__segment result-bar__segment--potencia" :style="{ width: porcentajePotencia + '%' }"></div>
            <div class="result-bar__segment result-bar__segment--energia" :style="{ width: porcentajeEnergia + '%' }"></div>
            <div class="result-bar__segment result-bar__segment--otros" :style="{ width: porcentajeOtros + '%' }"></div>
            <div class="result-bar__segment result-bar__segment--impuestos" :style="{ width: porcentajeImpuestos + '%' }"></div>
          </div>
          <div class="result-bar__legend">
            <span class="legend-item legend-item--potencia">Potencia {{ porcentajePotencia.toFixed(0) }}%</span>
            <span class="legend-item legend-item--energia">Energía {{ porcentajeEnergia.toFixed(0) }}%</span>
            <span class="legend-item legend-item--otros">Otros {{ porcentajeOtros.toFixed(0) }}%</span>
            <span class="legend-item legend-item--impuestos">Impuestos {{ porcentajeImpuestos.toFixed(0) }}%</span>
          </div>
        </div>

        <!-- Desglose acordeón -->
        <div class="result-accordion p-space-s">
          
          <!-- Término de potencia -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggleSeccion('potencia')">
              <div class="accordion-header__left">
                <Zap :size="18" class="accordion-icon accordion-icon--potencia" />
                <span>Término de Potencia</span>
              </div>
              <div class="accordion-header__right">
                <span class="accordion-amount">{{ formatearEuros(factura.terminoPotencia.total) }}</span>
                <ChevronDown :class="['accordion-chevron', { 'is-open': seccionesExpandidas.potencia }]" :size="18" />
              </div>
            </button>
            <div :class="['accordion-content', { 'is-open': seccionesExpandidas.potencia }]">
              <template v-if="datos.tipoMercado === 'pvpc'">
                <div class="accordion-row">
                  <span>Peajes potencia punta</span>
                  <span>{{ formatearEuros(factura.terminoPotencia.peajesPunta) }}</span>
                </div>
                <div class="accordion-row">
                  <span>Peajes potencia valle</span>
                  <span>{{ formatearEuros(factura.terminoPotencia.peajesValle) }}</span>
                </div>
                <div class="accordion-row">
                  <span>Cargos potencia punta</span>
                  <span>{{ formatearEuros(factura.terminoPotencia.cargosPunta) }}</span>
                </div>
                <div class="accordion-row">
                  <span>Cargos potencia valle</span>
                  <span>{{ formatearEuros(factura.terminoPotencia.cargosValle) }}</span>
                </div>
                <div class="accordion-row">
                  <span>Margen comercialización</span>
                  <span>{{ formatearEuros(factura.terminoPotencia.margenComercializacion) }}</span>
                </div>
              </template>
              <template v-else>
                <div class="accordion-row">
                  <span>Potencia contratada</span>
                  <span>{{ formatearEuros(factura.terminoPotencia.total) }}</span>
                </div>
              </template>
            </div>
          </div>

          <!-- Término de energía -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggleSeccion('energia')">
              <div class="accordion-header__left">
                <TrendingUp :size="18" class="accordion-icon accordion-icon--energia" />
                <span>Término de Energía</span>
              </div>
              <div class="accordion-header__right">
                <span class="accordion-amount">{{ formatearEuros(factura.terminoEnergia.total) }}</span>
                <ChevronDown :class="['accordion-chevron', { 'is-open': seccionesExpandidas.energia }]" :size="18" />
              </div>
            </button>
            <div :class="['accordion-content', { 'is-open': seccionesExpandidas.energia }]">
              <template v-if="datos.tipoMercado === 'pvpc'">
                <div class="accordion-group">
                  <span class="accordion-group__title">Coste energía PVPC</span>
                  <div class="accordion-row accordion-row--highlight-punta">
                    <span>Punta ({{ datos.consumoPunta }} kWh × {{ formatearPrecio(preciosPVPC.punta) }})</span>
                    <span>{{ formatearEuros(datos.consumoPunta * preciosPVPC.punta) }}</span>
                  </div>
                  <div class="accordion-row accordion-row--highlight-llano">
                    <span>Llano ({{ datos.consumoLlano }} kWh × {{ formatearPrecio(preciosPVPC.llano) }})</span>
                    <span>{{ formatearEuros(datos.consumoLlano * preciosPVPC.llano) }}</span>
                  </div>
                  <div class="accordion-row accordion-row--highlight-valle">
                    <span>Valle ({{ datos.consumoValle }} kWh × {{ formatearPrecio(preciosPVPC.valle) }})</span>
                    <span>{{ formatearEuros(datos.consumoValle * preciosPVPC.valle) }}</span>
                  </div>
                </div>
                <div class="accordion-group">
                  <span class="accordion-group__title">Peajes y cargos</span>
                  <div class="accordion-row">
                    <span>Peajes + Cargos</span>
                    <span>{{ formatearEuros(
                      factura.terminoEnergia.peajesPunta + factura.terminoEnergia.peajesLlano + factura.terminoEnergia.peajesValle +
                      factura.terminoEnergia.cargosPunta + factura.terminoEnergia.cargosLlano + factura.terminoEnergia.cargosValle
                    ) }}</span>
                  </div>
                  <div class="accordion-row">
                    <span>Pagos capacidad + OMIE</span>
                    <span>{{ formatearEuros(factura.terminoEnergia.pagosCapacidadPunta + factura.terminoEnergia.pagosCapacidadLlano + factura.terminoEnergia.omie) }}</span>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="accordion-row">
                  <span>Punta ({{ datos.consumoPunta }} kWh)</span>
                  <span>{{ formatearEuros(datos.consumoPunta * datos.precioEnergiaPunta) }}</span>
                </div>
                <div class="accordion-row">
                  <span>Llano ({{ datos.consumoLlano }} kWh)</span>
                  <span>{{ formatearEuros(datos.consumoLlano * datos.precioEnergiaLlano) }}</span>
                </div>
                <div class="accordion-row">
                  <span>Valle ({{ datos.consumoValle }} kWh)</span>
                  <span>{{ formatearEuros(datos.consumoValle * datos.precioEnergiaValle) }}</span>
                </div>
              </template>
            </div>
          </div>

          <!-- Otros conceptos -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggleSeccion('otros')">
              <div class="accordion-header__left">
                <FileText :size="18" class="accordion-icon accordion-icon--otros" />
                <span>Otros Conceptos</span>
              </div>
              <div class="accordion-header__right">
                <span class="accordion-amount">{{ formatearEuros(factura.otrosConceptos.total) }}</span>
                <ChevronDown :class="['accordion-chevron', { 'is-open': seccionesExpandidas.otros }]" :size="18" />
              </div>
            </button>
            <div :class="['accordion-content', { 'is-open': seccionesExpandidas.otros }]">
              <div v-if="datos.alquilerContador" class="accordion-row">
                <span>Alquiler contador</span>
                <span>{{ formatearEuros(factura.otrosConceptos.alquilerContador) }}</span>
              </div>
              <div class="accordion-row">
                <span>Financiación Bono Social</span>
                <span>{{ formatearEuros(factura.otrosConceptos.bonoSocial) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Impuestos -->
        <div class="result-taxes">
          <div class="tax-row"><span>Subtotal</span><span>{{ formatearEuros(factura.subtotal) }}</span></div>
          <div class="tax-row"><span>Impuesto eléctrico (5,11%)</span><span>{{ formatearEuros(factura.impuestoElectrico) }}</span></div>
          <div class="tax-row"><span>Base imponible</span><span>{{ formatearEuros(factura.baseImponible) }}</span></div>
          <div class="tax-row"><span>IVA (21%)</span><span>{{ formatearEuros(factura.iva) }}</span></div>
          <div v-if="factura.descuentoBonoSocial > 0" class="tax-row tax-row--discount">
            <span>Dto. Bono Social</span>
            <span>-{{ formatearEuros(factura.descuentoBonoSocial) }}</span>
          </div>
        </div>

        <!-- Métricas -->
        <div class="result-metrics">
          <div class="metric-card">
            <span class="metric-card__value">{{ formatearEuros(precioMedioKwh) }}</span>
            <span class="metric-card__label">€/kWh medio</span>
          </div>
          <div class="metric-card">
            <span class="metric-card__value">{{ formatearEuros(costeDiario) }}</span>
            <span class="metric-card__label">Coste/día</span>
          </div>
          <div class="metric-card">
            <span class="metric-card__value">{{ formatearEuros(estimacionAnual) }}</span>
            <span class="metric-card__label">Est. anual</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Info desplegable -->
    <section class="info-section">
      <button class="info-section__header" @click="toggleSeccion('info')">
        <HelpCircle :size="20" />
        <span>¿Cómo se calcula tu factura?</span>
        <ChevronDown :class="['info-section__chevron', { 'is-open': seccionesExpandidas.info }]" :size="18" />
      </button>
      <div :class="['info-section__content', { 'is-open': seccionesExpandidas.info }]">
        <div class="info-cards">
          <div class="info-card">
            <h4>Término de Potencia</h4>
            <p>Parte fija. Pagas por tener disponible una potencia máxima, aunque no la uses.</p>
          </div>
          <div class="info-card">
            <h4>Término de Energía</h4>
            <p>Parte variable. Pagas por los kWh consumidos, con diferentes precios por horario.</p>
          </div>
          <div class="info-card">
            <h4>Peajes y Cargos</h4>
            <p>Peajes (CNMC): mantener redes. Cargos (Gobierno): renovables y bono social.</p>
          </div>
          <div class="info-card">
            <h4>PVPC vs Libre</h4>
            <p>PVPC: precio variable cada hora. Libre: precio fijo pactado con tu comercializadora.</p>
          </div>
        </div>
        <div class="info-horarios">
          <h4>Horarios (Península, L-V laborables)</h4>
          <div class="horarios-list">
            <div class="horario-item horario-item--punta">
              <strong>🔴 Punta</strong>
              <span>10:00-14:00 y 18:00-22:00</span>
            </div>
            <div class="horario-item horario-item--llano">
              <strong>🟡 Llano</strong>
              <span>08:00-10:00, 14:00-18:00, 22:00-00:00</span>
            </div>
            <div class="horario-item horario-item--valle">
              <strong>🟢 Valle</strong>
              <span>00:00-08:00 + fines de semana y festivos</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="simulador__footer">
      <p>Valores regulados 2025 · CNMC RAP/DE/009/24 · Orden TED/1487/2024 · Precios PVPC de Red Eléctrica en tiempo real</p>
    </footer>
  </div>
</template>

<style scoped>
/* ============================================
   VARIABLES - Usando el design system existente
   ============================================ */
.simulador {
  --sim-punta: var(--red-500, #ef4444);
  --sim-punta-bg: var(--red-100, #fee2e2);
  --sim-punta-border: var(--red-300, #fca5a5);
  
  --sim-llano: var(--orange-500, #f97316);
  --sim-llano-bg: var(--orange-100, #ffedd5);
  --sim-llano-border: var(--orange-300, #fdba74);
  
  --sim-valle: var(--accent-500, hsl(153, 84%, 38%));
  --sim-valle-bg: hsl(153, 60%, 92%);
  --sim-valle-border: hsl(153, 60%, 70%);
  
  --sim-impuestos: var(--primary-400, hsl(222, 36%, 46%));
  --sim-otros: var(--neutral-500, #7d7d7d);
  
  color: var(--neutral-50);
}

/* ============================================
   PRECIO EN TIEMPO REAL
   ============================================ */
.precio-live {
  background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%);
  border-radius: var(--rounded-lg);
  padding: var(--space-s) var(--space-m);
  margin-bottom: var(--space-m);
}

.precio-live__header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-xs);
}

.precio-live__icon {
  opacity: 0.8;
}

.precio-live__icon.is-loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.precio-live__actual {
  font-size: var(--size-0);
}

.precio-live__actual strong {
  color: var(--neutral-50);
}

.precio-live__periodos {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.precio-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3xs);
  padding: var(--space-3xs) var(--space-xs);
  border-radius: var(--rounded-full);
  font-size: var(--size--1);
  background: rgba(255,255,255,0.15);
}

.precio-badge__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.precio-badge--punta .precio-badge__dot { background: var(--sim-punta); }
.precio-badge--llano .precio-badge__dot { background: var(--sim-llano); }
.precio-badge--valle .precio-badge__dot { background: var(--sim-valle); }

/* ============================================
   GRID PRINCIPAL
   ============================================ */
.simulador__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-m);
}

@media (max-width: 900px) {
  .simulador__grid { grid-template-columns: 1fr; }
}

/* ============================================
   FORMULARIO - Cards
   ============================================ */
.simulador__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  min-width: 0;
}

.form-card {
  background: var(--primary-800);
  border: 1px solid var(--primary-700);
  border-radius: var(--rounded-lg);
  padding: var(--space-m);
}

.form-card--highlight {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(251, 146, 60, 0.05) 100%);
  border-color: var(--orange-600);
}

.form-card__title {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin: 0 0 var(--space-s);
  font-size: var(--size-0);
  font-weight: var(--semi-bold);
  color: var(--neutral-50);
}

.form-card__title svg {
  color: var(--primary-200);
}

/* Tabs mercado */
.mercado-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xs);
}

.mercado-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-s);
  background: var(--primary-900);
  border: 2px solid var(--primary-700);
  border-radius: var(--rounded-md);
  cursor: pointer;
  transition: all 0.2s;
  color: var(--neutral-100);
}

.mercado-tab:hover {
  border-color: var(--primary-400);
}

.mercado-tab.is-active {
  background: var(--primary-700);
  border-color: var(--primary-300);
  color: var(--neutral-50);
}

.mercado-tab__title {
  font-weight: var(--bold);
  font-size: var(--size-0);
}

.mercado-tab__desc {
  font-size: var(--size--2);
  color: var(--neutral-300);
}

/* Form elements */
.form-grid {
  display: grid;
  gap: var(--space-s);
}

.form-grid--2 { grid-template-columns: 1fr 1fr; }
.form-grid--3 { grid-template-columns: 1fr 1fr 1fr; }

@media (max-width: 500px) {
  .form-grid--3 { grid-template-columns: 1fr; }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xs);
}

.form-label {
  font-size: var(--size--1);
  color: var(--neutral-200);
  font-weight: var(--semi-bold);
}

.form-input,
.form-select {
  padding: var(--space-xs) var(--space-s);
  background: var(--primary-900);
  border: 1px solid var(--primary-600);
  border-radius: var(--rounded-md);
  color: var(--neutral-50);
  font-size: var(--size-0);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--primary-300);
  box-shadow: 0 0 0 3px rgba(128, 170, 230, 0.2);
}

.form-input--short {
  max-width: 120px;
}

.form-hint {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3xs);
  margin-top: var(--space-xs);
  font-size: var(--size--2);
  color: var(--neutral-300);
}

/* Consumo periodos */
.consumo-periodos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xs);
}

@media (max-width: 600px) {
  .consumo-periodos { grid-template-columns: 1fr; }
}

.consumo-periodo {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xs);
  padding: var(--space-s);
  border-radius: var(--rounded-md);
  background: var(--primary-900);
}

.consumo-periodo--punta { border-left: 3px solid var(--sim-punta); }
.consumo-periodo--llano { border-left: 3px solid var(--sim-llano); }
.consumo-periodo--valle { border-left: 3px solid var(--sim-valle); }

.consumo-periodo__header {
  display: flex;
  align-items: center;
  gap: var(--space-3xs);
}

.consumo-periodo__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.consumo-periodo--punta .consumo-periodo__dot { background: var(--sim-punta); }
.consumo-periodo--llano .consumo-periodo__dot { background: var(--sim-llano); }
.consumo-periodo--valle .consumo-periodo__dot { background: var(--sim-valle); }

.consumo-periodo__name {
  font-weight: var(--semi-bold);
  font-size: var(--size--1);
}

.consumo-periodo__hours {
  font-size: var(--size--2);
  color: var(--neutral-400);
}

.consumo-periodo .form-input {
  text-align: center;
  font-weight: var(--bold);
}

.consumo-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-s);
  padding-top: var(--space-s);
  border-top: 1px dashed var(--primary-600);
}

.consumo-total strong {
  color: var(--primary-200);
  font-size: var(--size-1);
}

/* Checkbox */
.form-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  cursor: pointer;
  margin-bottom: var(--space-s);
}

.form-checkbox input {
  width: 18px;
  height: 18px;
  accent-color: var(--primary-400);
}

/* ============================================
   RESULTADOS
   ============================================ */
.simulador__results {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

/* Total */
.result-total {
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
  border-radius: var(--rounded-lg);
  padding: var(--space-l);
  text-align: center;
}

.result-total__label {
  display: block;
  font-size: var(--size--1);
  opacity: 0.9;
  margin-bottom: var(--space-3xs);
}

.result-total__amount {
  display: block;
  font-size: var(--size-4);
  font-weight: var(--bold);
  line-height: 1.1;
}

.result-total__period {
  display: block;
  font-size: var(--size--1);
  opacity: 0.8;
  margin-top: var(--space-xs);
}

/* Barra desglose */
.result-bar {
  background: var(--primary-800);
  border: 1px solid var(--primary-700);
  border-radius: var(--rounded-lg);
  padding: var(--space-m);
}

.result-bar__chart {
  display: flex;
  height: 20px;
  border-radius: var(--rounded-full);
  overflow: hidden;
  margin-bottom: var(--space-s);
}

.result-bar__segment {
  transition: width 0.3s ease;
}

.result-bar__segment--potencia { background: var(--primary-400); }
.result-bar__segment--energia { background: var(--sim-llano); }
.result-bar__segment--otros { background: var(--sim-otros); }
.result-bar__segment--impuestos { background: var(--sim-impuestos); }

.result-bar__legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-s);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-3xs);
  font-size: var(--size--2);
  color: var(--neutral-300);
}

.legend-item::before {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.legend-item--potencia::before { background: var(--primary-400); }
.legend-item--energia::before { background: var(--sim-llano); }
.legend-item--otros::before { background: var(--sim-otros); }
.legend-item--impuestos::before { background: var(--sim-impuestos); }

/* Acordeón */
.result-accordion {
  background: var(--primary-800);
  border: 1px solid var(--primary-700);
  border-radius: var(--rounded-lg);
  overflow: hidden;

}

.accordion-item {
  border-bottom: 1px solid var(--primary-700);
}

.accordion-item:last-child {
  border-bottom: none;
}

.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: var(--space-s) var(--space-m);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--neutral-50);
  transition: background 0.2s;
}

.accordion-header:hover {
  background: var(--primary-700);
}

.accordion-header__left {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-weight: var(--semi-bold);
}

.accordion-icon--potencia { color: var(--primary-300); }
.accordion-icon--energia { color: var(--sim-llano); }
.accordion-icon--otros { color: var(--sim-otros); }

.accordion-header__right {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.accordion-amount {
  font-weight: var(--bold);
}

.accordion-chevron {
  transition: transform 0.2s;
}

.accordion-chevron.is-open {
  transform: rotate(180deg);
}

.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.accordion-content.is-open {
  max-height: 500px;
}

.accordion-content > * {
  padding: 0 var(--space-m);
}

.accordion-content > *:last-child {
  padding-bottom: var(--space-s);
}

.accordion-group {
  margin-bottom: var(--space-xs);
}

.accordion-group__title {
  display: block;
  font-size: var(--size--2);
  font-weight: var(--semi-bold);
  color: var(--neutral-400);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--space-xs) 0;
  border-bottom: 1px solid var(--primary-700);
  margin-bottom: var(--space-3xs);
}

.accordion-row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-3xs) 0;
  font-size: var(--size--1);
  color: var(--neutral-200);
}

.accordion-row--highlight-punta {
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, transparent 100%);
  padding: var(--space-3xs) var(--space-xs);
  margin: var(--space-3xs) 0;
  border-radius: var(--rounded-sm);
}

.accordion-row--highlight-llano {
  background: linear-gradient(90deg, rgba(249, 115, 22, 0.15) 0%, transparent 100%);
  padding: var(--space-3xs) var(--space-xs);
  margin: var(--space-3xs) 0;
  border-radius: var(--rounded-sm);
}

.accordion-row--highlight-valle {
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, transparent 100%);
  padding: var(--space-3xs) var(--space-xs);
  margin: var(--space-3xs) 0;
  border-radius: var(--rounded-sm);
}

/* Impuestos */
.result-taxes {
  background: var(--primary-900);
  border: 1px solid var(--primary-700);
  border-radius: var(--rounded-lg);
  padding: var(--space-s) var(--space-m);
}

.tax-row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-3xs) 0;
  font-size: var(--size--1);
  color: var(--neutral-200);
}

.tax-row--discount {
  color: var(--sim-valle);
  font-weight: var(--semi-bold);
}

/* Métricas */
.result-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xs);
}

@media (max-width: 500px) {
  .result-metrics { grid-template-columns: 1fr; }
}

.metric-card {
  background: var(--primary-800);
  border: 1px solid var(--primary-700);
  border-radius: var(--rounded-lg);
  padding: var(--space-s);
  text-align: center;
}

.metric-card__value {
  display: block;
  font-size: var(--size-1);
  font-weight: var(--bold);
  color: var(--primary-200);
}

.metric-card__label {
  display: block;
  font-size: var(--size--2);
  color: var(--neutral-400);
  margin-top: var(--space-3xs);
}

/* ============================================
   INFO SECTION
   ============================================ */
.info-section {
  background: var(--primary-800);
  border: 1px solid var(--primary-700);
  border-radius: var(--rounded-lg);
  margin-top: var(--space-m);
  overflow: hidden;
}

.info-section__header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  width: 100%;
  padding: var(--space-s) var(--space-m);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--neutral-50);
  font-weight: var(--semi-bold);
  transition: background 0.2s;
}

.info-section__header:hover {
  background: var(--primary-700);
}

.info-section__header svg:first-child {
  color: var(--primary-300);
}

.info-section__chevron {
  margin-left: auto;
  transition: transform 0.2s;
}

.info-section__chevron.is-open {
  transform: rotate(180deg);
}

.info-section__content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.info-section__content.is-open {
  max-height: 800px;
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-s);
  padding: 0 var(--space-m) var(--space-m);
}

@media (max-width: 600px) {
  .info-cards { grid-template-columns: 1fr; }
}

.info-card {
  background: var(--primary-900);
  border-radius: var(--rounded-md);
  padding: var(--space-s);
}

.info-card h4 {
  margin: 0 0 var(--space-3xs);
  font-size: var(--size--1);
  color: var(--primary-200);
}

.info-card p {
  margin: 0;
  font-size: var(--size--2);
  color: var(--neutral-300);
  line-height: 1.5;
}

.info-horarios {
  padding: 0 var(--space-m) var(--space-m);
}

.info-horarios h4 {
  margin: 0 0 var(--space-s);
  font-size: var(--size--1);
  color: var(--neutral-100);
}

.horarios-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xs);
}

@media (max-width: 600px) {
  .horarios-list { grid-template-columns: 1fr; }
}

.horario-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xs);
  padding: var(--space-s);
  border-radius: var(--rounded-md);
  font-size: var(--size--2);
}

.horario-item--punta {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.horario-item--llano {
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.3);
}

.horario-item--valle {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

/* ============================================
   FOOTER
   ============================================ */
.simulador__footer {
  margin-top: var(--space-m);
  padding: var(--space-s) var(--space-m);
  background: var(--primary-800);
  border-radius: var(--rounded-lg);
  border: 1px solid var(--primary-700);
}

.simulador__footer p {
  margin: 0;
  font-size: var(--size--2);
  color: var(--neutral-400);
  text-align: center;
}
</style>
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from '@nanostores/vue'
import { currentUser, initAuth, userProfile, isSubscribed, monthlyScansLeft, monthlyLimit } from '../../stores/authStore'
import { supabase } from '../../lib/supabaseClient'
import Bar from '../charts/BarChart.js'
import Doughnut from '../charts/DoughnutChart.js'
import {
  FileText, Zap, Flame, FileQuestion, Trash2,
  Calendar, Euro, TrendingDown, ChevronDown, ChevronUp,
  BarChart3, Lightbulb, RefreshCw, Building2, Hash,
  AlertTriangle, X, User, Network, Gauge, Receipt
} from 'lucide-vue-next'

const $user        = useStore(currentUser)
const $profile     = useStore(userProfile)
const $isSubscribed = useStore(isSubscribed)
const $scansLeft   = useStore(monthlyScansLeft)
const $monthlyLimit = useStore(monthlyLimit)

// ─── State ───────────────────────────────────────────
const invoices = ref([])
const loading = ref(true)
const refreshing = ref(false)
const expandedId = ref(null)
const activeTab = ref('all') // 'all' | 'luz' | 'gas' | 'otro'
const activeView = ref('list') // 'list' | 'charts'
const pendingDeleteId = ref(null) // confirmación de borrado inline
const portalLoading  = ref(false)
const portalError    = ref('')
const upgradeLoading = ref(false)
const upgradeSuccess = ref(false)
const upgradeConfirm = ref(false)

async function openCustomerPortal() {
  portalLoading.value = true
  portalError.value   = ''
  try {
    // Leer sesión fresca de Supabase para evitar token expirado
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      portalError.value = 'Sesión expirada. Recarga la página e inicia sesión.'
      portalLoading.value = false
      return
    }
    const res = await fetch('/api/customer-portal', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error desconocido')
    portalLoading.value = false
    window.location.href = data.url
  } catch (e) {
    portalError.value = e.message
    portalLoading.value = false
  }
}

async function upgradeToPro() {
  upgradeLoading.value = true
  portalError.value    = ''
  upgradeSuccess.value = false
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      portalError.value = 'Sesión expirada. Recarga la página.'
      upgradeLoading.value = false
      return
    }
    const res  = await fetch('/api/upgrade-plan', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error desconocido')
    upgradeSuccess.value = true
    upgradeConfirm.value = false
    // Recargar perfil para reflejar el nuevo plan
    await import('../../stores/authStore').then(m => m.refreshProfile())
  } catch (e) {
    portalError.value = e.message
    upgradeConfirm.value = false
  } finally {
    upgradeLoading.value = false
  }
}

// ─── Computed: filtered list ──────────────────────────
const filteredInvoices = computed(() =>
  activeTab.value === 'all'
    ? invoices.value
    : invoices.value.filter(inv => inv.invoice_type === activeTab.value)
)

// ─── Computed: KPI stats ──────────────────────────────
const stats = computed(() => {
  const all = invoices.value
  if (!all.length) return null

  const luzList  = all.filter(i => i.invoice_type === 'luz')
  const gasList  = all.filter(i => i.invoice_type === 'gas')
  const otroList = all.filter(i => i.invoice_type === 'otro')

  const sum = (arr) => arr.reduce((s, i) => s + (i.total_amount || 0), 0)
  const avg = (arr) => arr.length ? sum(arr) / arr.length : 0

  return {
    total: all.length,
    totalGasto: sum(all),
    totalKwh:   all.reduce((s, i) => s + (i.consumption_kwh || 0), 0),
    avgTotal:   avg(all),
    luzTotal:   sum(luzList),
    gasTotal:   sum(gasList),
    otroTotal:  sum(otroList),
    luzCount:   luzList.length,
    gasCount:   gasList.length,
    otroCount:  otroList.length,
  }
})

// ─── Chart: Doughnut (gastos por categoría) ──────────
const doughnutData = computed(() => {
  if (!stats.value) return null
  const { luzTotal, gasTotal, otroTotal } = stats.value
  const values = [luzTotal, gasTotal, otroTotal].filter(v => v > 0)
  const labels = ['Luz', 'Gas', 'Otros'].filter((_, i) => [luzTotal, gasTotal, otroTotal][i] > 0)
  if (!values.length) return null
  return {
    labels,
    datasets: [{
      data: values,
      backgroundColor: ['#fbbf24CC', '#f97316CC', '#8b5cf6CC'],
      borderColor:     ['#fbbf24',   '#f97316',   '#8b5cf6'],
      borderWidth: 2,
      hoverOffset: 6,
    }]
  }
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#e5e7eb',
        font: { family: 'Montserrat Variable, system-ui, sans-serif', size: 13 },
        padding: 16,
        usePointStyle: true,
      }
    },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.label}: ${fmt(ctx.raw)}`
      }
    }
  }
}

// ─── Chart: Bar (gastos mensuales) ────────────────────
const barData = computed(() => {
  const all = invoices.value
  if (!all.length) return null

  // Agrupar por mes (YYYY-MM)
  const months = {}
  all.forEach(inv => {
    const d = new Date(inv.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!months[key]) months[key] = { luz: 0, gas: 0, otro: 0 }
    const t = inv.invoice_type === 'luz' ? 'luz'
            : inv.invoice_type === 'gas' ? 'gas'
            : 'otro'
    months[key][t] += inv.total_amount || 0
  })

  const sorted = Object.keys(months).sort()
  if (sorted.length < 2) return null // solo 1 mes → no tiene sentido un bar chart

  const labels = sorted.map(k => {
    const [y, m] = k.split('-')
    return new Date(+y, +m - 1).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
  })

  return {
    labels,
    datasets: [
      {
        label: 'Luz',
        data: sorted.map(k => months[k].luz),
        backgroundColor: '#fbbf24AA',
        borderColor: '#fbbf24',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Gas',
        data: sorted.map(k => months[k].gas),
        backgroundColor: '#f97316AA',
        borderColor: '#f97316',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Otros',
        data: sorted.map(k => months[k].otro),
        backgroundColor: '#8b5cf6AA',
        borderColor: '#8b5cf6',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  }
})

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        color: '#e5e7eb',
        font: { family: 'Montserrat Variable, system-ui, sans-serif', size: 12 },
        usePointStyle: true,
        padding: 16,
      }
    },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}`
      }
    }
  },
  scales: {
    x: {
      stacked: false,
      ticks: { color: '#9ca3af', font: { family: 'Montserrat Variable, system-ui, sans-serif' } },
      grid:  { color: 'rgba(255,255,255,0.05)' }
    },
    y: {
      stacked: false,
      ticks: {
        color: '#9ca3af',
        font: { family: 'Montserrat Variable, system-ui, sans-serif' },
        callback: (v) => `${v}€`
      },
      grid: { color: 'rgba(255,255,255,0.07)' }
    }
  }
}

// ─── Helpers ──────────────────────────────────────────
function fmt(v) {
  if (v == null || v === 0) return '-'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v)
}
function fmtDate(d) {
  if (!d) return '-'
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d))
}
function typeIcon(t) {
  return t === 'luz' ? Zap : t === 'gas' ? Flame : FileQuestion
}
function typeColor(t) {
  return t === 'luz' ? '#fbbf24' : t === 'gas' ? '#f97316' : '#8b5cf6'
}

// ─── Signed URLs (bucket privado) ─────────────────────
const signedUrls = ref({})

async function resolveImageUrl(inv) {
  if (!inv.image_path || signedUrls.value[inv.id]) return
  const { data, error } = await supabase.storage
    .from('invoices')
    .createSignedUrl(inv.image_path, 3600) // 1h para visualización
  if (error) console.error('[resolveImageUrl] Supabase storage error:', error, 'path:', inv.image_path)
  if (data?.signedUrl) signedUrls.value = { ...signedUrls.value, [inv.id]: data.signedUrl }
}

// ─── Data fetching ────────────────────────────────────
async function fetchInvoices() {
  if (!$user.value) { loading.value = false; return }
  // Carga inicial: mostrar skeleton. Refresco: actualizar en segundo plano sin ocultar datos
  if (!invoices.value.length) loading.value = true
  else refreshing.value = true
  const { data, error } = await supabase
    .from('scanned_invoices')
    .select('*')
    .eq('user_id', $user.value.id)
    .order('created_at', { ascending: false })
  if (!error && data) invoices.value = data
  loading.value = false
  refreshing.value = false
}

function requestDelete(id) {
  // Colapsa otras filas abiertas y pide confirmación inline
  pendingDeleteId.value = id
  expandedId.value = id  // asegura que la fila esté expandida para ver la confirmación
}

async function confirmDelete(id) {
  const { error } = await supabase
    .from('scanned_invoices')
    .delete()
    .eq('id', id)
  if (!error) {
    invoices.value = invoices.value.filter(i => i.id !== id)
    if (expandedId.value === id) expandedId.value = null
  }
  pendingDeleteId.value = null
}

function cancelDelete() {
  pendingDeleteId.value = null
}

onMounted(async () => {
  await initAuth()
  await fetchInvoices()

  // Escuchar evento del scanner para refrescar tras nuevo escaneo
  document.addEventListener('refresh-dashboard', fetchInvoices)

  // Resetear estados de carga si el navegador restaura la página desde bfcache
  // (ocurre cuando el usuario vuelve con el botón "atrás" desde el portal de Stripe)
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      portalLoading.value  = false
      upgradeLoading.value = false
      upgradeConfirm.value = false
    }
  })
})

// Si el usuario se autentica después de montar (timing race), recargar facturas
watch($user, (user) => {
  if (user && !invoices.value.length) fetchInvoices()
})

defineExpose({ fetchInvoices })
</script>

<template>
  <div class="dashboard">

    <!-- Not logged in -->
    <div v-if="!$user" class="empty-state">
      <FileText :size="52" />
      <p>Inicia sesión para ver tu dashboard de facturas</p>
    </div>

    <template v-else>
      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner-lg"></div>
        <p>Cargando tu historial...</p>
      </div>

      <template v-else>
        <!-- ── Subscription bar ──────────────────────── -->
        <div v-if="$isSubscribed" class="sub-bar">
          <div class="sub-bar__info">
            <span class="sub-bar__badge" :class="$profile?.subscription_tier === 'pro' ? 'sub-bar__badge--pro' : ''">
              Plan {{ $profile?.subscription_tier === 'pro' ? 'Pro' : 'Básico' }}
            </span>
            <span class="sub-bar__scans">
              {{ $scansLeft }} / {{ $monthlyLimit }} escaneos este mes
            </span>
          </div>
          <div class="sub-bar__actions">
            <p v-if="portalError" class="sub-bar__error">{{ portalError }}</p>
            <span v-if="upgradeSuccess" class="sub-bar__success">
              ¡Actualizado a Pro! 🎉
            </span>
            <!-- Upgrade a Pro (solo visible en plan Básico) -->
            <template v-if="$profile?.subscription_tier !== 'pro'">
              <div v-if="upgradeConfirm" class="upgrade-confirm">
                <span class="upgrade-confirm__msg">Se cargará la diferencia proporcional ahora. ¿Confirmar subida a Pro (9,99€/mes)?</span>
                <div class="upgrade-confirm__btns">
                  <button class="btn-cancel-del" @click="upgradeConfirm = false">Cancelar</button>
                  <button class="btn-upgrade btn-upgrade--confirm" :disabled="upgradeLoading" @click="upgradeToPro">
                    <span v-if="upgradeLoading" class="spinner-xs"></span>
                    {{ upgradeLoading ? 'Actualizando...' : 'Confirmar' }}
                  </button>
                </div>
              </div>
              <button v-else class="btn-upgrade" @click="upgradeConfirm = true">
                ⬆ Subir a Pro — 9,99€/mes
              </button>
            </template>
            <button
              class="btn-portal"
              :disabled="portalLoading"
              @click="openCustomerPortal"
            >
              <span v-if="portalLoading" class="spinner-xs"></span>
              {{ portalLoading ? 'Abriendo...' : 'Gestionar suscripción' }}
            </button>
          </div>
        </div>

        <!-- ── KPI Cards ────────────────────────────── -->
        <div v-if="stats" class="kpi-row">
          <div class="kpi-card">
            <div class="kpi-icon kpi-icon--blue"><FileText :size="18" /></div>
            <div>
              <span class="kpi-label">Facturas</span>
              <span class="kpi-value">{{ stats.total }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon kpi-icon--green"><Euro :size="18" /></div>
            <div>
              <span class="kpi-label">Gasto total</span>
              <span class="kpi-value">{{ fmt(stats.totalGasto) }}</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon kpi-icon--yellow"><BarChart3 :size="18" /></div>
            <div>
              <span class="kpi-label">Media/factura</span>
              <span class="kpi-value">{{ fmt(stats.avgTotal) }}</span>
            </div>
          </div>
          <div v-if="stats.totalKwh > 0" class="kpi-card">
            <div class="kpi-icon kpi-icon--orange"><Zap :size="18" /></div>
            <div>
              <span class="kpi-label">kWh totales</span>
              <span class="kpi-value">{{ stats.totalKwh.toFixed(0) }}</span>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-if="!invoices.length" class="empty-state">
          <FileText :size="52" />
          <p>Aún no has escaneado ninguna factura</p>
          <p class="empty-sub">Usa el escáner de arriba para analizar tu primera factura</p>
        </div>

        <template v-else>
          <!-- ── View toggle ────────────────────────── -->
          <div class="view-header">
            <div class="view-tabs">
              <button
                :class="['view-tab', { 'view-tab--active': activeView === 'list' }]"
                @click="activeView = 'list'"
              >
                <FileText :size="15" /> Historial
              </button>
              <button
                :class="['view-tab', { 'view-tab--active': activeView === 'charts' }]"
                @click="activeView = 'charts'"
              >
                <BarChart3 :size="15" /> Gráficos
              </button>
            </div>
            <button class="btn-refresh" @click="fetchInvoices" :disabled="refreshing" :aria-label="refreshing ? 'Actualizando...' : 'Actualizar'" title="Actualizar">
              <RefreshCw :size="15" :class="{ 'spin': refreshing }" />
            </button>
          </div>

          <!-- ── CHARTS VIEW ──────────────────────── -->
          <div v-if="activeView === 'charts'" class="charts-view">
            <div class="charts-grid">
              <!-- Doughnut -->
              <div class="chart-card">
                <h4 class="chart-card__title">Gasto por categoría</h4>
                <div v-if="doughnutData" class="chart-wrap chart-wrap--sm">
                  <Doughnut :data="doughnutData" :options="doughnutOptions" />
                </div>
                <div v-else class="chart-empty">Sin datos suficientes</div>

                <!-- Leyenda de totales -->
                <div class="cat-legend">
                  <div v-if="stats && stats.luzTotal > 0" class="cat-item">
                    <span class="cat-dot" style="background:#fbbf24"></span>
                    <span>Luz</span>
                    <span class="cat-amount">{{ fmt(stats.luzTotal) }}</span>
                  </div>
                  <div v-if="stats && stats.gasTotal > 0" class="cat-item">
                    <span class="cat-dot" style="background:#f97316"></span>
                    <span>Gas</span>
                    <span class="cat-amount">{{ fmt(stats.gasTotal) }}</span>
                  </div>
                  <div v-if="stats && stats.otroTotal > 0" class="cat-item">
                    <span class="cat-dot" style="background:#8b5cf6"></span>
                    <span>Otros</span>
                    <span class="cat-amount">{{ fmt(stats.otroTotal) }}</span>
                  </div>
                </div>
              </div>

              <!-- Bar mensual -->
              <div class="chart-card chart-card--wide">
                <h4 class="chart-card__title">Evolución mensual de gastos</h4>
                <div v-if="barData" class="chart-wrap">
                  <Bar :data="barData" :options="barOptions" />
                </div>
                <div v-else class="chart-empty">
                  Necesitas al menos 2 meses de facturas para ver la evolución
                </div>
              </div>
            </div>
          </div>

          <!-- ── LIST VIEW ────────────────────────── -->
          <div v-else class="list-view">
            <!-- Filter tabs -->
            <div class="filter-tabs">
              <button
                v-for="tab in [
                  { value: 'all', label: 'Todas', count: invoices.length },
                  { value: 'luz', label: 'Luz', count: invoices.filter(i => i.invoice_type === 'luz').length, color: '#fbbf24' },
                  { value: 'gas', label: 'Gas', count: invoices.filter(i => i.invoice_type === 'gas').length, color: '#f97316' },
                  { value: 'otro', label: 'Otros', count: invoices.filter(i => i.invoice_type === 'otro').length, color: '#8b5cf6' }
                ]"
                :key="tab.value"
                :class="['filter-tab', { 'filter-tab--active': activeTab === tab.value }]"
                @click="activeTab = tab.value"
              >
                <span v-if="tab.color" class="tab-dot" :style="{ background: tab.color }"></span>
                {{ tab.label }}
                <span class="tab-count">{{ tab.count }}</span>
              </button>
            </div>

            <!-- Invoice list -->
            <div class="invoice-list">
              <div v-if="!filteredInvoices.length" class="empty-filter">
                Sin facturas en esta categoría
              </div>

              <div
                v-for="inv in filteredInvoices"
                :key="inv.id"
                class="invoice-row mt-space-m"
                :class="{ 'invoice-row--open': expandedId === inv.id }"
              >
                <!-- Row header -->
                <div class="invoice-row__head" @click="expandedId = expandedId === inv.id ? null : inv.id; if (expandedId === inv.id) resolveImageUrl(inv)">
                  <div class="row-left">
                    <span class="row-type-icon" :style="{ color: typeColor(inv.invoice_type) }">
                      <component :is="typeIcon(inv.invoice_type)" :size="17" />
                    </span>
                    <div class="row-info">
                      <span class="row-provider">{{ inv.provider || 'Factura escaneada' }}</span>
                      <span class="row-date">{{ fmtDate(inv.created_at) }}</span>
                    </div>
                  </div>
                  <div class="row-right">
                    <span class="row-amount">{{ fmt(inv.total_amount) }}</span>
                    <span v-if="inv.consumption_kwh" class="row-kwh">{{ inv.consumption_kwh }} kWh</span>
                    <component :is="expandedId === inv.id ? ChevronUp : ChevronDown" :size="16" class="row-chevron" />
                  </div>
                </div>

                <!-- Row detail -->
                <div v-if="expandedId === inv.id" class="invoice-row__detail">
                  <div class="detail-body">

                    <!-- ── Imagen (columna lateral) ── -->
                    <div v-if="inv.image_path" class="detail-img-col">
                      <template v-if="signedUrls[inv.id]">
                        <a :href="signedUrls[inv.id]" target="_blank" rel="noopener noreferrer" aria-label="Ver factura en tamaño completo">
                          <img :src="signedUrls[inv.id]" alt="Imagen de la factura" class="detail-img" loading="lazy" />
                        </a>
                        <span class="detail-img-label">Toca para ampliar</span>
                      </template>
                      <div v-else class="detail-img-loading" aria-label="Cargando imagen">
                        <div class="detail-img-spinner"></div>
                      </div>
                    </div>

                    <!-- ── Datos estructurados ── -->
                    <div class="detail-main">

                      <!-- Mini KPIs -->
                      <div class="d-kpis">
                        <div class="d-kpi">
                          <Euro :size="15" class="d-kpi__icon d-kpi__icon--blue" aria-hidden="true" />
                          <div>
                            <span class="d-kpi__label">Total</span>
                            <span class="d-kpi__val">{{ fmt(inv.total_amount) }}</span>
                          </div>
                        </div>
                        <div v-if="inv.consumption_kwh" class="d-kpi">
                          <Zap :size="15" class="d-kpi__icon d-kpi__icon--yellow" aria-hidden="true" />
                          <div>
                            <span class="d-kpi__label">Consumo</span>
                            <span class="d-kpi__val">{{ inv.consumption_kwh }} kWh</span>
                          </div>
                        </div>
                        <div v-if="inv.billing_period_start" class="d-kpi">
                          <Calendar :size="15" class="d-kpi__icon d-kpi__icon--purple" aria-hidden="true" />
                          <div>
                            <span class="d-kpi__label">Periodo</span>
                            <span class="d-kpi__val d-kpi__val--sm">{{ fmtDate(inv.billing_period_start) }} – {{ fmtDate(inv.billing_period_end) }}</span>
                          </div>
                        </div>
                        <div v-if="inv.extracted_data?.distributor" class="d-kpi">
                          <Network :size="15" class="d-kpi__icon d-kpi__icon--teal" aria-hidden="true" />
                          <div>
                            <span class="d-kpi__label">Distribuidora</span>
                            <span class="d-kpi__val d-kpi__val--sm">{{ inv.extracted_data.distributor }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- CUPS + Titular -->
                      <div v-if="inv.extracted_data?.cups || inv.extracted_data?.holder_name" class="d-id-strip">
                        <div v-if="inv.extracted_data?.cups" class="d-id-item">
                          <Hash :size="12" aria-hidden="true" />
                          <span class="d-id-label">CUPS</span>
                          <code class="d-id-val">{{ inv.extracted_data.cups }}</code>
                        </div>
                        <div v-if="inv.extracted_data?.holder_name" class="d-id-item">
                          <User :size="12" aria-hidden="true" />
                          <span class="d-id-label">Titular</span>
                          <span class="d-id-val">{{ inv.extracted_data.holder_name }}</span>
                        </div>
                        <div v-if="inv.extracted_data?.access_tariff || inv.extracted_data?.tariff_type" class="d-id-item">
                          <Receipt :size="12" aria-hidden="true" />
                          <span class="d-id-label">Tarifa</span>
                          <span class="d-id-val">{{ inv.extracted_data.access_tariff || inv.extracted_data.tariff_type }}</span>
                        </div>
                      </div>

                      <!-- Desglose -->
                      <div class="d-breakdown">
                        <dl class="d-list">
                          <!-- Costes -->
                          <template v-if="inv.power_term != null">
                            <dt>{{ inv.invoice_type === 'gas' ? 'Término fijo' : 'Término de potencia' }}</dt>
                            <dd>{{ fmt(inv.power_term) }}</dd>
                          </template>
                          <template v-if="inv.energy_term != null">
                            <dt>{{ inv.invoice_type === 'gas' ? 'Término variable' : 'Término de energía' }}</dt>
                            <dd>{{ fmt(inv.energy_term) }}</dd>
                          </template>
                          <template v-if="inv.extracted_data?.meter_rental != null">
                            <dt>Alquiler contador</dt>
                            <dd>{{ fmt(inv.extracted_data.meter_rental) }}</dd>
                          </template>
                          <template v-if="inv.extracted_data?.electricity_tax != null">
                            <dt>Imp. electricidad{{ inv.extracted_data.electricity_tax_rate ? ` (${inv.extracted_data.electricity_tax_rate}%)` : '' }}</dt>
                            <dd>{{ fmt(inv.extracted_data.electricity_tax) }}</dd>
                          </template>
                          <template v-if="inv.extracted_data?.hydrocarbon_tax != null">
                            <dt>Imp. hidrocarburos</dt>
                            <dd>{{ fmt(inv.extracted_data.hydrocarbon_tax) }}</dd>
                          </template>
                          <template v-if="inv.taxes != null">
                            <dt>IVA{{ inv.extracted_data?.iva_rate ? ` (${inv.extracted_data.iva_rate}%)` : '' }}</dt>
                            <dd>{{ fmt(inv.taxes) }}</dd>
                          </template>
                          <template v-if="inv.total_amount != null">
                            <dt class="d-total-dt">TOTAL</dt>
                            <dd class="d-total-dd">{{ fmt(inv.total_amount) }}</dd>
                          </template>

                          <!-- Consumo -->
                          <template v-if="inv.consumption_kwh || inv.extracted_data?.consumption_m3 || inv.price_per_kwh">
                            <dt class="d-section-dt">Consumo</dt><dd class="d-section-dd"></dd>
                          </template>
                          <template v-if="inv.consumption_kwh">
                            <dt>Consumo total</dt><dd>{{ inv.consumption_kwh }} kWh</dd>
                          </template>
                          <template v-if="inv.extracted_data?.consumption_m3">
                            <dt>Consumo (m³)</dt><dd>{{ inv.extracted_data.consumption_m3 }} m³</dd>
                          </template>
                          <template v-if="inv.price_per_kwh">
                            <dt>Precio medio</dt><dd>{{ inv.price_per_kwh?.toFixed(4) }} €/kWh</dd>
                          </template>
                          <template v-if="inv.extracted_data?.consumption_p1">
                            <dt>Punta (P1)</dt>
                            <dd>{{ inv.extracted_data.consumption_p1 }} kWh{{ inv.extracted_data.price_p1 ? ` · ${inv.extracted_data.price_p1?.toFixed(4)} €/kWh` : '' }}</dd>
                          </template>
                          <template v-if="inv.extracted_data?.consumption_p2">
                            <dt>Llano (P2)</dt>
                            <dd>{{ inv.extracted_data.consumption_p2 }} kWh{{ inv.extracted_data.price_p2 ? ` · ${inv.extracted_data.price_p2?.toFixed(4)} €/kWh` : '' }}</dd>
                          </template>
                          <template v-if="inv.extracted_data?.consumption_p3">
                            <dt>Valle (P3)</dt>
                            <dd>{{ inv.extracted_data.consumption_p3 }} kWh{{ inv.extracted_data.price_p3 ? ` · ${inv.extracted_data.price_p3?.toFixed(4)} €/kWh` : '' }}</dd>
                          </template>
                          <template v-if="inv.extracted_data?.reading_type">
                            <dt>Tipo lectura</dt><dd>{{ inv.extracted_data.reading_type }}</dd>
                          </template>
                        </dl>
                      </div>

                      <!-- Tips -->
                      <details v-if="inv.extracted_data?.tips?.length" class="d-tips-details">
                        <summary>
                          <Lightbulb :size="13" aria-hidden="true" />
                          Consejos de ahorro ({{ inv.extracted_data.tips.length }})
                        </summary>
                        <ul>
                          <li v-for="(tip, i) in inv.extracted_data.tips" :key="i">
                            <TrendingDown :size="12" aria-hidden="true" /> {{ tip }}
                          </li>
                        </ul>
                      </details>

                      <!-- Acciones -->
                      <div class="detail-actions">
                        <div
                          v-if="pendingDeleteId === inv.id"
                          class="delete-confirm"
                          role="alertdialog"
                          aria-live="assertive"
                          aria-label="Confirmar eliminación de factura"
                        >
                          <AlertTriangle :size="15" class="delete-confirm__icon" aria-hidden="true" />
                          <span class="delete-confirm__msg">¿Eliminar esta factura? No se puede deshacer.</span>
                          <div class="delete-confirm__btns">
                            <button class="btn-cancel-del" @click.stop="cancelDelete" aria-label="Cancelar eliminación">
                              <X :size="13" aria-hidden="true" /> Cancelar
                            </button>
                            <button class="btn-confirm-del" @click.stop="confirmDelete(inv.id)" aria-label="Confirmar eliminación">
                              <Trash2 :size="13" aria-hidden="true" /> Sí, eliminar
                            </button>
                          </div>
                        </div>
                        <button
                          v-else
                          class="btn-del"
                          @click.stop="requestDelete(inv.id)"
                          aria-label="Eliminar factura del historial"
                        >
                          <Trash2 :size="13" /> Eliminar
                        </button>
                      </div>

                    </div><!-- /detail-main -->
                  </div><!-- /detail-body -->
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>
    </template>
  </div>
</template>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 1.25rem; }

/* ── KPIs ───────────────────────────────────────── */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
}
.kpi-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--primary-800);
  border: 1px solid var(--primary-700);
  border-radius: 12px;
}
.kpi-icon {
  width: 36px; height: 36px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.kpi-icon--blue   { background: rgba(59,130,246,.18); color: #60a5fa; }
.kpi-icon--green  { background: rgba(34,197,94,.18);  color: #4ade80; }
.kpi-icon--yellow { background: rgba(251,191,36,.18); color: #fbbf24; }
.kpi-icon--orange { background: rgba(249,115,22,.18); color: #fb923c; }
.kpi-label {
  display: block; font-size: 0.7rem;
  text-transform: uppercase; letter-spacing: .05em;
  color: var(--primary-400);
}
.kpi-value {
  display: block; font-size: 1.2rem; font-weight: 700;
  color: var(--neutral-50);
}

/* ── View toggle ─────────────────────────────────── */
.view-header {
  display: flex; justify-content: space-between; align-items: center;
}
.view-tabs { display: flex; gap: 0.35rem; }
.view-tab {
  display: flex; align-items: center; gap: 0.35rem;
  padding: 0.45rem 0.9rem;
  background: var(--primary-800);
  border: 1px solid var(--primary-700);
  border-radius: 8px;
  color: var(--primary-300);
  font-size: 0.85rem; font-weight: 500; cursor: pointer;
  transition: all .15s; font-family: inherit;
}
.view-tab:hover { border-color: var(--primary-500); color: var(--neutral-100); }
.view-tab--active {
  background: var(--primary-700);
  border-color: var(--primary-500);
  color: var(--neutral-50);
}
.btn-refresh {
  background: none; border: 1px solid var(--primary-700);
  border-radius: 8px; color: var(--primary-400);
  padding: 0.4rem; cursor: pointer; transition: all .15s;
  display: flex; align-items: center;
}
.btn-refresh:hover { border-color: var(--primary-500); color: var(--primary-200); }

/* ── Charts ─────────────────────────────────────── */
.charts-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1rem;
}
.chart-card {
  background: var(--primary-800);
  border: 1px solid var(--primary-700);
  border-radius: 14px;
  padding: 1.25rem;
}
.chart-card--wide { min-width: 0; }
.chart-card__title {
  font-size: 0.95rem; font-weight: 600;
  color: var(--neutral-50); margin: 0 0 1rem;
}
.chart-wrap { height: 220px; }
.chart-wrap--sm { height: 180px; }
.chart-empty {
  height: 150px; display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; color: var(--primary-500); text-align: center;
  padding: 1rem;
}
.cat-legend {
  display: flex; flex-direction: column; gap: 0.4rem;
  margin-top: 0.75rem; padding-top: 0.75rem;
  border-top: 1px solid var(--primary-700);
}
.cat-item {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.85rem; color: var(--primary-200);
}
.cat-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}
.cat-amount { margin-left: auto; font-weight: 600; color: var(--neutral-50); }

/* ── Filter tabs ─────────────────────────────────── */
.filter-tabs { display: flex; gap: 0.35rem; flex-wrap: wrap; }
.filter-tab {
  display: flex; align-items: center; gap: 0.35rem;
  padding: 0.35rem 0.8rem;
  background: var(--primary-800);
  border: 1px solid var(--primary-700);
  border-radius: 6px;
  color: var(--primary-300); font-size: 0.82rem; cursor: pointer;
  transition: all .15s; font-family: inherit;
}
.filter-tab:hover { border-color: var(--primary-500); }
.filter-tab--active { background: var(--primary-700); border-color: var(--primary-500); color: var(--neutral-50); }
.tab-dot { width: 8px; height: 8px; border-radius: 50%; }
.tab-count {
  background: var(--primary-600); padding: 0 0.35rem;
  border-radius: 8px; font-size: 0.7rem;
}

/* ── Invoice list ────────────────────────────────── */
.invoice-list { display: flex; flex-direction: column; gap: 0.4rem; }
.empty-filter {
  padding: 1.5rem; text-align: center;
  color: var(--primary-500); font-size: 0.9rem;
}
.invoice-row {
  background: var(--primary-800);
  border: 1px solid var(--primary-700);
  border-radius: 10px; overflow: hidden; transition: border-color .15s;
}
.invoice-row:hover { border-color: var(--primary-600); }
.invoice-row--open { border-color: var(--primary-500); }

.invoice-row__head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.85rem 1rem; cursor: pointer; gap: 1rem;
}
.row-left { display: flex; align-items: center; gap: 0.65rem; min-width: 0; }
.row-type-icon { flex-shrink: 0; }
.row-info { min-width: 0; }
.row-provider {
  display: block; font-size: 0.9rem; font-weight: 500;
  color: var(--neutral-50); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;
}
.row-date { display: block; font-size: 0.75rem; color: var(--primary-400); }
.row-right { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }
.row-amount { font-size: 1rem; font-weight: 700; color: var(--neutral-50); }
.row-kwh { font-size: 0.78rem; color: var(--primary-400); }
.row-chevron { color: var(--primary-500); }

.invoice-row__detail { padding: 0 1rem 1rem; border-top: 1px solid var(--primary-700); }

/* ── Detail body (imagen + datos lado a lado) ─── */
.detail-body {
  display: flex; gap: 1rem; padding-top: 1rem; align-items: flex-start;
}

/* Columna imagen */
.detail-img-col {
  display: flex; flex-direction: column; align-items: flex-start;
  gap: 0.3rem; flex-shrink: 0;
}
.detail-img-col a { display: inline-block; border-radius: 8px; overflow: hidden; transition: opacity .15s; }
.detail-img-col a:hover { opacity: .88; }
.detail-img-col a:focus-visible { outline: 2px solid var(--primary-400); outline-offset: 3px; border-radius: 8px; }
.detail-img {
  display: block; width: 130px; height: 170px;
  object-fit: cover; border-radius: 8px;
  border: 1px solid var(--primary-700);
}
.detail-img-label { font-size: 0.68rem; color: var(--primary-500); }
.detail-img-loading {
  width: 80px; height: 60px;
  display: flex; align-items: center; justify-content: center;
  background: var(--primary-900); border-radius: 8px;
  border: 1px solid var(--primary-700);
}
.detail-img-spinner {
  width: 18px; height: 18px;
  border: 2px solid var(--primary-700); border-top-color: var(--primary-400);
  border-radius: 50%; animation: spin .7s linear infinite;
}

/* Columna datos */
.detail-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.75rem; }

/* Mini KPIs */
.d-kpis {
  display: flex; flex-wrap: wrap; gap: 0.5rem;
}
.d-kpi {
  display: flex; align-items: center; gap: 0.5rem;
  background: var(--primary-900); border: 1px solid var(--primary-700);
  border-radius: 10px; padding: 0.5rem 0.75rem; min-width: 110px;
}
.d-kpi__icon {
  width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.d-kpi__icon--blue   { background: rgba(59,130,246,.18); color: #60a5fa; }
.d-kpi__icon--yellow { background: rgba(251,191,36,.18); color: #fbbf24; }
.d-kpi__icon--purple { background: rgba(139,92,246,.18); color: #a78bfa; }
.d-kpi__icon--teal   { background: rgba(20,184,166,.18); color: #2dd4bf; }
.d-kpi__label { display: block; font-size: 0.65rem; text-transform: uppercase; letter-spacing: .05em; color: var(--primary-400); }
.d-kpi__val { display: block; font-size: 0.95rem; font-weight: 700; color: var(--neutral-50); }
.d-kpi__val--sm { font-size: 0.78rem; font-weight: 500; }

/* CUPS + Titular strip */
.d-id-strip {
  display: flex; flex-wrap: wrap; gap: 0.4rem;
}
.d-id-item {
  display: inline-flex; align-items: center; gap: 0.3rem;
  background: var(--primary-800); border: 1px solid var(--primary-700);
  border-radius: 7px; padding: 0.25rem 0.6rem;
  font-size: 0.75rem; color: var(--primary-200);
}
.d-id-item svg { color: var(--primary-500); flex-shrink: 0; }
.d-id-label { color: var(--primary-500); }
.d-id-val { color: var(--neutral-100); font-weight: 500; }
code.d-id-val { font-family: 'Courier New', monospace; font-size: 0.72rem; color: #60a5fa; letter-spacing: .03em; }

/* Desglose */
.d-breakdown {
  background: var(--primary-900); border: 1px solid var(--primary-700);
  border-radius: 10px; padding: 0.75rem 1rem;
}
.d-list {
  display: grid; grid-template-columns: 1fr auto;
  gap: 0; margin: 0; padding: 0;
}
.d-list dt, .d-list dd {
  padding: 0.35rem 0; border-bottom: 1px solid rgba(255,255,255,.04);
  font-size: 0.8rem; margin: 0;
}
.d-list dt { color: var(--primary-300); }
.d-list dd { color: var(--neutral-100); font-weight: 500; text-align: right; }
.d-list .d-total-dt, .d-list .d-total-dd {
  border-bottom: none; border-top: 1px solid var(--primary-700);
  padding-top: 0.5rem; font-weight: 700; font-size: 0.9rem; color: var(--neutral-50);
}
.d-list .d-total-dd { color: #60a5fa; }
.d-list .d-section-dt {
  grid-column: 1 / -1; border-bottom: none;
  padding: 0.6rem 0 0.1rem;
  font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .07em; color: var(--primary-500);
}
.d-list .d-section-dd { display: none; }

/* Tips colapsables */
.d-tips-details {
  background: rgba(34,197,94,.06); border: 1px solid rgba(34,197,94,.15);
  border-radius: 9px; overflow: hidden;
}
.d-tips-details summary {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.55rem 0.85rem; cursor: pointer; list-style: none;
  font-size: 0.8rem; font-weight: 600; color: #86efac;
  min-height: 40px; transition: background .15s;
}
.d-tips-details summary:hover { background: rgba(34,197,94,.08); }
.d-tips-details summary::-webkit-details-marker { display: none; }
.d-tips-details ul {
  list-style: none; padding: 0.5rem 0.85rem 0.75rem; margin: 0;
  display: flex; flex-direction: column; gap: 0.3rem;
}
.d-tips-details li {
  display: flex; align-items: flex-start; gap: 0.35rem;
  font-size: 0.78rem; color: var(--primary-100); line-height: 1.4;
}
.d-tips-details li svg { flex-shrink: 0; margin-top: 0.1rem; color: #4ade80; }

.detail-actions { margin-top: 0.25rem; }

/* Responsive: en móvil apilar imagen y datos */
@media (max-width: 600px) {
  .detail-body { flex-direction: column; }
  .detail-img { width: 100%; height: auto; max-height: 200px; }
  .d-kpis { gap: 0.4rem; }
  .d-kpi { min-width: calc(50% - 0.2rem); }
}
.btn-del {
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.3rem 0.65rem; min-height: 32px;
  background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.18);
  border-radius: 6px; font-size: 0.78rem; color: #fca5a5;
  cursor: pointer; font-family: inherit; transition: all .2s;
}
.btn-del:hover {
  background: rgba(239,68,68,.18); border-color: rgba(239,68,68,.35);
}
.btn-del:focus-visible { outline: 2px solid rgba(239,68,68,.5); outline-offset: 2px; }

/* ── Inline delete confirmation (no browser confirm()) ── */
.delete-confirm {
  display: flex; align-items: center; flex-wrap: wrap; gap: 0.6rem;
  padding: 0.7rem 0.9rem;
  background: rgba(239,68,68,.08);
  border: 1px solid rgba(239,68,68,.25);
  border-radius: 8px;
  animation: confirmIn .18s ease-out;
}
@keyframes confirmIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.delete-confirm__icon { color: #f87171; flex-shrink: 0; }
.delete-confirm__msg {
  font-size: 0.82rem; color: #fca5a5; flex: 1; min-width: 0;
}
.delete-confirm__btns { display: flex; gap: 0.4rem; margin-left: auto; }

.btn-cancel-del, .btn-confirm-del {
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.35rem 0.7rem; min-height: 32px;
  border-radius: 6px; font-size: 0.78rem; font-weight: 500;
  cursor: pointer; font-family: inherit; transition: all .15s; border: 1px solid;
}
.btn-cancel-del {
  background: var(--primary-700); border-color: var(--primary-600);
  color: var(--primary-200);
}
.btn-cancel-del:hover { background: var(--primary-600); color: var(--neutral-50); }
.btn-confirm-del {
  background: rgba(239,68,68,.15); border-color: rgba(239,68,68,.35);
  color: #fca5a5;
}
.btn-confirm-del:hover { background: rgba(239,68,68,.28); border-color: rgba(239,68,68,.5); color: #fef2f2; }
.btn-cancel-del:focus-visible,
.btn-confirm-del:focus-visible { outline: 2px solid rgba(239,68,68,.5); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  .delete-confirm { animation: none; }
}

/* ── Empty / loading ─────────────────────────────── */
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.6rem; padding: 3rem 1rem; text-align: center; color: var(--primary-400);
}
.empty-state svg { opacity: .4; }
.empty-sub { font-size: 0.85rem; color: var(--primary-500); margin: 0; }
.loading-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.75rem; padding: 2rem; color: var(--primary-300);
}
.spinner-lg {
  width: 32px; height: 32px;
  border: 3px solid var(--primary-700); border-top-color: var(--primary-400);
  border-radius: 50%; animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin .7s linear infinite; }
.btn-refresh:disabled { opacity: .6; cursor: default; }

/* ── Subscription bar ────────────────────────────── */
.sub-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: .75rem;
  padding: .75rem 1rem;
  background: rgba(16,185,129,.07);
  border: 1px solid rgba(16,185,129,.22);
  border-radius: 10px;
  margin-bottom: var(--space-m);
}
.sub-bar__info {
  display: flex;
  align-items: center;
  gap: .75rem;
  flex-wrap: wrap;
}
.sub-bar__badge {
  display: inline-block;
  padding: .2rem .65rem;
  background: rgba(16,185,129,.18);
  border: 1px solid rgba(16,185,129,.35);
  border-radius: 20px;
  font-size: .75rem;
  font-weight: 700;
  color: #10b981;
  letter-spacing: .04em;
  text-transform: uppercase;
}
.sub-bar__scans {
  font-size: .85rem;
  color: var(--primary-200);
}
.sub-bar__actions {
  display: flex;
  align-items: center;
  gap: .75rem;
}
.sub-bar__error {
  font-size: .8rem;
  color: #f87171;
}
.btn-portal {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  padding: .45rem 1rem;
  background: transparent;
  border: 1px solid rgba(16,185,129,.5);
  border-radius: 8px;
  color: #10b981;
  font-size: .85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, border-color .15s;
  white-space: nowrap;
  min-height: 36px;
}
.btn-portal:hover:not(:disabled) {
  background: rgba(16,185,129,.12);
  border-color: #10b981;
}
.btn-portal:disabled {
  opacity: .6;
  cursor: default;
}
.spinner-xs {
  display: inline-block;
  width: 12px; height: 12px;
  border: 2px solid rgba(16,185,129,.3);
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
.upgrade-confirm {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .5rem;
  padding: .55rem .85rem;
  background: rgba(139,92,246,.08);
  border: 1px solid rgba(139,92,246,.3);
  border-radius: 8px;
}
.upgrade-confirm__msg {
  font-size: .8rem;
  color: #c4b5fd;
  flex: 1;
  min-width: 180px;
}
.upgrade-confirm__btns {
  display: flex;
  gap: .4rem;
  flex-shrink: 0;
}
.btn-upgrade--confirm {
  background: rgba(139,92,246,.25);
  border-color: rgba(139,92,246,.6);
}
.sub-bar__badge--pro {
  background: rgba(139,92,246,.18);
  border-color: rgba(139,92,246,.35);
  color: #a78bfa;
}
.sub-bar__success {
  font-size: .82rem;
  font-weight: 600;
  color: #4ade80;
}
.btn-upgrade {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  padding: .45rem 1rem;
  background: rgba(139,92,246,.15);
  border: 1px solid rgba(139,92,246,.45);
  border-radius: 8px;
  color: #c4b5fd;
  font-size: .85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, border-color .15s;
  white-space: nowrap;
  min-height: 36px;
}
.btn-upgrade:hover:not(:disabled) {
  background: rgba(139,92,246,.28);
  border-color: #a78bfa;
  color: #ede9fe;
}
.btn-upgrade:disabled {
  opacity: .6;
  cursor: default;
}

/* ── Responsive ──────────────────────────────────── */
@media (max-width: 860px) {
  .charts-grid { grid-template-columns: 1fr; }
  .chart-card--wide { min-width: 0; }
}
@media (max-width: 600px) {
  .kpi-row { grid-template-columns: 1fr 1fr; }
  .row-kwh { display: none; }
  .row-provider { max-width: 140px; }
}
</style>

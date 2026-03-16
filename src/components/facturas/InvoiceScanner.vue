<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from '@nanostores/vue'
import { supabase } from '../../lib/supabaseClient'
import {
  currentUser, currentSession, userProfile, authLoading,
  canScan, canScanFree, isSubscribed, monthlyScansLeft, monthlyLimit,
  SCAN_LIMITS, initAuth, incrementFreeScans, refreshProfile
} from '../../stores/authStore'
import {
  Upload, FileText, Zap, Flame, FileQuestion,
  CheckCircle, AlertTriangle, Loader, Camera,
  TrendingDown, Euro, Calendar, Building2,
  Lightbulb, X, Lock, LogIn, Star, CreditCard,
  Shield, RefreshCw, Sparkles, BarChart3,
  Pencil, Save, RotateCcw, LayoutDashboard,
  User, Hash, Network
} from 'lucide-vue-next'
import TariffAdvisor from './TariffAdvisor.vue'

const emit = defineEmits(['open-auth'])

const $user      = useStore(currentUser)
const $session   = useStore(currentSession)
const $loading   = useStore(authLoading)
const $profile   = useStore(userProfile)
const $canScan     = useStore(canScan)
const $canFree     = useStore(canScanFree)
const $subbed      = useStore(isSubscribed)
const $scansLeft   = useStore(monthlyScansLeft)
const $monthlyLimit = useStore(monthlyLimit)

// ─── Subscription ────────────────────────────────────
const subscribing = ref('')

async function handleSubscribe(tier) {
  console.log('[handleSubscribe] tier:', tier, 'session:', !!$session.value)
  if (!$session.value) { openAuth(); return }
  subscribing.value = tier
  try {
    const { data: { session: freshSession } } = await supabase.auth.getSession()
    console.log('[handleSubscribe] freshSession:', !!freshSession?.access_token)
    if (!freshSession?.access_token) { openAuth(); return }
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshSession.access_token}`,
      },
      body: JSON.stringify({ tier }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      error.value = data.error || 'Error al iniciar el pago'
    }
  } catch {
    error.value = 'Error de conexión al procesar el pago'
  } finally {
    subscribing.value = ''
  }
}

// ─── Scanner state ──────────────────────────────────
const invoiceType  = ref('luz')
const dragging     = ref(false)
const preview      = ref(null)
const processing   = ref(false)
const error        = ref('')
const result       = ref(null)
const showFullOcr  = ref(false)
const fileInputRef = ref(null)

// ─── Edit mode ───────────────────────────────────────
const editMode     = ref(false)
const saving       = ref(false)
const editFields   = ref({})

function enterEditMode() {
  const x = result.value?.extracted ?? {}
  editFields.value = {
    total_amount:    x.total_amount    ?? null,
    power_term:      x.power_term      ?? null,
    energy_term:     x.energy_term     ?? null,
    meter_rental:    x.meter_rental    ?? null,
    taxes:           x.taxes           ?? null,
    consumption_kwh: x.consumption_kwh ?? null,
    price_per_kwh:   x.price_per_kwh   ?? null,
  }
  editMode.value = true
}

// Recálculo 100% local (sin IA, sin red): suma los términos editados
function recalculate() {
  const p  = parseFloat(editFields.value.power_term)    || 0
  const e  = parseFloat(editFields.value.energy_term)   || 0
  const mr = parseFloat(editFields.value.meter_rental)  || 0
  const tx = parseFloat(editFields.value.taxes)         || 0
  const base = p + e + mr
  if (base > 0 || tx > 0) {
    editFields.value.total_amount = +(base + tx).toFixed(2)
  }
}

async function saveEdits() {
  // Si la factura no tiene ID (insert falló) no podemos actualizar — salir con mensaje
  if (!result.value?.invoice?.id) {
    error.value = 'Esta factura no se guardó en la base de datos. Vuelve a escanearla.'
    editMode.value = false
    return
  }

  // Auto-recalcular antes de guardar (JS puro, sin IA)
  recalculate()

  saving.value = true
  try {
    const fields = editFields.value
    const patch = {
      total_amount:    parseFloat(fields.total_amount)    || null,
      power_term:      parseFloat(fields.power_term)      || null,
      energy_term:     parseFloat(fields.energy_term)     || null,
      taxes:           parseFloat(fields.taxes)           || null,
      consumption_kwh: parseFloat(fields.consumption_kwh) || null,
      price_per_kwh:   parseFloat(fields.price_per_kwh)  || null,
      extracted_data:  { ...result.value.extracted, ...fields },
    }
    const { error: err } = await supabase
      .from('scanned_invoices')
      .update(patch)
      .eq('id', result.value.invoice.id)
    if (!err) {
      // Actualizar vista local con los valores corregidos
      result.value.extracted = { ...result.value.extracted, ...fields }
      editMode.value = false
    } else {
      error.value = `Error al guardar: ${err.message || 'inténtalo de nuevo'}`
    }
  } catch (e) {
    console.error('saveEdits:', e)
    error.value = 'Error inesperado al guardar. Inténtalo de nuevo.'
  } finally {
    // Siempre liberar el spinner, pase lo que pase
    saving.value = false
  }
}

// ─── Gate state ──────────────────────────────────────
// 3 possible gates: 'none' | 'login' | 'paywall'
const gate = computed(() => {
  if ($loading.value) return 'none'      // Still loading auth - don't flash gate
  if (!$user.value)   return 'login'
  // No mostrar paywall si hay un resultado activo (el usuario puede editar antes de ver los planes)
  if (!$canScan.value && !result.value) return 'paywall'
  return 'none'
})

const scansLeftBadge = computed(() => {
  if ($canFree.value) return { label: '1 escaneo gratis disponible', cls: 'badge--blue' }
  if ($subbed.value) return {
    label: `${$scansLeft.value} de ${$monthlyLimit.value} escaneos este mes`,
    cls: $scansLeft.value <= 3 ? 'badge--orange' : 'badge--green'
  }
  return null
})

// ─── Invoice types ───────────────────────────────────
const invoiceTypes = [
  { value: 'luz',  label: 'Factura de Luz', icon: Zap,          color: '#fbbf24' },
  { value: 'gas',  label: 'Factura de Gas', icon: Flame,        color: '#f97316' },
  { value: 'otro', label: 'Otro tipo',      icon: FileQuestion, color: '#10b981' },
]
const currentType = computed(() => invoiceTypes.find(t => t.value === invoiceType.value))

// Tipo real del resultado escaneado (fijo, no cambia aunque el usuario mueva el selector)
const resultType    = computed(() => result.value?.invoice?.invoice_type || invoiceType.value)
const resultTypeInfo = computed(() => invoiceTypes.find(t => t.value === resultType.value))

// ─── Upload handlers ─────────────────────────────────
function triggerInput() {
  if (gate.value !== 'none') return
  fileInputRef.value?.click()
}

async function handleFile(e) {
  const file = e.target.files?.[0]
  if (file) await prepareAndScan(file)
}

async function onDrop(e) {
  e.preventDefault()
  dragging.value = false
  if (gate.value !== 'none') return
  const file = e.dataTransfer.files?.[0]
  if (file) await prepareAndScan(file)
}

// ─── PDF → imagen (client-side, sin tocar Edge Function) ──
async function pdfToImageBlob(file) {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const page = await pdf.getPage(1)          // primera página
  const viewport = page.getViewport({ scale: 2.0 })

  const canvas = document.createElement('canvas')
  canvas.width  = viewport.width
  canvas.height = viewport.height
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise

  return new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.92)
  )
}

async function prepareAndScan(file) {
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'El archivo supera el límite de 5 MB. Comprime la imagen o el PDF antes de subir.'
    return
  }
  if (file.type === 'application/pdf') {
    processing.value = true
    error.value = ''
    try {
      const imageBlob = await pdfToImageBlob(file)
      const imageFile = new File([imageBlob], file.name.replace('.pdf', '.jpg'), { type: 'image/jpeg' })
      preview.value = URL.createObjectURL(imageBlob)
      await uploadAndScan(imageFile, true) // skip preview assignment
    } catch (e) {
      console.error('PDF conversion error:', e)
      error.value = 'No se pudo convertir el PDF. Prueba con una imagen (JPG/PNG).'
      processing.value = false
    }
  } else if (file.type.startsWith('image/')) {
    await uploadAndScan(file)
  } else {
    error.value = 'Formato no válido. Sube una imagen (JPG, PNG, WebP) o un PDF.'
  }
}

// ─── File hash (SHA-256) for scan caching ─────────────
async function hashFile(file) {
  try {
    const buf = await file.arrayBuffer()
    const digest = await crypto.subtle.digest('SHA-256', buf)
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    return null
  }
}

// ─── Main scan logic ─────────────────────────────────
async function uploadAndScan(file, skipPreview = false) {
  if (!$user.value || !$session.value) return
  if (!$canScan.value) return

  if (!skipPreview) preview.value = URL.createObjectURL(file)
  processing.value = true
  error.value     = ''
  result.value    = null

  try {
    const fileHash = await hashFile(file)

    const fd = new FormData()
    fd.append('image', file)
    fd.append('invoiceType', invoiceType.value)
    if (fileHash) fd.append('fileHash', fileHash)

    const res = await fetch('/api/scan-invoice', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${$session.value.access_token}` },
      body: fd,
    })
    const data = await res.json()

    if (!res.ok) {
      error.value = data.error || 'Error al procesar la factura'
      return
    }

    result.value = data
    if (!$subbed.value) await incrementFreeScans($user.value.id)
    // Notificar al dashboard para que recargue
    document.dispatchEvent(new CustomEvent('refresh-dashboard'))

  } catch {
    error.value = 'Error de conexión. Inténtalo de nuevo.'
  } finally {
    processing.value = false
  }
}

function resetScanner() {
  preview.value   = null
  result.value    = null
  error.value     = ''
  showFullOcr.value = false
  if (fileInputRef.value) fileInputRef.value.value = ''
}

// ─── Formatting helpers ───────────────────────────────
function fmt(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v)
}
function fmtDate(d) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d))
}

function openAuth() {
  document.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }))
}

function goToDashboard() {
  // switchToDashboard está definido como window global en escanear-factura.astro
  if (typeof globalThis.switchToDashboard === 'function') globalThis.switchToDashboard()
}

onMounted(async () => {
  await initAuth()
  // Auto-sync: si el usuario tiene customer de Stripe pero Supabase dice no suscrito,
  // verificar el estado real directamente en Stripe (cubre webhooks que no llegaron)
  const profile = $profile.value
  if (profile && !profile.is_subscribed && !profile.is_unlimited && profile.free_scans_used >= 1) {
    try {
      // Usar sesión fresca para evitar tokens expirados del store
      const { data: { session: freshSession } } = await supabase.auth.getSession()
      if (freshSession?.access_token) {
        const res = await fetch('/api/sync-subscription', {
          method: 'POST',
          headers: { Authorization: `Bearer ${freshSession.access_token}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.synced && data.is_subscribed) await refreshProfile()
        }
      }
    } catch { /* silencioso */ }
  }
})
</script>

<template>
  <div class="scanner">

    <!-- ── GATE: Auth loading (evita flash de paywall) ──── -->
    <div v-if="$loading" class="gate gate--loading" role="status" aria-live="polite">
      <div class="gate__spinner" aria-hidden="true"></div>
      <p>Comprobando sesión...</p>
    </div>

    <!-- ── GATE: Login requerido ──────────────────────────── -->
    <div v-else-if="gate === 'login'" class="gate gate--login">
      <div class="gate__icon">
        <LogIn :size="32" aria-hidden="true" />
      </div>
      <h3 class="gate__title">Inicia sesión para escanear</h3>
      <p class="gate__desc">
        Crea una cuenta gratis y obtén <strong>1 escaneo gratuito</strong>
        para analizar tu factura con inteligencia artificial.
      </p>
      <div class="gate__actions">
        <button
          class="btn-gate btn-gate--primary"
          @click="openAuth"
          aria-label="Iniciar sesión o registrarse"
        >
          <LogIn :size="16" aria-hidden="true" />
          Iniciar sesión / Registrarse
        </button>
      </div>
      <p class="gate__note">
        <CheckCircle :size="13" aria-hidden="true" />
        1 escaneo gratis · Sin tarjeta de crédito
      </p>
    </div>

    <!-- ── GATE: Paywall ─────────────────────────────────── -->
    <div v-else-if="gate === 'paywall'" class="gate gate--paywall">
      <div class="gate__icon gate__icon--lock">
        <Lock :size="28" aria-hidden="true" />
      </div>
      <h3 class="gate__title">Has usado tu escaneo gratuito</h3>
      <p class="gate__desc">
        Elige el plan que mejor se adapta a tus necesidades y sigue analizando
        tus facturas con inteligencia artificial.
      </p>

      <div class="plans-grid" role="list" aria-label="Planes de suscripción">

        <!-- Plan Básico -->
        <div class="plan-card" role="listitem">
          <div class="plan-name">Plan Básico</div>
          <div class="plan-price">
            <span class="plan-price__amount">4,99€</span>
            <span class="plan-price__period">/mes</span>
          </div>
          <p class="plan-scans">
            <Zap :size="14" aria-hidden="true" />
            <strong>{{ SCAN_LIMITS.basico }} escaneos</strong>/mes
          </p>
          <ul class="plan-features" aria-label="Características Plan Básico">
            <li><CheckCircle :size="13" aria-hidden="true" /> Facturas de luz, gas y otros</li>
            <li><CheckCircle :size="13" aria-hidden="true" /> Consejos de ahorro IA</li>
            <li><CheckCircle :size="13" aria-hidden="true" /> Historial y gráficos</li>
          </ul>
          <button
            class="btn-gate btn-gate--subscribe btn-gate--basico"
            aria-label="Suscribirse al Plan Básico por 4,99 euros al mes"
            @click="handleSubscribe('basico')"
            :disabled="!!subscribing"
          >
            <Loader v-if="subscribing === 'basico'" :size="15" class="spin" aria-hidden="true" />
            <CreditCard v-else :size="15" aria-hidden="true" />
            Empezar — 4,99 €/mes
          </button>
        </div>

        <!-- Plan Pro -->
        <div class="plan-card plan-card--featured" role="listitem">
          <div class="plan-badge">
            <Star :size="12" aria-hidden="true" /> Más popular
          </div>
          <div class="plan-name">Plan Pro</div>
          <div class="plan-price">
            <span class="plan-price__amount">9,99€</span>
            <span class="plan-price__period">/mes</span>
          </div>
          <p class="plan-scans">
            <Sparkles :size="14" aria-hidden="true" />
            <strong>{{ SCAN_LIMITS.pro }} escaneos</strong>/mes
          </p>
          <ul class="plan-features" aria-label="Características Plan Pro">
            <li><CheckCircle :size="13" aria-hidden="true" /> Todo lo del Plan Básico</li>
            <li><CheckCircle :size="13" aria-hidden="true" /> Mayor capacidad mensual</li>
            <li><CheckCircle :size="13" aria-hidden="true" /> Comparativas entre periodos</li>
            <li><CheckCircle :size="13" aria-hidden="true" /> Soporte prioritario</li>
          </ul>
          <button
            class="btn btn-gate"
            data-type="accent"
            aria-label="Suscribirse al Plan Pro por 9,99 euros al mes"
            @click="handleSubscribe('pro')"
            :disabled="subscribing"
          >
            <Loader v-if="subscribing === 'pro'" :size="15" class="spin" aria-hidden="true" />
            <BarChart3 v-else :size="15" aria-hidden="true" />
            Suscribirse — 9,99 €/mes
          </button>
        </div>

      </div>

      <p class="plan-note">
        <Shield :size="12" aria-hidden="true" />
        Cancela cuando quieras. Sin permanencia.
      </p>
    </div>

    <!-- ── SCANNER ACTIVO ─────────────────────────────────── -->
    <template v-else>

      <!-- Status badge -->
      <div
        v-if="scansLeftBadge"
        class="status-badge"
        :class="scansLeftBadge.cls"
        role="status"
        aria-live="polite"
      >
        <component :is="$canFree ? Zap : ($scansLeft <= 3 ? AlertTriangle : CheckCircle)" :size="14" aria-hidden="true" />
        {{ scansLeftBadge.label }}
      </div>

      <!-- Tipo de factura -->
      <div class="type-row" role="group" aria-label="Tipo de factura"
        :class="{ 'type-row--locked': !!result }"
        :aria-disabled="!!result"
      >
        <button
          v-for="t in invoiceTypes"
          :key="t.value"
          class="type-btn"
          :class="{
            'type-btn--active': invoiceType === t.value,
            'type-btn--locked': !!result && invoiceType !== t.value,
          }"
          :disabled="!!result"
          :aria-pressed="invoiceType === t.value"
          :aria-label="`Seleccionar ${t.label}`"
          @click="!result && (invoiceType = t.value)"
        >
          <component :is="t.icon" :size="18" :style="{ color: invoiceType === t.value ? t.color : '' }" aria-hidden="true" />
          {{ t.label }}
        </button>
        <span v-if="result" class="type-row__locked-hint" aria-live="polite">
          <Lock :size="11" aria-hidden="true" /> Pulsa "Escanear otra" para cambiar
        </span>
      </div>

      <!-- Zona de upload / preview / resultado -->
      <div
        v-if="!result"
        class="upload-zone"
        :class="{
          'upload-zone--drag': dragging,
          'upload-zone--preview': preview,
        }"
        role="button"
        :aria-label="preview ? 'Cambiar imagen de factura' : 'Subir imagen de factura'"
        tabindex="0"
        @click="triggerInput"
        @keydown.enter.prevent="triggerInput"
        @keydown.space.prevent="triggerInput"
        @drop="onDrop"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
      >
        <!-- Processing overlay -->
        <template v-if="preview && processing">
          <img :src="preview" alt="Vista previa de la factura" class="upload-zone__img" />
          <div class="upload-zone__overlay" aria-live="assertive" role="status">
            <Loader :size="36" class="spin" aria-hidden="true" />
            <strong>Analizando con IA…</strong>
            <span class="overlay-sub">Extrayendo consumo, importes y periodos</span>
          </div>
        </template>

        <!-- Change image hint -->
        <template v-else-if="preview && !processing">
          <img :src="preview" alt="Vista previa de la factura" class="upload-zone__img" />
          <div class="upload-zone__hint">
            <Camera :size="18" aria-hidden="true" /> Clic para cambiar imagen
          </div>
        </template>

        <!-- Empty state -->
        <template v-else>
          <div class="upload-zone__body">
            <div class="upload-zone__icon" aria-hidden="true">
              <Upload :size="36" />
            </div>
            <p class="upload-zone__title">
              Sube tu {{ currentType?.label.toLowerCase() }}
            </p>
            <p class="upload-zone__sub">Arrastra y suelta o haz clic para seleccionar</p>
            <p class="upload-zone__hint-text">JPG, PNG, WebP, PDF · Máx. 5 MB · Analizado con IA</p>
          </div>
        </template>

        <input
          ref="fileInputRef"
          type="file"
          accept="image/*,application/pdf"
          class="sr-only"
          tabindex="-1"
          aria-hidden="true"
          @change="handleFile"
        />
      </div>

      <!-- Error inline -->
      <div
        v-if="error"
        class="inline-error"
        role="alert"
        aria-live="assertive"
      >
        <AlertTriangle :size="16" aria-hidden="true" />
        <span>{{ error }}</span>
        <button
          class="inline-error__close"
          @click="error = ''"
          aria-label="Cerrar mensaje de error"
        >
          <X :size="14" aria-hidden="true" />
        </button>
      </div>

      <!-- ── RESULTADOS ──────────────────────────────────── -->
      <section v-if="result" class="results" aria-label="Resultado del análisis">

        <!-- Header -->
        <div class="results__head">
          <div class="results__status">
            <CheckCircle :size="22" class="text-success" aria-hidden="true" />
            <div>
              <h3>Factura analizada</h3>
              <p v-if="result.extracted?.provider">{{ result.extracted.provider }}</p>
            </div>
          </div>
          <!-- Badge de tipo detectado -->
          <div
            v-if="resultTypeInfo"
            class="result-type-badge"
            :style="{ '--type-color': resultTypeInfo.color }"
            :aria-label="`Tipo de factura: ${resultTypeInfo.label}`"
          >
            <component :is="resultTypeInfo.icon" :size="13" aria-hidden="true" />
            {{ resultTypeInfo.label }}
          </div>
          <div class="results__actions">
            <button
              class="btn-dashboard"
              @click="goToDashboard"
              aria-label="Ver en mi dashboard"
            >
              <LayoutDashboard :size="14" aria-hidden="true" /> Mi dashboard
            </button>
            <button class="btn-reset" @click="resetScanner" aria-label="Escanear otra factura">
              <RefreshCw :size="14" aria-hidden="true" /> Escanear otra
            </button>
          </div>
        </div>

        <!-- KPI cards -->
        <div class="result-kpis" role="list">
          <div class="kpi" role="listitem">
            <Euro :size="18" class="kpi__icon kpi__icon--blue" aria-hidden="true" />
            <div>
              <span class="kpi__label">Total factura</span>
              <span class="kpi__val">{{ fmt(result.extracted?.total_amount) }}</span>
            </div>
          </div>
          <div v-if="result.extracted?.consumption_kwh" class="kpi" role="listitem">
            <Zap :size="18" class="kpi__icon kpi__icon--yellow" aria-hidden="true" />
            <div>
              <span class="kpi__label">Consumo</span>
              <span class="kpi__val">{{ result.extracted.consumption_kwh }} kWh</span>
            </div>
          </div>
          <div v-if="result.extracted?.billing_period_start" class="kpi" role="listitem">
            <Calendar :size="18" class="kpi__icon kpi__icon--primary" aria-hidden="true" />
            <div>
              <span class="kpi__label">Periodo</span>
              <span class="kpi__val kpi__val--sm">
                {{ fmtDate(result.extracted.billing_period_start) }}<br />
                {{ fmtDate(result.extracted.billing_period_end) }}
              </span>
            </div>
          </div>
          <div v-if="result.extracted?.provider" class="kpi" role="listitem">
            <Building2 :size="18" class="kpi__icon kpi__icon--gray" aria-hidden="true" />
            <div>
              <span class="kpi__label">Comercializadora</span>
              <span class="kpi__val kpi__val--sm">{{ result.extracted.provider }}</span>
            </div>
          </div>
          <div v-if="result.extracted?.distributor" class="kpi" role="listitem">
            <Network :size="18" class="kpi__icon kpi__icon--teal" aria-hidden="true" />
            <div>
              <span class="kpi__label">Distribuidora</span>
              <span class="kpi__val kpi__val--sm">{{ result.extracted.distributor }}</span>
            </div>
          </div>
        </div>

        <!-- CUPS + Titular strip -->
        <div v-if="result.extracted?.cups || result.extracted?.holder_name" class="id-strip">
          <div v-if="result.extracted?.cups" class="id-strip__item">
            <Hash :size="13" aria-hidden="true" />
            <span class="id-strip__label">CUPS</span>
            <code class="id-strip__val">{{ result.extracted.cups }}</code>
          </div>
          <div v-if="result.extracted?.holder_name" class="id-strip__item">
            <User :size="13" aria-hidden="true" />
            <span class="id-strip__label">Titular</span>
            <span class="id-strip__val">{{ result.extracted.holder_name }}</span>
          </div>
        </div>

        <!-- Desglose -->
        <div class="breakdown" aria-label="Desglose de la factura">
          <div class="breakdown__header">
            <h4 class="breakdown__title">Desglose</h4>
            <div class="breakdown__edit-actions">
              <template v-if="!editMode">
                <button class="btn-edit" @click="enterEditMode" aria-label="Editar valores de la factura">
                  <Pencil :size="13" aria-hidden="true" /> Corregir valores
                </button>
              </template>
              <template v-else>
                <button class="btn-recalc" @click="recalculate" aria-label="Recalcular total">
                  <RotateCcw :size="13" aria-hidden="true" /> Recalcular
                </button>
                <button class="btn-save" @click="saveEdits" :disabled="saving" aria-label="Guardar cambios">
                  <Loader v-if="saving" :size="13" class="spin" aria-hidden="true" />
                  <Save v-else :size="13" aria-hidden="true" />
                  Guardar
                </button>
                <button class="btn-cancel-edit" @click="editMode = false" aria-label="Cancelar edición">
                  <X :size="13" aria-hidden="true" />
                </button>
              </template>
            </div>
          </div>
          <p v-if="editMode" class="edit-hint">
            <AlertTriangle :size="12" aria-hidden="true" />
            Corrige los importes si la IA no los reconoció bien. El total se recalcula automáticamente al guardar.
          </p>
          <dl class="breakdown__list">
            <!-- Modo edición -->
            <template v-if="editMode">
              <dt>{{ resultType === 'gas' ? 'Término fijo' : 'Término de potencia' }}</dt>
              <dd><input class="edit-input" type="number" step="0.01" v-model="editFields.power_term" aria-label="Término de potencia en euros" /> €</dd>
              <dt>{{ resultType === 'gas' ? 'Término variable' : 'Término de energía' }}</dt>
              <dd><input class="edit-input" type="number" step="0.01" v-model="editFields.energy_term" aria-label="Término de energía en euros" /> €</dd>
              <dt>Alquiler contador</dt>
              <dd><input class="edit-input" type="number" step="0.01" v-model="editFields.meter_rental" aria-label="Alquiler del contador en euros" /> €</dd>
              <dt>Impuestos / IVA</dt>
              <dd><input class="edit-input" type="number" step="0.01" v-model="editFields.taxes" aria-label="Impuestos en euros" /> €</dd>
              <dt>Consumo (kWh)</dt>
              <dd><input class="edit-input" type="number" step="0.1" v-model="editFields.consumption_kwh" aria-label="Consumo en kWh" /> kWh</dd>
              <dt>Precio medio kWh</dt>
              <dd><input class="edit-input" type="number" step="0.0001" v-model="editFields.price_per_kwh" aria-label="Precio por kWh" /> €/kWh</dd>
              <dt class="total-dt">TOTAL <span class="total-auto-hint">(auto)</span></dt>
              <dd class="total-dd edit-total">
                <input class="edit-input edit-input--total" type="number" step="0.01" v-model="editFields.total_amount" aria-label="Total de la factura en euros" /> €
              </dd>
            </template>

            <!-- Modo lectura -->
            <template v-else>

              <!-- ── Sección costes ── -->
              <template v-if="result.extracted?.power_term != null">
                <dt>{{ resultType === 'gas' ? 'Término fijo' : 'Término de potencia' }}</dt>
                <dd>{{ fmt(result.extracted.power_term) }}</dd>
              </template>
              <template v-if="result.extracted?.energy_term != null">
                <dt>{{ resultType === 'gas' ? 'Término variable (energía)' : 'Término de energía' }}</dt>
                <dd>{{ fmt(result.extracted.energy_term) }}</dd>
              </template>
              <template v-if="result.extracted?.meter_rental != null">
                <dt>Alquiler del contador</dt><dd>{{ fmt(result.extracted.meter_rental) }}</dd>
              </template>
              <template v-if="result.extracted?.electricity_tax != null">
                <dt>Imp. electricidad{{ result.extracted.electricity_tax_rate ? ` (${result.extracted.electricity_tax_rate}%)` : '' }}</dt>
                <dd>{{ fmt(result.extracted.electricity_tax) }}</dd>
              </template>
              <template v-if="result.extracted?.hydrocarbon_tax != null">
                <dt>Imp. hidrocarburos{{ result.extracted.hydrocarbon_tax_rate ? ` (${result.extracted.hydrocarbon_tax_rate} €/kWh)` : '' }}</dt>
                <dd>{{ fmt(result.extracted.hydrocarbon_tax) }}</dd>
              </template>
              <template v-if="result.extracted?.taxes != null">
                <dt>IVA{{ result.extracted.iva_rate ? ` (${result.extracted.iva_rate}%)` : '' }}</dt>
                <dd>{{ fmt(result.extracted.taxes) }}</dd>
              </template>
              <template v-if="result.extracted?.total_amount != null">
                <dt class="total-dt">TOTAL</dt><dd class="total-dd">{{ fmt(result.extracted.total_amount) }}</dd>
              </template>

              <!-- ── Separador consumo ── -->
              <template v-if="result.extracted?.consumption_kwh || result.extracted?.consumption_p1 || result.extracted?.consumption_m3">
                <dt class="section-dt">Consumo y lecturas</dt><dd class="section-dd"></dd>
              </template>

              <template v-if="result.extracted?.consumption_kwh">
                <dt>Consumo total</dt><dd>{{ result.extracted.consumption_kwh }} kWh</dd>
              </template>
              <template v-if="result.extracted?.consumption_m3">
                <dt>Consumo (m³)</dt><dd>{{ result.extracted.consumption_m3 }} m³</dd>
              </template>
              <template v-if="result.extracted?.conversion_factor">
                <dt>Factor conversión</dt><dd>{{ result.extracted.conversion_factor }}</dd>
              </template>
              <template v-if="result.extracted?.price_per_kwh != null">
                <dt>Precio medio kWh</dt><dd>{{ result.extracted.price_per_kwh?.toFixed(4) }} €/kWh</dd>
              </template>
              <template v-if="result.extracted?.consumption_p1">
                <dt>Consumo punta (P1)</dt>
                <dd>{{ result.extracted.consumption_p1 }} kWh{{ result.extracted.price_p1 ? ` · ${result.extracted.price_p1?.toFixed(4)} €/kWh` : '' }}</dd>
              </template>
              <template v-if="result.extracted?.consumption_p2">
                <dt>Consumo llano (P2)</dt>
                <dd>{{ result.extracted.consumption_p2 }} kWh{{ result.extracted.price_p2 ? ` · ${result.extracted.price_p2?.toFixed(4)} €/kWh` : '' }}</dd>
              </template>
              <template v-if="result.extracted?.consumption_p3">
                <dt>Consumo valle (P3)</dt>
                <dd>{{ result.extracted.consumption_p3 }} kWh{{ result.extracted.price_p3 ? ` · ${result.extracted.price_p3?.toFixed(4)} €/kWh` : '' }}</dd>
              </template>
              <template v-if="result.extracted?.reading_current != null || result.extracted?.meter_reading_start != null">
                <dt>Lectura inicio</dt><dd>{{ result.extracted.reading_previous ?? result.extracted.meter_reading_start ?? '—' }} kWh</dd>
              </template>
              <template v-if="result.extracted?.reading_current != null || result.extracted?.meter_reading_end != null">
                <dt>Lectura fin{{ result.extracted.reading_type ? ` (${result.extracted.reading_type})` : '' }}</dt>
                <dd>{{ result.extracted.reading_current ?? result.extracted.meter_reading_end ?? '—' }} kWh</dd>
              </template>

              <!-- ── Separador contrato ── -->
              <template v-if="result.extracted?.contracted_power_p1 || result.extracted?.tariff_type || result.extracted?.access_tariff || result.extracted?.contract_end_date">
                <dt class="section-dt">Contrato y tarifa</dt><dd class="section-dd"></dd>
              </template>

              <template v-if="result.extracted?.tariff_type">
                <dt>Tipo tarifa</dt><dd>{{ result.extracted.tariff_type }}</dd>
              </template>
              <template v-if="result.extracted?.access_tariff">
                <dt>Tarifa de acceso</dt><dd>{{ result.extracted.access_tariff }}</dd>
              </template>
              <template v-if="result.extracted?.contracted_power_p1">
                <dt>Potencia contratada P1</dt><dd>{{ result.extracted.contracted_power_p1 }} kW</dd>
              </template>
              <template v-if="result.extracted?.contracted_power_p2">
                <dt>Potencia contratada P2</dt><dd>{{ result.extracted.contracted_power_p2 }} kW</dd>
              </template>
              <template v-if="result.extracted?.contract_end_date">
                <dt>Fin de contrato</dt><dd>{{ fmtDate(result.extracted.contract_end_date) }}</dd>
              </template>
              <template v-if="result.extracted?.contract_number">
                <dt>Nº contrato</dt><dd class="monospace">{{ result.extracted.contract_number }}</dd>
              </template>
            </template>
          </dl>
        </div>

        <!-- Consejos de ahorro -->
        <div v-if="result.extracted?.tips?.length" class="tips" role="region" aria-label="Consejos de ahorro">
          <h4>
            <Lightbulb :size="16" aria-hidden="true" />
            Consejos de ahorro personalizados
          </h4>
          <ul>
            <li v-for="(tip, i) in result.extracted.tips" :key="i">
              <TrendingDown :size="14" aria-hidden="true" />
              {{ tip }}
            </li>
          </ul>
        </div>

        <!-- Comparativa de tarifas (solo facturas de luz) -->
        <TariffAdvisor
          v-if="resultType === 'luz'"
          :pricePerKwh="result.extracted?.price_per_kwh ?? null"
          :consumptionKwh="result.extracted?.consumption_kwh ?? null"
          :provider="result.extracted?.provider ?? null"
        />

        <!-- Ver OCR colapsable -->
        <details class="ocr-details">
          <summary>
            <FileText :size="14" aria-hidden="true" />
            Texto completo extraído por la IA
          </summary>
          <pre class="ocr-text">{{ result.extracted?.ocrText || '—' }}</pre>
        </details>

      </section>
    </template>
  </div>
</template>

<style scoped>
/* ─── Layout ────────────────────────────────────────── */
.scanner { display: flex; flex-direction: column; gap: 1.1rem; }

/* ─── Gate shared ────────────────────────────────────── */
.gate {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 2.5rem 1.5rem;
  border: 1px solid var(--primary-700);
  border-radius: 16px;
  gap: 0.75rem;
}
.gate--loading {
  background: var(--primary-900); color: var(--primary-400);
  gap: 0.85rem;
}
.gate__spinner {
  width: 32px; height: 32px;
  border: 3px solid var(--primary-700); border-top-color: var(--primary-400);
  border-radius: 50%; animation: spin .7s linear infinite;
}
.gate--login  { background: var(--primary-900); }
.gate--paywall { background: var(--primary-900); }
.gate__icon {
  width: 60px; height: 60px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(99, 149, 238, 0.12);
  border-radius: 50%; color: var(--primary-300);
  margin-bottom: 0.25rem;
}
.gate__icon--lock {
  background: rgba(251, 191, 36, 0.12); color: #fbbf24;
}
.gate__title {
  font-size: 1.2rem; font-weight: 700;
  color: var(--neutral-50); margin: 0;
}
.gate__desc {
  font-size: 0.9rem; color: var(--primary-200);
  max-width: 380px; margin: 0; line-height: 1.5;
}
.gate__actions { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; margin-top: 0.25rem; }
.gate__note {
  display: flex; align-items: center; gap: 0.35rem;
  font-size: 0.78rem; color: var(--primary-500); margin: 0;
}
.gate__note svg { color: #4ade80; }

/* ─── Gate CTA buttons ───────────────────────────────── */
.btn-gate {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 10px; font-size: 0.95rem; font-weight: 600;
  cursor: pointer; transition: all .2s; font-family: inherit;
  min-height: 48px; /* touch target ≥ 44px */
  border: none;
}
.btn-gate--primary {
  background: var(--primary-500); color: var(--neutral-50);
  width: 100%; max-width: 360px;
}
.btn-gate--primary:hover { background: var(--primary-400); transform: translateY(-1px); }
.btn-gate--subscribe {
  color: var(--neutral-50); width: 100%;
  font-size: 0.875rem;
}
.btn-gate--basico {
  background: var(--primary-600);
}
.btn-gate--basico:hover { background: var(--primary-500); transform: translateY(-1px); }
.btn-gate--pro {
  background: linear-gradient(135deg, hsl(250,60%,42%), hsl(220,58%,46%));
  box-shadow: 0 4px 14px rgba(99,74,233,.35);
}
.btn-gate--pro:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99,74,233,.45); }

/* ─── Plans grid (paywall) ───────────────────────────── */
.plans-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  width: 100%;
  max-width: 640px;
}
.plan-card {
  background: var(--primary-800);
  border: 1px solid var(--primary-700);
  border-radius: 16px; padding: 1.25rem;
  display: flex; flex-direction: column; gap: 0.75rem;
  text-align: left;
  position: relative;
}
.plan-card--featured {
  border-color: var(--primary-500);
  background: var(--primary-750, var(--primary-800));
  box-shadow: 0 0 0 1px var(--primary-500), 0 8px 24px rgba(0,0,0,.3);
}
.plan-badge {
  display: inline-flex; align-items: center; gap: 0.3rem;
  background: rgba(251,191,36,.15); color: #fbbf24;
  padding: 0.15rem 0.55rem; border-radius: 20px;
  font-size: 0.7rem; font-weight: 600;
  width: fit-content;
}
.plan-name {
  font-size: 0.8rem; font-weight: 600; color: var(--primary-300);
  text-transform: uppercase; letter-spacing: .05em;
}
.plan-price { display: flex; align-items: baseline; gap: 0.1rem; }
.plan-price__amount { font-size: 1.9rem; font-weight: 800; color: var(--neutral-50); }
.plan-price__period  { font-size: 0.9rem; color: var(--primary-400); }
.plan-scans {
  display: flex; align-items: center; gap: 0.35rem;
  font-size: 0.82rem; color: var(--primary-200);
  margin: 0;
}
.plan-scans svg { color: #fbbf24; flex-shrink: 0; }
.plan-card--featured .plan-scans svg { color: var(--amber); }
.plan-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.35rem; }
.plan-features li {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.8rem; color: var(--primary-200);
}
.plan-features li svg { color: #4ade80; flex-shrink: 0; }
.plan-note {
  display: flex; align-items: center; gap: 0.35rem;
  font-size: 0.75rem; color: var(--primary-500); margin: 0; justify-content: center;
}

/* ─── Status badge ───────────────────────────────────── */
.status-badge {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.35rem 0.85rem; border-radius: 20px;
  font-size: 0.8rem; font-weight: 500;
  width: fit-content;
}
.badge--green  { background: rgba(34,197,94,.12); color: #86efac; border: 1px solid rgba(34,197,94,.2); }
.badge--blue   { background: rgba(59,130,246,.12); color: #93c5fd; border: 1px solid rgba(59,130,246,.2); }
.badge--orange { background: rgba(251,146,60,.12); color: #fdba74; border: 1px solid rgba(251,146,60,.25); }

/* ─── Invoice type tabs ──────────────────────────────── */
.type-row {
  display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;
  transition: opacity .2s;
}
.type-row--locked { opacity: 0.65; }
.type-btn {
  display: inline-flex; align-items: center; gap: 0.45rem;
  padding: 0.55rem 1rem;
  background: var(--primary-800); border: 2px solid var(--primary-700);
  border-radius: 10px; color: var(--primary-300);
  font-size: 0.875rem; font-weight: 500; cursor: pointer;
  transition: all .15s; font-family: inherit;
  min-height: 44px; /* touch target */
}
.type-btn:hover:not(:disabled) { border-color: var(--primary-500); color: var(--neutral-100); }
.type-btn--active { border-color: var(--primary-400); background: var(--primary-700); color: var(--neutral-50); }
.type-btn--locked { opacity: 0.4; cursor: not-allowed; }
.type-btn:focus-visible { outline: 2px solid var(--primary-400); outline-offset: 2px; }
.type-row__locked-hint {
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-size: 0.73rem; color: var(--primary-500);
  padding-left: 0.25rem;
  white-space: nowrap;
}

/* ─── Result type badge ──────────────────────────────── */
.result-type-badge {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.3rem 0.75rem;
  background: color-mix(in srgb, var(--type-color) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--type-color) 30%, transparent);
  border-radius: 20px;
  font-size: 0.8rem; font-weight: 600;
  color: var(--type-color);
  flex-shrink: 0;
}
.result-type-badge svg { flex-shrink: 0; }

/* ─── Upload zone ────────────────────────────────────── */
.upload-zone {
  position: relative;
  border: 2px dashed var(--primary-600); border-radius: 16px;
  min-height: 240px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; overflow: hidden; transition: border-color .2s, background .2s;
}
.upload-zone:hover,
.upload-zone:focus-visible { border-color: var(--primary-400); background: rgba(99,149,238,.04); }
.upload-zone:focus-visible { outline: 2px solid var(--primary-400); outline-offset: 2px; }
.upload-zone--drag { border-color: var(--primary-300); background: rgba(99,149,238,.08); transform: scale(1.01); }
.upload-zone--preview { padding: 0; min-height: 280px; }

.upload-zone__img {
  width: 100%; max-height: 340px; object-fit: contain; border-radius: 14px;
}
.upload-zone__overlay {
  position: absolute; inset: 0;
  background: rgba(0,14,50,.82);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem;
  color: var(--neutral-50); border-radius: 14px;
}
.upload-zone__overlay strong { font-size: 1rem; }
.overlay-sub { font-size: 0.82rem; color: var(--primary-300); }

.upload-zone__hint {
  position: absolute; bottom: 0; left: 0; right: 0;
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  padding: 0.6rem; background: linear-gradient(transparent, rgba(0,14,50,.75));
  color: var(--primary-200); font-size: 0.82rem; border-radius: 0 0 14px 14px;
}
.upload-zone__body {
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  padding: 2rem 1.5rem; text-align: center;
}
.upload-zone__icon { color: var(--primary-400); margin-bottom: 0.25rem; }
.upload-zone__title { font-size: 1.05rem; font-weight: 600; color: var(--neutral-50); margin: 0; }
.upload-zone__sub   { font-size: 0.875rem; color: var(--primary-300); margin: 0; }
.upload-zone__hint-text { font-size: 0.78rem; color: var(--primary-500); margin: 0; }

.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}

/* ─── Error ──────────────────────────────────────────── */
.inline-error {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.25);
  border-radius: 10px; font-size: 0.875rem; color: #fca5a5;
}
.inline-error__close {
  margin-left: auto; background: none; border: none;
  color: inherit; cursor: pointer; padding: 0.2rem;
  border-radius: 4px; min-width: 28px; min-height: 28px;
  display: flex; align-items: center; justify-content: center;
}
.inline-error__close:hover { background: rgba(239,68,68,.15); }

/* ─── Results ────────────────────────────────────────── */
.results { display: flex; flex-direction: column; gap: 1.1rem; }
.results__head {
  display: flex; align-items: center; flex-wrap: wrap; gap: 0.65rem;
}
.results__head .results__status { flex: 1; min-width: 0; }
.results__head .results__actions { margin-left: auto; }
.results__status { display: flex; align-items: center; gap: 0.65rem; }
.results__status h3 { font-size: 1.05rem; font-weight: 600; color: var(--neutral-50); margin: 0; }
.results__status p  { font-size: 0.82rem; color: var(--primary-300); margin: 0; }
.results__actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.text-success { color: #4ade80; }

.btn-reset, .btn-dashboard {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.45rem 0.9rem; min-height: 44px;
  border-radius: 8px; color: var(--primary-100); font-size: 0.82rem;
  cursor: pointer; font-family: inherit; transition: all .15s; border: 1px solid;
}
.btn-reset {
  background: var(--primary-700); border-color: var(--primary-600);
}
.btn-reset:hover { background: var(--primary-600); }
.btn-dashboard {
  background: rgba(99,149,238,.12); border-color: var(--primary-600); color: var(--primary-200);
}
.btn-dashboard:hover { background: rgba(99,149,238,.2); border-color: var(--primary-500); color: var(--neutral-50); }
.btn-reset:focus-visible, .btn-dashboard:focus-visible { outline: 2px solid var(--primary-400); outline-offset: 2px; }

/* KPI cards */
.result-kpis {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.65rem;
}
.kpi {
  display: flex; align-items: flex-start; gap: 0.65rem;
  padding: 0.9rem 1rem;
  background: var(--primary-800); border: 1px solid var(--primary-700); border-radius: 12px;
}
.kpi__icon {
  width: 32px; height: 32px; flex-shrink: 0; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; margin-top: 0.05rem;
}
.kpi__icon--blue   { background: rgba(59,130,246,.18); color: #60a5fa; }
.kpi__icon--yellow { background: rgba(251,191,36,.18); color: #fbbf24; }
.kpi__icon--primary { background: rgba(37,79,159,.18); color: var(--primary-200); }
.kpi__icon--gray   { background: rgba(107,114,128,.18); color: #9ca3af; }
.kpi__icon--teal   { background: rgba(20,184,166,.18); color: #2dd4bf; }
.kpi__label { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: .05em; color: var(--primary-400); }
.kpi__val { display: block; font-size: 1.15rem; font-weight: 700; color: var(--neutral-50); margin-top: 0.1rem; }
.kpi__val--sm { font-size: 0.85rem; font-weight: 500; }

/* CUPS + Titular strip */
.id-strip {
  display: flex; flex-wrap: wrap; gap: 0.5rem;
}
.id-strip__item {
  display: inline-flex; align-items: center; gap: 0.35rem;
  background: var(--primary-800); border: 1px solid var(--primary-700);
  border-radius: 8px; padding: 0.35rem 0.75rem;
  font-size: 0.8rem; color: var(--primary-200);
}
.id-strip__item svg { color: var(--primary-400); flex-shrink: 0; }
.id-strip__label { color: var(--primary-400); }
.id-strip__val { color: var(--neutral-100); font-weight: 500; }
code.id-strip__val {
  font-family: 'Courier New', monospace; font-size: 0.78rem;
  letter-spacing: 0.03em; color: #60a5fa;
}

/* Breakdown */
.breakdown {
  background: var(--primary-800); border: 1px solid var(--primary-700);
  border-radius: 12px; padding: 1.1rem 1.25rem;
}
.breakdown__header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.5rem;
}
.breakdown__title {
  font-size: 0.9rem; font-weight: 600; color: var(--neutral-50); margin: 0;
}
.breakdown__edit-actions { display: flex; gap: 0.35rem; flex-wrap: wrap; }

/* Edit mode buttons */
.btn-edit, .btn-recalc, .btn-save, .btn-cancel-edit {
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.3rem 0.65rem; min-height: 32px;
  border-radius: 6px; font-size: 0.78rem; font-weight: 500;
  cursor: pointer; font-family: inherit; transition: all .15s; border: 1px solid;
}
.btn-edit {
  background: rgba(99,149,238,.1); border-color: var(--primary-600); color: var(--primary-200);
}
.btn-edit:hover { background: rgba(99,149,238,.18); border-color: var(--primary-500); }
.btn-recalc {
  background: rgba(251,191,36,.1); border-color: rgba(251,191,36,.3); color: #fbbf24;
}
.btn-recalc:hover { background: rgba(251,191,36,.18); }
.btn-save {
  background: rgba(74,222,128,.1); border-color: rgba(74,222,128,.3); color: #4ade80;
}
.btn-save:hover { background: rgba(74,222,128,.18); }
.btn-save:disabled { opacity: .5; cursor: not-allowed; }
.btn-cancel-edit {
  background: none; border-color: var(--primary-700); color: var(--primary-400);
  padding: 0.3rem 0.45rem;
}
.btn-cancel-edit:hover { border-color: var(--primary-500); color: var(--primary-200); }

/* Edit hint */
.edit-hint {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.78rem; color: #fbbf24;
  background: rgba(251,191,36,.07); border: 1px solid rgba(251,191,36,.2);
  border-radius: 8px; padding: 0.5rem 0.75rem; margin-bottom: 0.75rem;
}

/* Edit inputs inside breakdown */
.edit-input {
  width: 90px; padding: 0.2rem 0.45rem;
  background: var(--primary-900); border: 1px solid var(--primary-600);
  border-radius: 5px; color: var(--neutral-50); font-size: 0.875rem;
  font-family: inherit; transition: border-color .15s;
}
.edit-input:focus { outline: none; border-color: var(--primary-400); }
.edit-input--total { width: 110px; font-weight: 700; font-size: 1rem; color: #60a5fa; }
.edit-total { display: flex; align-items: center; gap: 0.35rem; color: #60a5fa; font-weight: 700; }
.breakdown__list {
  display: grid; grid-template-columns: 1fr auto;
  gap: 0; margin: 0; padding: 0;
}
.breakdown__list dt,
.breakdown__list dd {
  padding: 0.5rem 0; border-bottom: 1px solid var(--primary-700);
  font-size: 0.875rem; margin: 0;
}
.breakdown__list dt { color: var(--primary-200); }
.breakdown__list dd { color: var(--neutral-100); font-weight: 500; text-align: right; }
.breakdown__list .total-dt,
.breakdown__list .total-dd {
  border-bottom: none; border-top: 2px solid var(--primary-600);
  padding-top: 0.65rem; font-weight: 700; font-size: 1rem; color: var(--neutral-50);
}
.breakdown__list .total-dd { color: #60a5fa; }
.breakdown__list .section-dt {
  grid-column: 1 / -1; border-bottom: none;
  padding: 0.85rem 0 0.2rem;
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .07em; color: var(--primary-500);
}
.breakdown__list .section-dd { display: none; }
.breakdown__list .monospace { font-family: 'Courier New', monospace; font-size: 0.8rem; letter-spacing: .03em; }
.total-auto-hint { font-size: 0.65rem; font-weight: 400; color: var(--primary-500); margin-left: 0.25rem; }

/* Tips */
.tips {
  background: rgba(34,197,94,.07); border: 1px solid rgba(34,197,94,.18);
  border-radius: 12px; padding: 1.1rem 1.25rem;
}
.tips h4 {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.9rem; color: #86efac; margin: 0 0 0.65rem;
}
.tips ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.4rem; }
.tips li {
  display: flex; align-items: flex-start; gap: 0.4rem;
  font-size: 0.85rem; color: var(--primary-100); line-height: 1.4;
}
.tips li svg { flex-shrink: 0; color: #4ade80; margin-top: 0.15rem; }

/* OCR details */
.ocr-details {
  background: var(--primary-800); border: 1px solid var(--primary-700);
  border-radius: 10px; overflow: hidden;
}
.ocr-details summary {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.75rem 1rem; cursor: pointer;
  color: var(--primary-300); font-size: 0.82rem;
  list-style: none; min-height: 44px;
  transition: color .15s;
}
.ocr-details summary:hover { color: var(--primary-100); }
.ocr-details summary::-webkit-details-marker { display: none; }
.ocr-text {
  padding: 0.85rem 1rem; margin: 0;
  font-size: 0.78rem; color: var(--primary-300);
  white-space: pre-wrap; word-break: break-word;
  max-height: 280px; overflow-y: auto;
  border-top: 1px solid var(--primary-700);
  background: var(--primary-900);
}

/* ─── Animations ─────────────────────────────────────── */
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Responsive ─────────────────────────────────────── */
@media (max-width: 600px) {
  .type-row { flex-direction: column; }
  .type-btn { justify-content: center; }
  .result-kpis { grid-template-columns: 1fr 1fr; }
  .gate { padding: 2rem 1rem; }
  .plans-grid { grid-template-columns: 1fr; max-width: 340px; }
}

@media (prefers-reduced-motion: reduce) {
  .spin { animation: none; }
  .btn-gate--subscribe:hover,
  .btn-gate--primary:hover { transform: none; }
}
</style>

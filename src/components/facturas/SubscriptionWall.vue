<script setup>
import { ref, computed } from 'vue'
import { useStore } from '@nanostores/vue'
import { userProfile, isSubscribed, canScanFree, monthlyScansLeft, monthlyLimit, SCAN_LIMITS, currentSession } from '../../stores/authStore'
import { Lock, CheckCircle, Zap, Star, CreditCard, Shield, Sparkles, BarChart3, Loader } from 'lucide-vue-next'

const $profile = useStore(userProfile)
const $isSubscribed = useStore(isSubscribed)
const $canScanFree = useStore(canScanFree)
const $scansLeft = useStore(monthlyScansLeft)
const $monthlyLimit = useStore(monthlyLimit)
const $session = useStore(currentSession)

const subscribing = ref('')
const checkoutError = ref('')

const tierLabel = computed(() => {
  const tier = $profile.value?.subscription_tier
  if (tier === 'pro') return 'Plan Pro'
  if (tier === 'basico') return 'Plan Básico'
  return 'Plan'
})

async function handleSubscribe(tier) {
  if (!$session.value) return
  subscribing.value = tier
  checkoutError.value = ''
  try {
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${$session.value.access_token}`,
      },
      body: JSON.stringify({ tier }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      checkoutError.value = data.error || 'Error al iniciar el pago'
    }
  } catch {
    checkoutError.value = 'Error de conexión'
  } finally {
    subscribing.value = ''
  }
}
</script>

<template>
  <div class="subscription-wall">

    <!-- Suscripción activa -->
    <div v-if="$isSubscribed" class="sub-active">
      <CheckCircle :size="24" aria-hidden="true" />
      <div>
        <h3>{{ tierLabel }} activo</h3>
        <p>{{ $scansLeft }} de {{ $monthlyLimit }} escaneos disponibles este mes.</p>
      </div>
    </div>

    <!-- Escaneo gratuito disponible -->
    <div v-else-if="$canScanFree" class="sub-free">
      <Zap :size="18" aria-hidden="true" />
      <p>Tienes <strong>1 escaneo gratuito</strong> disponible. Después necesitarás una suscripción.</p>
    </div>

    <!-- Paywall: dos planes -->
    <div v-else class="paywall">
      <div class="paywall-header">
        <Lock :size="30" aria-hidden="true" />
        <h3>Elige tu plan</h3>
        <p>Has usado tu escaneo gratuito. Suscríbete para seguir analizando tus facturas con IA.</p>
      </div>

      <div class="plans-grid" role="list">

        <!-- Plan Básico -->
        <div class="plan-card" role="listitem">
          <div class="plan-name">Plan Básico</div>
          <div class="plan-price">
            <span class="price">4,99€</span>
            <span class="period">/mes</span>
          </div>
          <p class="plan-scans">
            <Zap :size="14" aria-hidden="true" />
            <strong>{{ SCAN_LIMITS.basico }} escaneos</strong>/mes
          </p>
          <ul class="plan-features" aria-label="Características Plan Básico">
            <li><CheckCircle :size="13" aria-hidden="true" /> Facturas luz, gas y otros</li>
            <li><CheckCircle :size="13" aria-hidden="true" /> Consejos de ahorro IA</li>
            <li><CheckCircle :size="13" aria-hidden="true" /> Historial y gráficos</li>
          </ul>
          <button class="btn-subscribe btn-subscribe--basico" @click="handleSubscribe('basico')" :disabled="!!subscribing">
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
            <span class="price">9,99€</span>
            <span class="period">/mes</span>
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
          <button class="btn-subscribe btn-subscribe--pro" @click="handleSubscribe('pro')" :disabled="!!subscribing">
            <Loader v-if="subscribing === 'pro'" :size="15" class="spin" aria-hidden="true" />
            <BarChart3 v-else :size="15" aria-hidden="true" />
            Suscribirse — 9,99 €/mes
          </button>
        </div>

      </div>

      <div v-if="checkoutError" class="checkout-error" role="alert">{{ checkoutError }}</div>

      <p class="pricing-note">
        <Shield :size="13" aria-hidden="true" />
        Cancela cuando quieras. Sin compromisos.
      </p>
    </div>
  </div>
</template>

<style scoped>
.subscription-wall { margin-top: 0.5rem; }

/* Active */
.sub-active {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(34,197,94,.1);
  border: 1px solid rgba(34,197,94,.25);
  border-radius: 12px;
}
.sub-active svg { color: #4ade80; flex-shrink: 0; }
.sub-active h3 { margin: 0; font-size: 1rem; color: #86efac; }
.sub-active p  { margin: 0.15rem 0 0; font-size: 0.85rem; color: var(--primary-200); }

/* Free */
.sub-free {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.65rem 1rem;
  background: rgba(59,130,246,.1);
  border: 1px solid rgba(59,130,246,.2);
  border-radius: 10px;
  font-size: 0.875rem; color: #93c5fd;
}
.sub-free svg { flex-shrink: 0; color: #60a5fa; }

/* Paywall */
.paywall { text-align: center; }

.paywall-header { margin-bottom: 1.25rem; }
.paywall-header svg { color: var(--primary-400); margin-bottom: 0.5rem; }
.paywall-header h3 { font-size: 1.2rem; font-weight: 700; color: var(--neutral-50); margin: 0.35rem 0; }
.paywall-header p  { font-size: 0.875rem; color: var(--primary-300); margin: 0; max-width: 420px; margin-inline: auto; }

/* Plans grid */
.plans-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  max-width: 560px;
  margin: 0 auto;
}

.plan-card {
  background: var(--primary-800);
  border: 1px solid var(--primary-700);
  border-radius: 14px; padding: 1.25rem;
  display: flex; flex-direction: column; gap: 0.65rem;
  text-align: left;
}
.plan-card--featured {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 1px var(--primary-500), 0 6px 20px rgba(0,0,0,.25);
}

.plan-badge {
  display: inline-flex; align-items: center; gap: 0.3rem;
  background: rgba(251,191,36,.15); color: #fbbf24;
  padding: 0.15rem 0.55rem; border-radius: 20px;
  font-size: 0.7rem; font-weight: 600;
  width: fit-content;
}

.plan-name {
  font-size: 0.75rem; font-weight: 600;
  color: var(--primary-300); text-transform: uppercase; letter-spacing: .05em;
}

.plan-price { display: flex; align-items: baseline; gap: 0.1rem; }
.price  { font-size: 1.85rem; font-weight: 800; color: var(--neutral-50); }
.period { font-size: 0.9rem; color: var(--primary-400); }

.plan-scans {
  display: flex; align-items: center; gap: 0.35rem;
  font-size: 0.82rem; color: var(--primary-200); margin: 0;
}
.plan-scans svg { color: #fbbf24; flex-shrink: 0; }
.plan-card--featured .plan-scans svg { color: #a78bfa; }

.plan-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.3rem; }
.plan-features li {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.78rem; color: var(--primary-200);
}
.plan-features li svg { color: #4ade80; flex-shrink: 0; }

.btn-subscribe {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  padding: 0.7rem 0.5rem; min-height: 44px;
  border: none; border-radius: 10px;
  font-size: 0.82rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s; font-family: inherit;
  color: var(--neutral-50);
}
.btn-subscribe--basico {
  background: var(--primary-600);
}
.btn-subscribe--basico:hover { background: var(--primary-500); transform: translateY(-1px); }
.btn-subscribe--pro {
  background: linear-gradient(135deg, hsl(250,60%,42%), hsl(220,58%,46%));
  box-shadow: 0 4px 12px rgba(99,74,233,.3);
}
.btn-subscribe--pro:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(99,74,233,.4); }

.pricing-note {
  display: flex; align-items: center; justify-content: center; gap: 0.35rem;
  margin-top: 0.85rem; font-size: 0.75rem; color: var(--primary-500);
}
.pricing-note svg { color: var(--primary-500); }

@media (max-width: 480px) {
  .plans-grid { grid-template-columns: 1fr; }
}

.checkout-error {
  font-size: 0.8rem; color: #fca5a5;
  background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.25);
  border-radius: 8px; padding: 0.5rem 0.75rem; text-align: center;
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  .btn-subscribe:hover { transform: none; }
  .spin { animation: none; }
}
</style>

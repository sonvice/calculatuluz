<template>
    <div v-if="show" class="cookie-overlay">
        <div class="cookie-modal">
            <!-- HEADER -->
            <header class="cookie-header">
                <h2>Centro de preferencia de la privacidad</h2>
                <button class="close-btn" @click="closeAll">×</button>
            </header>

            <!-- INTRO -->
            <section v-if="!inSettings" class="cookie-intro">
                <p>
                    Cuando visita cualquier sitio web, el mismo podría obtener o guardar información en su navegador,
                    generalmente mediante el uso de cookies. Esta información puede ser acerca de usted, sus
                    preferencias o su dispositivo, y se usa principalmente para que el sitio funcione según lo esperado
                    y ofrezca una experiencia personalizada.
                </p>
                <p>
                    Puede permitir todas las cookies o gestionar sus preferencias de forma individual.
                </p>
                <div class="mt-space-m d-flex">
                    <button class="btn" data-type="accent" @click="acceptAll">Permitirlas todas</button>
                    <button class="btn" @click="inSettings = true">Gestionar preferencias</button>
                </div>
            </section>

            <!-- SETTINGS -->
            <section v-else class="cookie-settings">
                <p class="cookie-text mb-space-m">
                    Haga clic sobre cada categoría para saber más y activar o desactivar según su criterio. El bloqueo
                    de ciertas cookies puede afectar la experiencia y algunos servicios.
                </p>

                <ul class="settings-list" role="list">
                    <li v-for="cat in categories" :key="cat.key" class="setting-item">
                        <div class="setting-summary">
                            <div @click="toggleCat(cat.key)">
                                <strong>{{ cat.label }}</strong><br>
                                <small>{{ cat.description }}</small>
                            </div>
                            <button class="toggle-btn" :aria-pressed="cat.enabled.toString()" data-on="On"
                                data-off="Off" @click="toggleCat(cat.key)"></button>
                        </div>
                        <p v-if="expanded === cat.key" class="setting-detail">{{ cat.detail }}</p>
                    </li>

                </ul>

                <div class="mt-space-m d-flex">
                    <button class="btn" @click="inSettings = false">Volver</button>
                    <button class="btn" data-type="accent" @click="confirmSettings">Confirmar mis preferencias</button>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const show = ref(false)
const inSettings = ref(false)
const expanded = ref(null)

const categories = reactive([
    {
        key: 'necessary',
        label: 'Cookies estrictamente necesarias',
        description: 'Activas siempre',
        detail: 'Estas cookies son imprescindibles para que el sitio funcione y no se pueden desactivar.',
        enabled: true
    },
    {
        key: 'performance',
        label: 'Cookies de rendimiento',
        description: 'Mejoran la velocidad y fiabilidad',
        detail: 'Recogen datos anónimos sobre cómo navega para optimizar tiempos de carga.',
        enabled: false
    },
    {
        key: 'functionality',
        label: 'Cookies de funcionalidad',
        description: 'Personalizan su experiencia',
        detail: 'Permiten recordar elecciones como idioma o región.',
        enabled: false
    },
    {
        key: 'targeting',
        label: 'Cookies dirigidas',
        description: 'Publicidad relevante',
        detail: 'Utilizadas para mostrar anuncios adaptados a sus intereses.',
        enabled: false
    }
])

onMounted(() => {
    const saved = JSON.parse(localStorage.getItem('cookie-consent') || '{}')
    if (!saved.timestamp) {
        show.value = true
    } else {
        // aplicar guardado
        Object.entries(saved.prefs || {}).forEach(([k, v]) => {
            const c = categories.find(x => x.key === k)
            if (c && k !== 'necessary') c.enabled = v
        })
        if (saved.prefs?.all) enableMarketing()
    }
})

function acceptAll() {
    categories.forEach(c => c.enabled = true)
    saveConsent(true)
    enableMarketing()
    show.value = false
}

function confirmSettings() {
    saveConsent(false)
    if (getConsent().all) enableMarketing()
    show.value = false
}

function toggleCat(key) {
    if (key === 'necessary') return
    const c = categories.find(x => x.key === key)
    c.enabled = !c.enabled
    expanded.value = expanded.value === key ? null : key
}

function saveConsent(isAll) {
    const prefs = {}
    categories.forEach(c => { prefs[c.key] = c.enabled })
    if (isAll) prefs.all = true
    localStorage.setItem('cookie-consent', JSON.stringify({
        prefs,
        timestamp: Date.now()
    }))
}

function getConsent() {
    return JSON.parse(localStorage.getItem('cookie-consent') || '{}').prefs || {}
}

function enableMarketing() {
    // inyecta scripts si performance, functionality o targeting están activos
    const prefs = getConsent()
    if (prefs.performance || prefs.targeting) {
        // ejemplo analytics
        const s = document.createElement('script')
        s.src = 'https://www.googletagmanager.com/gtag/js?id=G-0043X23930'
        s.async = true
        document.head.appendChild(s)
        window.dataLayer = window.dataLayer || []
        function gtag() { dataLayer.push(arguments) }
        gtag('js', new Date())
        gtag('config', 'TU_ID')
    }
    if (prefs.targeting) {
        // aquí tu script de publicidad
    }
}

function closeAll() {
    show.value = false
}
</script>

<style scoped>
.cookie-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.cookie-modal {
    background: var(--neutral-50);
    width: 90%;
    max-width: 33rem;
    border-radius: var(--rounded-md);
    padding: var(--space-l);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.cookie-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-m);
}


.close-btn {
    background: none;
    border: none;
    font-size: var(--size-2);
    cursor: pointer;
    color: var(--neutral-600);
}

.cookie-intro p {
    margin-bottom: var(--space-s);
    color: var(--neutral-700);
    font-size: var(--size-0);
    line-height: 1.5;
}

.cookie-settings .setting-item+.setting-item {
    margin-top: var(--space-m);
}

.setting-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
}

.setting-summary small {
    color: var(--neutral-500);
}

/* CONTENEDOR DEL TOGGLE */
.toggle-btn {
  position: relative;
  width: 3rem;
  height: 1.5rem;
  background: var(--neutral-300);
  border-radius: var(--rounded-full);
  border: none;
  cursor: pointer;
  transition: background 0.3s ease;
  flex-shrink: 0;
}

/* CÍRCULO INTERIOR */
.toggle-btn::before {
  content: '';
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  width: 1.25rem;
  height: 1.25rem;
  background: var(--neutral-50);
  border-radius: var(--rounded-full);
  transition: transform 0.3s ease;
}

/* ESTADO ACTIVADO */
.toggle-btn[aria-pressed="true"] {
  background: var(--primary-500);
}
.toggle-btn[aria-pressed="true"]::before {
  transform: translateX(1.5rem);
}

/* ETIQUETAS SUTILES ON/OFF */
.toggle-btn::after {
  content: attr(data-off);
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--size--1);
  color: var(--neutral-600);
  opacity: 1;
  transition: opacity 0.3s;
}
.toggle-btn[aria-pressed="true"]::after {
  content: attr(data-on);
  left: 0.5rem;
  right: auto;
  color: var(--neutral-50);
}

.setting-detail {
    margin-top: var(--space-xs);
    color: var(--neutral-600);
    font-size: var(--size--1);
    line-height: 1.4;
}


.btn-primary {
    background: var(--orange-500);
    color: var(--neutral-50);
}

.btn-primary:hover {
    background: var(--orange-600);
}

.btn-secondary {
    background: var(--neutral-100);
    color: var(--neutral-800);
}

.btn-secondary:hover {
    background: var(--neutral-200);
}

.btn-tertiary {
    background: none;
    color: var(--neutral-800);
    text-decoration: underline;
}

.flex-space-between {
    display: flex;
    justify-content: space-between;
}
</style>

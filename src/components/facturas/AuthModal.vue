<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from '@nanostores/vue'
import {
  currentUser, authLoading, authError,
  signIn, signUp, signOut, initAuth
} from '../../stores/authStore'
import { LogIn, UserPlus, LogOut, Mail, Lock, User, X, Eye, EyeOff } from 'lucide-vue-next'
import { isDisposableEmail, isValidEmailFormat } from '../../lib/disposableEmailDomains'

const $user = useStore(currentUser)
const $loading = useStore(authLoading)
const $error = useStore(authError)

const showModal = ref(false)
const mode = ref('login') // 'login' | 'register'
const showPassword = ref(false)
const successMessage = ref('')
const validationError = ref('')

// Honeypot: campo oculto que solo los bots rellenan
const honeypot = ref('')
// Timestamp de cuando se abrió el modal (bots son demasiado rápidos)
const openedAt = ref(0)

const form = ref({
  email: '',
  password: '',
  fullName: ''
})

const formValid = computed(() => {
  if (!form.value.email || !form.value.password) return false
  if (mode.value === 'register' && !form.value.fullName) return false
  if (form.value.password.length < 8) return false
  if (!isValidEmailFormat(form.value.email)) return false
  return true
})

function openModal(m = 'login') {
  mode.value = m
  showModal.value = true
  successMessage.value = ''
  validationError.value = ''
  honeypot.value = ''
  openedAt.value = Date.now()
  form.value = { email: '', password: '', fullName: '' }
}

function closeModal() {
  showModal.value = false
  successMessage.value = ''
}

async function handleSubmit() {
  if (!formValid.value) return
  successMessage.value = ''
  validationError.value = ''

  // ── Anti-bot: honeypot relleno = bot
  if (honeypot.value) return

  // ── Anti-bot: envío en menos de 1,5 s = bot
  if (Date.now() - openedAt.value < 1500) return

  // ── Registro: bloquear emails desechables
  if (mode.value === 'register') {
    if (isDisposableEmail(form.value.email)) {
      validationError.value = 'No se permiten emails temporales. Usa tu email real.'
      return
    }
  }

  if (mode.value === 'login') {
    const result = await signIn(form.value.email, form.value.password)
    if (result) {
      closeModal()
    }
  } else {
    const result = await signUp(form.value.email, form.value.password, form.value.fullName)
    if (result) {
      if (result.user && !result.session) {
        successMessage.value = 'Revisa tu email para confirmar tu cuenta'
      } else {
        closeModal()
      }
    }
  }
}

async function handleLogout() {
  await signOut()
}

onMounted(() => {
  initAuth()
  // Escuchar eventos cross-island (desde InvoiceScanner u otros componentes)
  document.addEventListener('open-auth-modal', (e) => {
    openModal(e.detail?.mode || 'login')
  })
})

defineExpose({ openModal })
</script>

<template>
<div class="auth-root">
  <!-- User button -->
  <div class="auth-buttons">
    <template v-if="$user">
      <div class="user-info">
        <span class="user-email">{{ $user.email }}</span>
        <button class="btn-auth btn-auth--outline" @click="handleLogout">
          <LogOut :size="16" />
          Salir
        </button>
      </div>
    </template>
    <template v-else>
      <button class="btn-auth btn-auth--primary" @click="openModal('login')">
        <LogIn :size="16" />
        Iniciar sesion
      </button>
      <button class="btn-auth btn-auth--outline" @click="openModal('register')">
        <UserPlus :size="16" />
        Registrarse
      </button>
    </template>
  </div>

  <!-- Modal Overlay -->
  <Teleport to="body">
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <!-- Header -->
        <div class="modal-header">
          <h2>{{ mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta' }}</h2>
          <button class="modal-close" @click="closeModal" aria-label="Cerrar">
            <X :size="20" />
          </button>
        </div>

        <!-- Body -->
        <form class="modal-body" @submit.prevent="handleSubmit" autocomplete="off">
          <!-- Honeypot: oculto para humanos, visible para bots -->
          <div class="hp-trap" aria-hidden="true">
            <input v-model="honeypot" type="text" name="website" tabindex="-1" autocomplete="off" />
          </div>

          <!-- Error de validación -->
          <div v-if="validationError" class="alert alert--error" role="alert">
            {{ validationError }}
          </div>

          <!-- Error de auth -->
          <div v-if="$error" class="alert alert--error" role="alert">
            {{ $error }}
          </div>

          <!-- Success -->
          <div v-if="successMessage" class="alert alert--success" role="status">
            {{ successMessage }}
          </div>

          <!-- Name (solo registro) -->
          <div v-if="mode === 'register'" class="form-group">
            <label for="auth-name">Nombre completo</label>
            <div class="input-wrapper">
              <User :size="18" class="input-icon" />
              <input
                id="auth-name"
                v-model="form.fullName"
                type="text"
                placeholder="Tu nombre"
                required
                autocomplete="name"
              />
            </div>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="auth-email">Email</label>
            <div class="input-wrapper">
              <Mail :size="18" class="input-icon" />
              <input
                id="auth-email"
                v-model="form.email"
                type="email"
                placeholder="tu@email.com"
                required
                autocomplete="email"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="form-group">
            <label for="auth-password">Contrasena</label>
            <div class="input-wrapper">
              <Lock :size="18" class="input-icon" />
              <input
                id="auth-password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Mínimo 8 caracteres"
                required
                minlength="8"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'"
              >
                <EyeOff v-if="showPassword" :size="18" />
                <Eye v-else :size="18" />
              </button>
            </div>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="btn-submit"
            :disabled="!formValid || $loading"
          >
            <span v-if="$loading" class="spinner"></span>
            <template v-else>
              {{ mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta' }}
            </template>
          </button>

          <!-- Toggle mode -->
          <p class="toggle-mode">
            <template v-if="mode === 'login'">
              ¿No tienes cuenta?
              <button type="button" @click="mode = 'register'; successMessage = ''">
                Registrate
              </button>
            </template>
            <template v-else>
              ¿Ya tienes cuenta?
              <button type="button" @click="mode = 'login'; successMessage = ''">
                Inicia sesion
              </button>
            </template>
          </p>
        </form>
      </div>
    </div>
  </Teleport>
</div>
</template>

<style scoped>
/* Wrapper transparente — necesario para nodo raíz único sin romper layout */
.auth-root { display: contents; }

/* Honeypot: completamente invisible */
.hp-trap {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

/* Auth Buttons */
.auth-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-email {
  font-size: 0.85rem;
  color: var(--primary-200);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-auth {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-family: inherit;
}

.btn-auth--primary {
  background: var(--primary-500);
  color: var(--neutral-50);
}

.btn-auth--primary:hover {
  background: var(--primary-400);
}

.btn-auth--outline {
  background: transparent;
  color: var(--primary-100);
  border: 1px solid var(--primary-600);
}

.btn-auth--outline:hover {
  background: var(--primary-800);
  border-color: var(--primary-500);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: var(--primary-900);
  border: 1px solid var(--primary-700);
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  animation: modalIn 0.2s ease-out;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--primary-800);
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--neutral-50);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: var(--primary-300);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  transition: all 0.15s;
}

.modal-close:hover {
  background: var(--primary-800);
  color: var(--neutral-50);
}

/* Form */
.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--primary-200);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 0.75rem;
  color: var(--primary-400);
  pointer-events: none;
}

.input-wrapper input {
  width: 100%;
  padding: 0.65rem 0.75rem 0.65rem 2.5rem;
  background: var(--primary-800);
  border: 1px solid var(--primary-700);
  border-radius: 8px;
  color: var(--neutral-50);
  font-size: 0.95rem;
  font-family: inherit;
  transition: border-color 0.15s;
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--primary-400);
  box-shadow: 0 0 0 3px rgba(99, 149, 238, 0.15);
}

.input-wrapper input::placeholder {
  color: var(--primary-500);
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: var(--primary-400);
  cursor: pointer;
  padding: 0.25rem;
}

.password-toggle:hover {
  color: var(--primary-200);
}

/* Submit */
.btn-submit {
  width: 100%;
  padding: 0.75rem;
  background: var(--primary-500);
  color: var(--neutral-50);
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  margin-top: 0.25rem;
}

.btn-submit:hover:not(:disabled) {
  background: var(--primary-400);
  transform: translateY(-1px);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Alerts */
.alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
}

.alert--error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.alert--success {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #86efac;
}

/* Toggle mode */
.toggle-mode {
  text-align: center;
  font-size: 0.85rem;
  color: var(--primary-300);
  margin: 0;
}

.toggle-mode button {
  background: none;
  border: none;
  color: var(--primary-200);
  cursor: pointer;
  font-weight: 600;
  text-decoration: underline;
  font-family: inherit;
  font-size: inherit;
}

.toggle-mode button:hover {
  color: var(--neutral-50);
}

@media (max-width: 480px) {
  .modal-container {
    max-width: 100%;
    margin: 0.5rem;
  }

  .auth-buttons {
    gap: 0.35rem;
  }

  .btn-auth {
    padding: 0.4rem 0.7rem;
    font-size: 0.8rem;
  }
}
</style>

<script setup>
import { ref, onMounted } from 'vue'
import { useStore } from '@nanostores/vue'
import { currentUser, authError, signIn, signUp, signOut, initAuth } from '../../stores/authStore'
import { LogIn, UserPlus, LogOut, Mail, Lock, User, X, Eye, EyeOff } from 'lucide-vue-next'
import { isDisposableEmail, isValidEmailFormat } from '../../lib/disposableEmailDomains'

const $user = useStore(currentUser)
const $error = useStore(authError)

const showModal  = ref(false)
const mode       = ref('login')
const showPassword = ref(false)
const successMessage = ref('')
const errorMessage   = ref('')
const submitting     = ref(false)
const honeypot       = ref('')
const openedAt       = ref(0)

const form = ref({ email: '', password: '', fullName: '' })

// Traduce errores de Supabase al español
function translateError(msg) {
  if (!msg) return 'Error desconocido. Inténtalo de nuevo.'
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials') || m.includes('invalid email or password'))
    return 'Email o contraseña incorrectos.'
  if (m.includes('email not confirmed'))
    return 'Debes confirmar tu email antes de entrar. Revisa tu bandeja de entrada.'
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'Ya existe una cuenta con ese email. Inicia sesión.'
  if (m.includes('password should be at least'))
    return 'La contraseña debe tener al menos 8 caracteres.'
  if (m.includes('rate limit') || m.includes('too many requests'))
    return 'Demasiados intentos. Espera unos minutos.'
  if (m.includes('network') || m.includes('fetch') || m.includes('failed'))
    return 'Error de conexión. Comprueba tu internet e inténtalo de nuevo.'
  return msg
}

function openModal(m = 'login') {
  mode.value = m
  showModal.value = true
  successMessage.value = ''
  errorMessage.value = ''
  honeypot.value = ''
  openedAt.value = Date.now()
  form.value = { email: '', password: '', fullName: '' }
  authError.set(null)
}

function closeModal() {
  showModal.value = false
  successMessage.value = ''
  errorMessage.value = ''
}

// Lee valores del DOM directamente para capturar autocompletado de móvil
function syncFormFromDOM() {
  const emailEl    = document.getElementById('auth-email')
  const passEl     = document.getElementById('auth-password')
  const nameEl     = document.getElementById('auth-name')
  if (emailEl?.value)   form.value.email    = emailEl.value
  if (passEl?.value)    form.value.password = passEl.value
  if (nameEl?.value)    form.value.fullName = nameEl.value
}

function validate() {
  const { email, password, fullName } = form.value
  if (!email.trim())    return 'Introduce tu email.'
  if (!isValidEmailFormat(email)) return 'El email no tiene un formato válido.'
  if (!password)        return 'Introduce tu contraseña.'
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (mode.value === 'register' && !fullName.trim()) return 'Introduce tu nombre.'
  return null
}

async function handleSubmit() {
  // 1. Sincronizar valores del DOM (crucial para autocompletado en móvil)
  syncFormFromDOM()

  successMessage.value = ''
  errorMessage.value   = ''
  authError.set(null)

  // Anti-bot honeypot
  if (honeypot.value) return

  // Validación con feedback
  const validErr = validate()
  if (validErr) {
    errorMessage.value = validErr
    return
  }

  if (mode.value === 'register') {
    if (Date.now() - openedAt.value < 1500) {
      errorMessage.value = 'Por favor, inténtalo de nuevo.'
      return
    }
    if (isDisposableEmail(form.value.email)) {
      errorMessage.value = 'No se permiten emails temporales. Usa tu email real.'
      return
    }
  }

  submitting.value = true
  try {
    if (mode.value === 'login') {
      const result = await signIn(form.value.email, form.value.password)
      if (result) {
        closeModal()
      } else {
        // signIn devuelve null cuando hay error → el error está en authError store
        errorMessage.value = translateError($error.value)
      }
    } else {
      const result = await signUp(form.value.email, form.value.password, form.value.fullName)
      if (result) {
        if (result.user && !result.session) {
          successMessage.value = 'Revisa tu email para confirmar tu cuenta.'
        } else {
          closeModal()
        }
      } else {
        errorMessage.value = translateError($error.value)
      }
    }
  } catch (e) {
    errorMessage.value = 'Error de conexión. Comprueba tu internet e inténtalo de nuevo.'
  } finally {
    submitting.value = false
  }
}

async function handleLogout() {
  await signOut()
}

onMounted(() => {
  initAuth()
  document.addEventListener('open-auth-modal', (e) => {
    openModal(e.detail?.mode || 'login')
  })
})

defineExpose({ openModal })
</script>

<template>
<div class="auth-root">
  <!-- Botones de sesión -->
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
        Iniciar sesión
      </button>
      <button class="btn-auth btn-auth--outline" @click="openModal('register')">
        <UserPlus :size="16" />
        Registrarse
      </button>
    </template>
  </div>

  <!-- Modal -->
  <Teleport to="body">
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container" role="dialog" aria-modal="true" :aria-label="mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'">

        <!-- Header -->
        <div class="modal-header">
          <h2>{{ mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta' }}</h2>
          <button class="modal-close" @click="closeModal" aria-label="Cerrar">
            <X :size="20" />
          </button>
        </div>

        <!-- Body -->
        <form class="modal-body" @submit.prevent="handleSubmit" novalidate>
          <!-- Honeypot anti-bot -->
          <div class="hp-trap" aria-hidden="true">
            <input v-model="honeypot" type="text" name="website" tabindex="-1" autocomplete="off" />
          </div>

          <!-- Error -->
          <div v-if="errorMessage || $error" class="alert alert--error" role="alert">
            {{ errorMessage || translateError($error) }}
          </div>

          <!-- Éxito -->
          <div v-if="successMessage" class="alert alert--success" role="status">
            {{ successMessage }}
          </div>

          <!-- Nombre (solo registro) -->
          <div v-if="mode === 'register'" class="form-group">
            <label for="auth-name">Nombre completo</label>
            <div class="input-wrapper">
              <User :size="18" class="input-icon" />
              <input
                id="auth-name"
                v-model="form.fullName"
                @change="form.fullName = $event.target.value"
                type="text"
                placeholder="Tu nombre"
                autocomplete="name"
                inputmode="text"
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
                @change="form.email = $event.target.value"
                type="email"
                placeholder="tu@email.com"
                autocomplete="email"
                inputmode="email"
              />
            </div>
          </div>

          <!-- Contraseña -->
          <div class="form-group">
            <label for="auth-password">Contraseña</label>
            <div class="input-wrapper">
              <Lock :size="18" class="input-icon" />
              <input
                id="auth-password"
                v-model="form.password"
                @change="form.password = $event.target.value"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Mínimo 8 caracteres"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                <EyeOff v-if="showPassword" :size="18" />
                <Eye v-else :size="18" />
              </button>
            </div>
          </div>

          <!-- Submit -->
          <button type="submit" class="btn-submit" :disabled="submitting">
            <span v-if="submitting" class="spinner"></span>
            <template v-else>
              {{ mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta' }}
            </template>
          </button>

          <!-- Cambiar modo -->
          <p class="toggle-mode">
            <template v-if="mode === 'login'">
              ¿No tienes cuenta?
              <button type="button" @click="mode = 'register'; errorMessage = ''">Regístrate</button>
            </template>
            <template v-else>
              ¿Ya tienes cuenta?
              <button type="button" @click="mode = 'login'; errorMessage = ''">Inicia sesión</button>
            </template>
          </p>
        </form>
      </div>
    </div>
  </Teleport>
</div>
</template>

<style scoped>
.auth-root { display: contents; }

.hp-trap {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

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

.btn-auth--primary { background: var(--primary-500); color: var(--neutral-50); }
.btn-auth--primary:hover { background: var(--primary-400); }
.btn-auth--outline { background: transparent; color: var(--primary-100); border: 1px solid var(--primary-600); }
.btn-auth--outline:hover { background: var(--primary-800); border-color: var(--primary-500); }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

/* Blur via pseudo-elemento — no bloquea touch en Android/MIUI */
.modal-overlay::before {
  content: '';
  position: fixed;
  inset: 0;
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  pointer-events: none;
  z-index: -1;
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
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
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
  padding: 0.4rem;
  border-radius: 6px;
  transition: all 0.15s;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover { background: var(--primary-800); color: var(--neutral-50); }

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
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  background: var(--primary-800);
  border: 1px solid var(--primary-700);
  border-radius: 8px;
  color: var(--neutral-50);
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.15s;
  min-height: 48px;
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--primary-400);
  box-shadow: 0 0 0 3px rgba(99, 149, 238, 0.15);
}

.input-wrapper input::placeholder { color: var(--primary-500); }

.password-toggle {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  color: var(--primary-400);
  cursor: pointer;
  padding: 0.5rem;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.password-toggle:hover { color: var(--primary-200); }

.btn-submit {
  width: 100%;
  padding: 0.85rem;
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
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-submit:hover:not(:disabled) {
  background: var(--primary-400);
  transform: translateY(-1px);
}

.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  line-height: 1.5;
}

.alert--error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.alert--success {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #86efac;
}

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
  padding: 0.25rem;
}

.toggle-mode button:hover { color: var(--neutral-50); }

@media (max-width: 480px) {
  .modal-overlay {
    align-items: flex-end;
    padding: 0;
  }

  .modal-container {
    max-width: 100%;
    border-radius: 16px 16px 0 0;
    max-height: 92dvh;
    overflow-y: auto;
  }

  .auth-buttons { gap: 0.35rem; }

  .btn-auth {
    padding: 0.45rem 0.75rem;
    font-size: 0.8rem;
  }
}
</style>

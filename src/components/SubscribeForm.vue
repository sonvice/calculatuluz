<template>
  <div class="subscribe-container">
    <form v-if="!success" @submit.prevent="handleSubmit" class="form-wrapper">
      <div class="form-group d-flex">

        <div class="visually-hidden" aria-hidden="true">
        <input 
          type="text" 
          name="website_url_trap" 
          v-model="honeypot" 
          tabindex="-1" 
          autocomplete="off"
        />
      </div>
        <input
          id="email"
          v-model.trim="email"
          type="email"
          required
          placeholder="tucorreo@ejemplo.com"
          :disabled="loading"
          class="input-email"
        />
        <button type="submit" data-type="accent" class="btn" :disabled="loading">
          {{ loading ? 'Enviando...' : 'Suscribirme' }}
        </button>
      </div>

      <div class="form-group terms">
        <label class="checkbox-label">
          <input
            v-model="acceptedTerms"
            type="checkbox"
            required
            :disabled="loading"
          />
          <span class="text-neutral-300 text-size--1">
             Acepto la <a href="/privacidad" class="link">Política de Privacidad</a>
          </span>
        </label>
      </div>

      <div v-if="error" class="error-msg fade-in">
        ⚠️ {{ error }}
      </div>
    </form>

    <div v-else class="success-msg fade-in">
      <div class="icon-check">✓</div>
      <h3 class="text-neutral-50 fw-700">¡Correo enviado!</h3>
      <p class="text-neutral-200 mt-space-xs">
        Hemos enviado un enlace de confirmación a <strong>{{ email }}</strong>.
        Revisa tu bandeja de entrada (y spam).
      </p>
      <button @click="resetForm" class="btn-link mt-space-m">Volver</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const honeypot = ref('');
const email = ref('');
const acceptedTerms = ref(false);
const loading = ref(false);
const error = ref(null);
const success = ref(false);

const handleSubmit = async () => {
  error.value = null;
  loading.value = true;

  try {
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value,trap: honeypot.value })
    });

    const result = await response.json();

    if (!response.ok) {
      // Ahora sí capturamos el mensaje de error del backend (Resend)
      throw new Error(result.error || 'Error al suscribirse');
    }
    
    // Si llegamos aquí, Resend devolvió éxito de verdad
    success.value = true;

  } catch (err) {
    console.error(err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  email.value = '';
  acceptedTerms.value = false;
  success.value = false;
  error.value = null;
};
</script>

<style scoped>
.form-group { margin-bottom: 1rem; }
.d-flex { display: flex; gap: 8px; }
.input-email { flex: 3; padding: 10px; border-radius: 4px; border: 1px solid #ccc; }
.btn { flex: 1; display: flex; justify-content: center; align-items: center; cursor: pointer; }
.btn:disabled { opacity: 0.7; cursor: wait; }

.terms { margin-top: 0.5rem; }
.checkbox-label { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.link { color: var(--neutral-200); text-decoration: underline; }

.error-msg { 
  color: #ef4444; 
  background: rgba(239, 68, 68, 0.1); 
  padding: 8px; 
  border-radius: 4px; 
  font-size: 0.9rem; 
  margin-top: 10px;
}

/* Success State */
.success-msg {
  text-align: center;
  padding: 20px;
  background: var(--primary-800);
  border: 1px solid var(--accent-500);
  border-radius: 8px;

  h3{
    display: block;
  }
}
.icon-check {
  background: var(--accent-500);
  color: white;
  width: 40px; height: 40px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem;
  margin: 0 auto 10px;
}
.btn-link {
  background: none; border: none; color: var(--neutral-400); 
  text-decoration: underline; cursor: pointer;
}
.fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
</style>
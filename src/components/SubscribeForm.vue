<template>
  <form @submit.prevent="handleSubmit">
    <div class="form-group">
      <label for="email">Correo electrónico:</label>
      <input
        id="email"
        v-model.trim="email"
        type="email"
        required
        placeholder="tucorreo@ejemplo.com"
      />
    </div>

    <div class="form-group terms">
      <label>
        <input
          v-model="acceptedTerms"
          type="checkbox"
          required
        />
        Acepto la <a href="/privacidad">Política de Privacidad</a>
      </label>
    </div>

    <button type="submit" :disabled="loading">
      {{ loading ? 'Enviando...' : 'Suscribirme' }}
    </button>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </form>
</template>

<script setup>
import { ref } from 'vue';

const email = ref('');
const acceptedTerms = ref(false);
const loading = ref(false);
const error = ref(null);

const handleSubmit = async () => {
  error.value = null;
  loading.value = true;

  try {
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value })
    });

    if (!response.ok) throw new Error('Error en la suscripción');
    
    alert('¡Revisa tu correo para confirmar!');
    email.value = '';
    acceptedTerms.value = false;
  } catch (err) {
    error.value = 'Hubo un error al procesar tu suscripción. Intenta nuevamente.';
    console.error('Error:', err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
}

input[type="email"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.terms {
  margin: 1rem 0;
}

button {
  background: #4CAF50;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: #ff4444;
  margin-top: 1rem;
}
</style>
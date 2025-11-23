<script setup>
import { ref } from 'vue'
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-vue-next'

const isOpen = ref(false)
const config = ref({
  title: '',
  message: '',
  type: 'confirm', // 'confirm' | 'alert' | 'success' | 'error'
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  onConfirm: null,
  onCancel: null
})

const typeConfig = {
  confirm: {
    icon: AlertTriangle,
    color: '#f4b860',
    bg: 'rgba(244, 184, 96, 0.1)'
  },
  alert: {
    icon: Info,
    color: '#4a7ba7',
    bg: 'rgba(74, 123, 167, 0.1)'
  },
  success: {
    icon: CheckCircle,
    color: '#5fd4a7',
    bg: 'rgba(95, 212, 167, 0.1)'
  },
  error: {
    icon: AlertTriangle,
    color: '#ff6b6b',
    bg: 'rgba(255, 107, 107, 0.1)'
  }
}

function open(options) {
  config.value = {
    title: options.title || '¿Estás seguro?',
    message: options.message || '',
    type: options.type || 'confirm',
    confirmText: options.confirmText || 'Confirmar',
    cancelText: options.cancelText || 'Cancelar',
    onConfirm: options.onConfirm || null,
    onCancel: options.onCancel || null
  }
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

function handleConfirm() {
  if (config.value.onConfirm) {
    config.value.onConfirm()
  }
  close()
}

function handleCancel() {
  if (config.value.onCancel) {
    config.value.onCancel()
  }
  close()
}

// Exponer métodos para uso externo
defineExpose({
  open,
  close
})
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="isOpen" class="confirm-overlay" @click.self="handleCancel">
        <div class="confirm-dialog">
          <button class="btn-close" @click="handleCancel">
            <X :size="20" />
          </button>

          <div class="dialog-header">
            <div 
              class="icon-container"
              :style="{ 
                backgroundColor: typeConfig[config.type].bg,
                color: typeConfig[config.type].color
              }"
            >
              <component 
                :is="typeConfig[config.type].icon" 
                :size="32"
              />
            </div>
            <h3 class="dialog-title">{{ config.title }}</h3>
          </div>

          <div class="dialog-body">
            <p class="dialog-message">{{ config.message }}</p>
          </div>

          <div class="dialog-actions d-flex">
            <button 
              v-if="config.type !== 'alert'"
              class="btn" 
              @click="handleCancel"
            >
              {{ config.cancelText }}
            </button>
            <button 
              class="btn"
              data-type="accent"
              :class="`btn-${config.type}`"
              @click="handleConfirm"
            >
              {{ config.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.confirm-dialog {
  background: linear-gradient(135deg, #1a2332 0%, #0d1b2a 100%);
  border-radius: 16px;
  border: 1px solid rgba(168, 197, 228, 0.2);
  max-width: 450px;
  width: 100%;
  padding: 32px 24px 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  position: relative;
}

.btn-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  color: #a8c5e4;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: rgba(255, 107, 107, 0.2);
  color: #ff9999;
}

.dialog-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.icon-container {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.dialog-title {
  margin: 0;
  color: #e8f1ff;
  font-size: 1.25rem;
  font-weight: 700;
  text-align: center;
}

.dialog-body {
  margin-bottom: 24px;
}

.dialog-message {
  margin: 0;
  color: #c8dff5;
  font-size: 0.95rem;
  line-height: 1.6;
  text-align: center;
}

.dialog-actions {
--horizontal-alignment:center;
  & .btn{
    flex-grow: 1;
    display: flex;
    justify-content: center;
  }
}


.btn-cancel {
  background: rgba(74, 123, 167, 0.1);
  color: #c8dff5;
  border: 1px solid rgba(74, 123, 167, 0.3);
}

.btn-cancel:hover {
  background: rgba(74, 123, 167, 0.2);
  border-color: rgba(74, 123, 167, 0.5);
}


.btn-alert {
  background: linear-gradient(135deg, #4a7ba7 0%, #5a8bb7 100%);
  color: #fff;
}

.btn-alert:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 123, 167, 0.3);
}

/* Transiciones del modal */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .confirm-dialog,
.modal-leave-active .confirm-dialog {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .confirm-dialog {
  transform: scale(0.9) translateY(-20px);
  opacity: 0;
}

.modal-leave-to .confirm-dialog {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}

@media (max-width: 768px) {
  .confirm-dialog {
    max-width: 100%;
    margin: 0 16px;
  }
  
  .dialog-actions {
    flex-direction: column;
  }
}
</style>
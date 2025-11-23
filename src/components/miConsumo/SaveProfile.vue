<script setup>
import { ref } from 'vue'
import { profile, appliances } from '../../stores/consumptionStore'
import { Download, Upload, Trash2, HardDrive, FileUp } from 'lucide-vue-next'
import ConfirmDialog from './ConfirmDialog.vue'

const confirmDialog = ref(null)
const showMessage = ref(false)
const messageText = ref('')
const messageType = ref('success') // 'success' | 'error'

function showNotification(text, type = 'success') {
  messageText.value = text
  messageType.value = type
  showMessage.value = true
  
  setTimeout(() => {
    showMessage.value = false
  }, 3000)
}

function exportProfile() {
  try {
    const data = {
      profile: profile.get(),
      appliances: appliances.get(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mi-perfil-consumo-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    showNotification('Perfil exportado correctamente')
  } catch (error) {
    showNotification('Error al exportar el perfil', 'error')
  }
}

function importProfile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      
      if (data.profile && data.appliances) {
        profile.set(data.profile)
        appliances.set(data.appliances)
        showNotification('Perfil importado correctamente')
        
        // Limpiar el input
        event.target.value = ''
      } else {
        confirmDialog.value?.open({
          type: 'error',
          title: 'Archivo inválido',
          message: 'El archivo seleccionado no es un perfil válido. Asegúrate de importar un archivo JSON exportado previamente.',
          confirmText: 'Entendido'
        })
      }
    } catch (error) {
      confirmDialog.value?.open({
        type: 'error',
        title: 'Error al leer archivo',
        message: 'No se pudo leer el archivo. Verifica que sea un JSON válido y vuelve a intentarlo.',
        confirmText: 'Entendido'
      })
    }
  }
  reader.readAsText(file)
}

function clearAllData() {
  const appliancesCount = appliances.get()?.length || 0
  
  confirmDialog.value?.open({
    type: 'confirm',
    title: '¿Borrar todos los datos?',
    message: appliancesCount > 0 
      ? `Se eliminarán ${appliancesCount} electrodoméstico(s) y toda tu configuración. Esta acción no se puede deshacer.`
      : 'Se eliminará toda tu configuración. Esta acción no se puede deshacer.',
    confirmText: 'Sí, borrar todo',
    cancelText: 'Cancelar',
    onConfirm: () => {
      try {
        profile.set({ potencia: 5.5, tarifa: 'pvpc' })
        appliances.set([])
        localStorage.removeItem('user-profile')
        localStorage.removeItem('user-appliances')
        
        showNotification('Datos borrados correctamente')
        
        // Mostrar confirmación adicional
        confirmDialog.value?.open({
          type: 'success',
          title: '¡Datos eliminados!',
          message: 'Todos tus datos han sido borrados correctamente. Puedes empezar de nuevo o importar un perfil guardado.',
          confirmText: 'Aceptar'
        })
      } catch (error) {
        confirmDialog.value?.open({
          type: 'error',
          title: 'Error al borrar',
          message: 'Hubo un problema al eliminar los datos. Por favor, recarga la página e intenta de nuevo.',
          confirmText: 'Entendido'
        })
      }
    }
  })
}
</script>

<template>
  <div class="save-profile">
    <!-- Componente de confirmación -->
    <ConfirmDialog ref="confirmDialog" />

    <!-- Notificación toast -->
    <transition name="fade">
      <div v-if="showMessage" class="notification" :class="`notification--${messageType}`">
        {{ messageText }}
      </div>
    </transition>

    <div class="actions">
      <!-- Exportar -->
      <button class="btn btn-export" @click="exportProfile">
        <Download :size="18" />
        <span>Exportar perfil</span>
      </button>

      <!-- Importar -->
      <label class="btn btn-import">
        <input 
          type="file" 
          accept=".json"
          @change="importProfile"
          style="display: none"
        />
        <Upload :size="18" />
        <span>Importar perfil</span>
      </label>

      <!-- Borrar todo -->
      <button class="btn btn-clear" @click="clearAllData">
        <Trash2 :size="18" />
        <span>Borrar datos</span>
      </button>
    </div>

    <div class="info-section">
      <div class="info-card">
        <HardDrive :size="20" class="info-icon" />
        <p>Tus datos se guardan automáticamente en el navegador</p>
      </div>
      <div class="info-card">
        <FileUp :size="20" class="info-icon" />
        <p>Exporta tu perfil para compartirlo o guardarlo en otro dispositivo</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.save-profile {
  position: relative;
}

.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
}

.notification--success {
  background: #5fd4a7;
  color: #0d1b2a;
}

.notification--error {
  background: #ff6b6b;
  color: #fff;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  justify-content: center;
  font-size: 0.9rem;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.btn-export {
  background: linear-gradient(135deg, #4a7ba7 0%, #5a8bb7 100%);
  border-color: #4a7ba7;
  color: #fff;
}

.btn-export:hover {
  background: linear-gradient(135deg, #5a8bb7 0%, #6a9bc7 100%);
}

.btn-import {
  background: rgba(74, 123, 167, 0.1);
  border-color: rgba(74, 123, 167, 0.3);
  color: #c8dff5;
}

.btn-import:hover {
  background: rgba(74, 123, 167, 0.2);
  border-color: rgba(74, 123, 167, 0.5);
}

.btn-clear {
  background: rgba(255, 107, 107, 0.1);
  border-color: rgba(255, 107, 107, 0.3);
  color: #ff9999;
}

.btn-clear:hover {
  background: rgba(255, 107, 107, 0.2);
  border-color: rgba(255, 107, 107, 0.5);
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: rgba(74, 123, 167, 0.05);
  border-radius: 8px;
  border-left: 3px solid rgba(74, 123, 167, 0.3);
}

.info-icon {
  color: #4a7ba7;
  flex-shrink: 0;
  margin-top: 2px;
}

.info-card p {
  margin: 0;
  font-size: 0.85rem;
  color: #a8c5e4;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .notification {
    top: 10px;
    right: 10px;
    left: 10px;
    text-align: center;
  }
  
  .btn {
    font-size: 0.85rem;
  }
}
</style>
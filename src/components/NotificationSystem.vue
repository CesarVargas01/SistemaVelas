<template>
  <div class="fixed top-4 right-4 z-50 space-y-2">
    <div
      v-for="notification in notifications"
      :key="notification.id"
      :class="[
        'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300',
        notification.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      ]"
    >
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <div :class="getIconClass(notification.type)" class="text-xl">
              {{ getIcon(notification.type) }}
            </div>
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900">
              {{ notification.title }}
            </p>
            <p v-if="notification.message" class="mt-1 text-sm text-gray-500">
              {{ notification.message }}
            </p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button
              @click="removeNotification(notification.id)"
              class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span class="sr-only">Cerrar</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div :class="getProgressBarClass(notification.type)" class="h-1">
        <div 
          class="h-full transition-all duration-300 ease-linear"
          :style="{ width: `${notification.progress}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const notifications = ref([])
let notificationId = 0

const addNotification = (type, title, message = '', duration = 5000) => {
  const id = ++notificationId
  const notification = {
    id,
    type,
    title,
    message,
    show: false,
    progress: 100
  }
  
  notifications.value.push(notification)
  
  // Mostrar notificación
  setTimeout(() => {
    notification.show = true
  }, 100)
  
  // Animar barra de progreso
  const startTime = Date.now()
  const updateProgress = () => {
    const elapsed = Date.now() - startTime
    const remaining = Math.max(0, duration - elapsed)
    notification.progress = (remaining / duration) * 100
    
    if (remaining > 0) {
      requestAnimationFrame(updateProgress)
    } else {
      removeNotification(id)
    }
  }
  
  requestAnimationFrame(updateProgress)
}

const removeNotification = (id) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value[index].show = false
    setTimeout(() => {
      notifications.value.splice(index, 1)
    }, 300)
  }
}

const getIcon = (type) => {
  switch (type) {
    case 'success': return '✅'
    case 'error': return '❌'
    case 'warning': return '⚠️'
    case 'info': return 'ℹ️'
    default: return '📢'
  }
}

const getIconClass = (type) => {
  switch (type) {
    case 'success': return 'text-green-500'
    case 'error': return 'text-red-500'
    case 'warning': return 'text-yellow-500'
    case 'info': return 'text-blue-500'
    default: return 'text-gray-500'
  }
}

const getProgressBarClass = (type) => {
  switch (type) {
    case 'success': return 'bg-green-200'
    case 'error': return 'bg-red-200'
    case 'warning': return 'bg-yellow-200'
    case 'info': return 'bg-blue-200'
    default: return 'bg-gray-200'
  }
}

// Exponer métodos globalmente
onMounted(() => {
  window.showNotification = (title, message) => addNotification('success', title, message)
  window.showError = (title, message) => addNotification('error', title, message)
  window.showWarning = (title, message) => addNotification('warning', title, message)
  window.showInfo = (title, message) => addNotification('info', title, message)
})
</script>
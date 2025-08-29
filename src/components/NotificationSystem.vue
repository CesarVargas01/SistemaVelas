<template>
  <div class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 space-y-3 w-full max-w-4xl px-4">
    <div
      v-for="notification in store.notifications"
      :key="notification.id"
      :class="[
        'max-w-4xl w-full bg-white shadow-2xl rounded-xl pointer-events-auto ring-1 ring-black ring-opacity-10 overflow-hidden transform transition-all duration-500',
        notification.show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      ]"
    >
      <div class="p-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center flex-1 min-w-0">
            <div class="flex-shrink-0">
              <div :class="getIconClass(notification.type)" class="text-4xl">
                {{ getIcon(notification.type) }}
              </div>
            </div>
            <div class="ml-6 flex-1 min-w-0">
              <p class="text-2xl font-bold text-gray-900 leading-tight break-words">
                {{ notification.title }}
              </p>
              <p v-if="notification.message" class="mt-3 text-lg text-gray-700 leading-relaxed break-words">
                {{ notification.message }}
              </p>
            </div>
          </div>
          <div class="ml-6 flex-shrink-0">
            <button
              @click="store.removeNotification(notification.id)"
              class="bg-white rounded-full inline-flex text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none p-3 transition-colors"
            >
              <span class="sr-only">Cerrar</span>
              <svg class="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div :class="getProgressBarClass(notification.type)" class="h-3">
        <div 
          :class="getProgressBarFillClass(notification.type)"
          class="h-full transition-all duration-300 ease-linear rounded-full"
          :style="{ width: `${notification.progress}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useNotificationStore } from '@/stores/notifications'

const store = useNotificationStore()

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
    case 'success': return 'bg-green-100'
    case 'error': return 'bg-red-100'
    case 'warning': return 'bg-yellow-100'
    case 'info': return 'bg-blue-100'
    default: return 'bg-gray-100'
  }
}

const getProgressBarFillClass = (type) => {
  switch (type) {
    case 'success': return 'bg-green-500'
    case 'error': return 'bg-red-500'
    case 'warning': return 'bg-yellow-500'
    case 'info': return 'bg-blue-500'
    default: return 'bg-gray-500'
  }
}
</script>
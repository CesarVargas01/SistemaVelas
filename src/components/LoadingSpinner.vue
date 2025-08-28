<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      <p class="text-gray-700 font-medium">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const show = ref(false)
const message = ref('Cargando...')

const showLoading = (msg = 'Cargando...') => {
  message.value = msg
  show.value = true
}

const hideLoading = () => {
  show.value = false
}

// Exponer métodos globalmente
onMounted(() => {
  window.showLoading = showLoading
  window.hideLoading = hideLoading
})
</script>
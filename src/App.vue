<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg">
      <div class="container mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div class="text-center flex-1">
            <h1 class="text-3xl md:text-4xl font-bold mb-2">
              🏪 Sistema de Inventario de Velas
            </h1>
            <p class="text-lg opacity-90">
              Gestiona tus productos y pedidos de forma eficiente
            </p>
          </div>
        </div>
      </div>
    </header>

    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b">
      <div class="container mx-auto px-4">
        <div class="flex space-x-1">
          <router-link
            v-for="link in navigationLinks"
            :key="link.name"
            :to="link.path"
            class="px-6 py-4 text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-colors duration-200 font-medium"
            :class="{ 'text-primary-600 border-b-2 border-primary-600': $route.path === link.path }"
          >
            {{ link.label }}
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
      <!-- Loading Spinner -->
      <div v-if="store.loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>

      <!-- Error Message -->
      <div v-if="store.error" class="mb-6">
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{{ store.error }}</span>
          <button @click="store.clearError()" class="text-red-500 hover:text-red-700">
            ✕
          </button>
        </div>
      </div>

      <!-- Router View -->
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-6 mt-12">
      <div class="container mx-auto px-4 text-center">
        <p>&copy; 2024 Sistema de Inventario de Velas - Versión Moderna</p>
      </div>
    </footer>

    <!-- Global Systems -->
    <NotificationSystem />
    <LoadingSpinner />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useMainStore } from '@/stores/main'
import NotificationSystem from '@/components/NotificationSystem.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const store = useMainStore()

const navigationLinks = computed(() => [
  { name: 'home', path: '/', label: 'Inicio' },
  { name: 'pedidos', path: '/pedidos', label: 'Hacer Pedido' },
  { name: 'admin', path: '/admin', label: 'Administrador' }
])

onMounted(async () => {
  window.showLoading('Cargando datos iniciales...')
  try {
    await store.loadInitialData()
  } finally {
    window.hideLoading()
  }
})
</script>
<template>
  <div class="space-y-8">
    <div class="text-center">
      <h2 class="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h2>
      <p class="text-gray-600">Gestiona productos, vendedores y visualiza estadísticas</p>
    </div>

    <!-- Tabs de Administración -->
    <div class="bg-white rounded-lg shadow-sm">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8 px-6">
          <button
            v-for="tab in adminTabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <div class="p-6">
        <!-- Dashboard Tab -->
        <div v-if="activeTab === 'dashboard'" class="space-y-6">
          <AdminDashboard />
        </div>

        <!-- Productos Tab -->
        <div v-if="activeTab === 'productos'" class="space-y-6">
          <ProductManagement />
        </div>

        <!-- Vendedores Tab -->
        <div v-if="activeTab === 'vendedores'" class="space-y-6">
          <VendorManagement />
        </div>

        <!-- Pedidos Tab -->
        <div v-if="activeTab === 'pedidos'" class="space-y-6">
          <OrderManagement />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AdminDashboard from '@/components/admin/AdminDashboard.vue'
import ProductManagement from '@/components/admin/ProductManagement.vue'
import VendorManagement from '@/components/admin/VendorManagement.vue'
import OrderManagement from '@/components/admin/OrderManagement.vue'

const activeTab = ref('dashboard')

const adminTabs = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'productos', label: '📦 Productos' },
  { id: 'vendedores', label: '👥 Vendedores' },
  { id: 'pedidos', label: '🛒 Pedidos' }
]
</script>
<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-2xl font-bold text-gray-900">Gestión de Pedidos</h3>
      <div class="flex space-x-3">
        <select v-model="filterStatus" class="select-field">
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="COMPLETADO">Completados</option>
          <option value="CANCELADO">Cancelados</option>
        </select>
        <select v-model="filterVendor" class="select-field">
          <option value="">Todos los vendedores</option>
          <option v-for="vendedor in store.vendedores" :key="vendedor.id" :value="vendedor.id">
            {{ vendedor.nombre }}
          </option>
        </select>
      </div>
    </div>

    <!-- Estadísticas rápidas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-blue-50 p-4 rounded-lg">
        <div class="text-2xl font-bold text-blue-600">{{ filteredOrders.length }}</div>
        <div class="text-blue-800 text-sm">Total Pedidos</div>
      </div>
      <div class="bg-green-50 p-4 rounded-lg">
        <div class="text-2xl font-bold text-green-600">{{ completedOrders }}</div>
        <div class="text-green-800 text-sm">Completados</div>
      </div>
      <div class="bg-yellow-50 p-4 rounded-lg">
        <div class="text-2xl font-bold text-yellow-600">{{ pendingOrders }}</div>
        <div class="text-yellow-800 text-sm">Pendientes</div>
      </div>
      <div class="bg-purple-50 p-4 rounded-lg">
        <div class="text-2xl font-bold text-purple-600">{{ formatCurrency(totalRevenue) }}</div>
        <div class="text-purple-800 text-sm">Ingresos</div>
      </div>
    </div>

    <!-- Lista de Pedidos -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendedor
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cantidad
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="pedido in paginatedOrders" :key="pedido.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(pedido.fecha) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ pedido.cliente?.nombre || 'Cliente eliminado' }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ pedido.cliente?.celular || '' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ pedido.vendedor?.nombre || 'Vendedor eliminado' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ pedido.producto?.nombre || 'Producto eliminado' }}
                </div>
                <div v-if="pedido.nombres_personalizados" class="text-xs text-blue-600">
                  {{ pedido.nombres_personalizados }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ pedido.cantidad }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ formatCurrency(pedido.total) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getStatusClass(pedido.estado)" class="px-2 py-1 text-xs font-medium rounded-full">
                  {{ getStatusText(pedido.estado) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                  v-if="pedido.estado === 'PENDIENTE'"
                  @click="updateOrderStatus(pedido, 'COMPLETADO')"
                  class="text-green-600 hover:text-green-900"
                  title="Marcar como completado"
                >
                  ✅
                </button>
                <button
                  v-if="pedido.estado === 'PENDIENTE'"
                  @click="updateOrderStatus(pedido, 'CANCELADO')"
                  class="text-red-600 hover:text-red-900"
                  title="Cancelar pedido"
                >
                  ❌
                </button>
                <button
                  @click="viewOrderDetails(pedido)"
                  class="text-blue-600 hover:text-blue-900"
                  title="Ver detalles"
                >
                  👁️
                </button>

              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="totalPages > 1" class="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Mostrando {{ (currentPage - 1) * itemsPerPage + 1 }} a {{ Math.min(currentPage * itemsPerPage, filteredOrders.length) }} de {{ filteredOrders.length }} pedidos
        </div>
        <div class="flex space-x-2">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>

    <div v-if="filteredOrders.length === 0" class="text-center py-12">
      <div class="text-gray-400 text-6xl mb-4">🛒</div>
      <p class="text-gray-500 text-lg">No hay pedidos que coincidan con los filtros</p>
    </div>

    <!-- Modal de Detalles del Pedido -->
    <div v-if="showDetailsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-xl font-semibold">Detalles del Pedido</h4>
            <button @click="showDetailsModal = false" class="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <div v-if="selectedOrder" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Fecha</label>
                <p class="text-sm text-gray-900">{{ formatDate(selectedOrder.fecha) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Estado</label>
                <span :class="getStatusClass(selectedOrder.estado)" class="px-2 py-1 text-xs font-medium rounded-full">
                  {{ getStatusText(selectedOrder.estado) }}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Cliente</label>
                <p class="text-sm text-gray-900">{{ selectedOrder.cliente?.nombre || 'N/A' }}</p>
                <p class="text-xs text-gray-500">{{ selectedOrder.cliente?.celular || '' }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Vendedor</label>
                <p class="text-sm text-gray-900">{{ selectedOrder.vendedor?.nombre || 'N/A' }}</p>
                <p class="text-xs text-gray-500">{{ selectedOrder.vendedor?.email || '' }}</p>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Producto</label>
              <p class="text-sm text-gray-900">{{ selectedOrder.producto?.nombre || 'N/A' }}</p>
              <p class="text-xs text-gray-500">Cantidad: {{ selectedOrder.cantidad }}</p>
            </div>

            <div v-if="selectedOrder.nombres_personalizados">
              <label class="block text-sm font-medium text-gray-700">Nombres Personalizados</label>
              <p class="text-sm text-gray-900">{{ selectedOrder.nombres_personalizados }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Precio Unitario</label>
                <p class="text-sm text-gray-900">{{ formatCurrency(selectedOrder.precio_unitario) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Total</label>
                <p class="text-lg font-bold text-green-600">{{ formatCurrency(selectedOrder.total) }}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Medio de Pago</label>
                <p class="text-sm text-gray-900">{{ selectedOrder.medio_pago || 'N/A' }}</p>
              </div>
              <div v-if="selectedOrder.monto_abono">
                <label class="block text-sm font-medium text-gray-700">Monto Abono</label>
                <p class="text-sm text-gray-900">{{ formatCurrency(selectedOrder.monto_abono) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMainStore } from '@/stores/main'
import { supabase } from '@/lib/supabase'

const store = useMainStore()

// Estado
const filterStatus = ref('')
const filterVendor = ref('')
const currentPage = ref(1)
const itemsPerPage = 20
const showDetailsModal = ref(false)
const selectedOrder = ref(null)
const loading = ref(false)

// Computed
const filteredOrders = computed(() => {
  let orders = [...store.pedidos]
  
  if (filterStatus.value) {
    orders = orders.filter(order => order.estado === filterStatus.value)
  }
  
  if (filterVendor.value) {
    orders = orders.filter(order => order.vendedor_id === filterVendor.value)
  }
  
  return orders.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
})

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredOrders.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredOrders.value.length / itemsPerPage)
})

const completedOrders = computed(() => {
  return filteredOrders.value.filter(order => order.estado === 'COMPLETADO').length
})

const pendingOrders = computed(() => {
  return filteredOrders.value.filter(order => order.estado === 'PENDIENTE').length
})

const totalRevenue = computed(() => {
  return filteredOrders.value
    .filter(order => order.estado === 'COMPLETADO')
    .reduce((sum, order) => sum + order.total, 0)
})

// Métodos
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '$0'
  return value.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

const getStatusClass = (status) => {
  switch (status) {
    case 'COMPLETADO':
      return 'bg-green-100 text-green-800'
    case 'PENDIENTE':
      return 'bg-yellow-100 text-yellow-800'
    case 'CANCELADO':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'COMPLETADO':
      return 'Completado'
    case 'PENDIENTE':
      return 'Pendiente'
    case 'CANCELADO':
      return 'Cancelado'
    default:
      return status || 'Desconocido'
  }
}

const updateOrderStatus = async (order, newStatus) => {
  try {
    loading.value = true
    
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: newStatus })
      .eq('id', order.id)
    
    if (error) throw error
    
    await store.loadPedidos()
    
    window.showNotification(
      'Estado actualizado',
      `Pedido marcado como ${getStatusText(newStatus).toLowerCase()}`
    )
    
  } catch (error) {
    console.error('Error actualizando estado:', error)
    window.showError('Error al actualizar estado', error.message)
  } finally {
    loading.value = false
  }
}

const viewOrderDetails = (order) => {
  selectedOrder.value = order
  showDetailsModal.value = true
}


</script>
<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-2xl font-bold text-gray-900">Gestión de Pedidos</h3>
      <div class="flex space-x-3">
        <button 
          @click="exportToExcel" 
          class="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium"
          title="Exportar a Excel"
        >
          📊 Exportar Excel
        </button>
        <button 
          @click="exportToCSV" 
          class="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
          title="Exportar a CSV"
        >
          📄 Exportar CSV
        </button>
        <select v-model="filterStatus" class="select-field">
          <option value="PENDIENTE">Solo Pendientes</option>
          <option value="">Todos los estados</option>
          <option value="ENTREGADO">Solo Entregados</option>
          <option value="CANCELADO">Solo Cancelados</option>
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
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div class="bg-blue-50 p-4 rounded-lg">
        <div class="text-2xl font-bold text-blue-600">{{ filteredOrders.length }}</div>
        <div class="text-blue-800 text-sm">{{ filterStatus ? getStatusText(filterStatus) : 'Total Pedidos' }}</div>
      </div>
      <div class="bg-green-50 p-4 rounded-lg">
        <div class="text-2xl font-bold text-green-600">{{ completedOrders }}</div>
        <div class="text-green-800 text-sm">Entregados</div>
      </div>
      <div class="bg-yellow-50 p-4 rounded-lg">
        <div class="text-2xl font-bold text-yellow-600">{{ pendingOrders }}</div>
        <div class="text-yellow-800 text-sm">Pendientes</div>
      </div>
      <div class="bg-purple-50 p-4 rounded-lg">
        <div class="text-2xl font-bold text-purple-600">{{ formatCurrency(totalRevenue) }}</div>
        <div class="text-purple-800 text-sm">Ingresos Totales</div>
      </div>
      <div class="bg-indigo-50 p-4 rounded-lg">
        <div class="text-2xl font-bold text-indigo-600">{{ formatCurrency(filteredRevenue) }}</div>
        <div class="text-indigo-800 text-sm">Ingresos Filtrados</div>
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
              <td class="px-6 py-4 whitespace-nowrap max-w-[120px]">
                <div class="text-sm font-medium text-gray-900 truncate" :title="pedido.producto?.nombre || 'Producto eliminado'">
                  {{ truncateText(pedido.producto?.nombre || 'Producto eliminado', 15) }}
                </div>
                <div v-if="pedido.nombres_personalizados" class="text-xs text-blue-600 truncate" :title="pedido.nombres_personalizados">
                  {{ truncateText(pedido.nombres_personalizados, 20) }}
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
                  @click="handleDelivery(pedido)"
                  :disabled="loading"
                  class="text-green-600 hover:text-green-900 px-2 py-1 bg-green-50 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  :title="getDeliveryButtonTitle(pedido)"
                >
                  <span v-if="loading">⏳</span>
                  <span v-else>📦</span>
                  {{ getDeliveryButtonText(pedido) }}
                </button>
                <button
                  v-if="pedido.estado === 'PENDIENTE'"
                  @click="updateOrderStatus(pedido, 'CANCELADO')"
                  :disabled="loading"
                  class="text-red-600 hover:text-red-900 px-2 py-1 bg-red-50 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Cancelar pedido"
                >
                  <span v-if="loading">⏳</span>
                  <span v-else>❌</span>
                  Cancelar
                </button>
                <button
                  @click="viewOrderDetails(pedido)"
                  class="text-blue-600 hover:text-blue-900 px-2 py-1 bg-blue-50 rounded text-xs font-medium"
                  title="Ver detalles"
                >
                  👁️ Ver
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
      <p class="text-gray-500 text-lg mb-4">No hay pedidos que coincidan con los filtros</p>
      <div class="space-y-2 text-sm text-gray-400">
        <p>Total pedidos en sistema: {{ store.pedidos.length }}</p>
        <p>Filtro actual: {{ filterStatus || 'Todos' }}</p>
        <button 
          @click="createTestOrder" 
          class="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          🧪 Crear Pedido de Prueba
        </button>
      </div>
    </div>

    <!-- Modal de Detalles del Pedido -->
    <div v-if="showDetailsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="p-8">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-2xl font-bold text-gray-900">Detalles del Pedido</h4>
            <button @click="showDetailsModal = false" class="text-gray-400 hover:text-gray-600 text-2xl font-bold p-2 hover:bg-gray-100 rounded-full transition-colors">
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

            <!-- Historial de Pagos -->
            <div v-if="selectedOrder.medio_pago === 'ABONO'" class="mt-6 border-t pt-4">
              <PaymentHistory :pedido="selectedOrder" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Completar Pago -->
    <div v-if="showPaymentModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="p-8">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-2xl font-bold text-gray-900">💰 Completar Pago</h4>
            <button @click="showPaymentModal = false" class="text-gray-400 hover:text-gray-600 text-2xl font-bold p-2 hover:bg-gray-100 rounded-full transition-colors">
              ✕
            </button>
          </div>

          <div v-if="selectedOrderForPayment" class="space-y-4">
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h5 class="font-medium text-yellow-800">Pedido #{{ selectedOrderForPayment.id }}</h5>
              <p class="text-sm text-yellow-700">Cliente: {{ selectedOrderForPayment.cliente?.nombre }}</p>
              <p class="text-sm text-yellow-700">Producto: {{ selectedOrderForPayment.producto?.nombre }}</p>
            </div>

            <div class="space-y-3">
              <div class="bg-gray-50 p-3 rounded-lg space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-600">Total del pedido:</span>
                  <span class="font-medium">{{ formatCurrency(selectedOrderForPayment.total) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Ya abonado:</span>
                  <span class="font-medium text-green-600">{{ formatCurrency(selectedOrderForPayment.valor_cancelado || selectedOrderForPayment.monto_abono || 0) }}</span>
                </div>
                <div class="flex justify-between border-t pt-2">
                  <span class="font-bold text-gray-800">Saldo pendiente:</span>
                  <span class="font-bold text-red-600 text-lg">{{ formatCurrency(remainingAmount) }}</span>
                </div>
              </div>
              
              <!-- Información adicional -->
              <div class="text-xs text-gray-500 space-y-1">
                <div>📅 Fecha del pedido: {{ formatDate(selectedOrderForPayment.fecha) }}</div>
                <div>📦 Producto: {{ selectedOrderForPayment.producto?.nombre }}</div>
                <div>🔢 Cantidad: {{ selectedOrderForPayment.cantidad }} unidades</div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Monto adicional a pagar:
              </label>
              <div class="space-y-2">
                <input
                  v-model.number="additionalPayment"
                  type="number"
                  :min="0"
                  step="1000"
                  class="input-field"
                  :placeholder="`Mínimo: $1,000 - Pendiente: ${formatCurrency(remainingAmount)}`"
                />
                
                <!-- Botones de monto rápido -->
                <div class="flex space-x-2">
                  <button
                    @click="additionalPayment = remainingAmount"
                    class="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                    type="button"
                  >
                    💰 Pago Completo ({{ formatCurrency(remainingAmount) }})
                  </button>
                  <button
                    v-if="remainingAmount >= 10000"
                    @click="additionalPayment = Math.floor(remainingAmount / 2 / 1000) * 1000"
                    class="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    type="button"
                  >
                    💳 Mitad ({{ formatCurrency(Math.floor(remainingAmount / 2 / 1000) * 1000) }})
                  </button>
                </div>
                
                <!-- Validación visual -->
                <div v-if="additionalPayment > 0" class="text-xs">
                  <div v-if="additionalPayment > remainingAmount" class="text-orange-600">
                    ⚠️ Excede el saldo por {{ formatCurrency(additionalPayment - remainingAmount) }}
                  </div>
                  <div v-else-if="additionalPayment === remainingAmount" class="text-green-600">
                    ✅ Pago completo - El pedido se entregará automáticamente
                  </div>
                  <div v-else class="text-blue-600">
                    💰 Saldo restante después del pago: {{ formatCurrency(remainingAmount - additionalPayment) }}
                  </div>
                </div>
              </div>
            </div>

            <div class="flex space-x-3">
              <button
                @click="completePayment"
                :disabled="!additionalPayment || additionalPayment <= 0 || loading"
                :class="[
                  'flex-1 px-4 py-2 rounded-lg font-medium transition-colors',
                  additionalPayment >= remainingAmount 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white',
                  '!disabled:opacity-50 !disabled:cursor-not-allowed'
                ]"
              >
                <span v-if="loading">⏳ Procesando...</span>
                <span v-else-if="additionalPayment >= remainingAmount">✅ Completar Pago y Entregar</span>
                <span v-else>💳 Registrar Pago Parcial</span>
              </button>
              <button
                @click="showPaymentModal = false; additionalPayment = 0"
                :disabled="loading"
                class="flex-1 btn-secondary disabled:opacity-50"
              >
                Cancelar
              </button>
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
import PaymentHistory from './PaymentHistory.vue'

const store = useMainStore()

// Estado
const filterStatus = ref('PENDIENTE') // Solo mostrar pedidos pendientes
const filterVendor = ref('')
const currentPage = ref(1)
const itemsPerPage = 20
const showDetailsModal = ref(false)
const selectedOrder = ref(null)
const loading = ref(false)
const showPaymentModal = ref(false)
const selectedOrderForPayment = ref(null)
const remainingAmount = ref(0)
const additionalPayment = ref(0)

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
  return filteredOrders.value.filter(order => order.estado === 'ENTREGADO' || order.estado === 'COMPLETADO').length
})

const pendingOrders = computed(() => {
  return filteredOrders.value.filter(order => order.estado === 'PENDIENTE').length
})

const totalRevenue = computed(() => {
  return store.pedidos
    .filter(order => order.estado === 'ENTREGADO' || order.estado === 'COMPLETADO')
    .reduce((sum, order) => sum + order.total, 0)
})

const filteredRevenue = computed(() => {
  return filteredOrders.value
    .filter(order => order.estado === 'ENTREGADO' || order.estado === 'COMPLETADO')
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
    case 'ENTREGADO':
      return 'bg-green-100 text-green-800'
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
    case 'ENTREGADO':
      return 'Entregado'
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

const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const updateOrderStatus = async (order, newStatus) => {
  try {
    loading.value = true
    console.log('🔄 Iniciando actualización de pedido:', { 
      id: order.id, 
      estadoActual: order.estado, 
      nuevoEstado: newStatus,
      pedidoCompleto: order
    })
    
    // Verificar que el pedido tenga ID
    if (!order.id) {
      throw new Error('El pedido no tiene ID válido')
    }
    
    // Primero verificar que el pedido existe
    console.log('🔍 Verificando si el pedido existe...')
    const { data: existingOrder, error: checkError } = await supabase
      .from('pedidos')
      .select('id, estado')
      .eq('id', order.id)
      .single()
    
    if (checkError) {
      console.error('❌ Error verificando pedido:', checkError)
      throw new Error(`No se pudo verificar el pedido: ${checkError.message}`)
    }
    
    if (!existingOrder) {
      throw new Error(`No se encontró el pedido con ID ${order.id}`)
    }
    
    console.log('✅ Pedido encontrado:', existingOrder)
    
    // Ahora actualizar el pedido
    console.log('🔄 Actualizando pedido en Supabase...')
    const { data, error } = await supabase
      .from('pedidos')
      .update({ estado: newStatus })
      .eq('id', order.id)
      .select('*')
    
    if (error) {
      console.error('❌ Error de Supabase:', error)
      
      // Si es un error de RLS, dar información específica
      if (error.code === 'PGRST116' || error.message.includes('row-level security')) {
        throw new Error('Error de permisos: Row Level Security está bloqueando la actualización. Ejecuta el script fix_rls_pedidos.sql en Supabase.')
      }
      
      throw error
    }
    
    console.log('✅ Pedido actualizado en Supabase:', data)
    
    if (!data || data.length === 0) {
      // Intentar verificar si realmente se actualizó
      console.log('⚠️ Supabase devolvió array vacío, verificando si se actualizó...')
      
      const { data: verifyData, error: verifyError } = await supabase
        .from('pedidos')
        .select('id, estado')
        .eq('id', order.id)
        .single()
      
      if (verifyError) {
        throw new Error('No se pudo verificar la actualización')
      }
      
      if (verifyData.estado === newStatus) {
        console.log('✅ El pedido SÍ se actualizó, pero Supabase no devolvió los datos')
        // Continuar con el flujo normal
      } else {
        throw new Error('No se encontró el pedido para actualizar - posible problema de permisos RLS')
      }
    }
    
    // Actualizar el pedido localmente primero para feedback inmediato
    const pedidoIndex = store.pedidos.findIndex(p => p.id === order.id)
    console.log('📍 Índice del pedido en store:', pedidoIndex)
    
    if (pedidoIndex !== -1) {
      console.log('🔄 Actualizando pedido localmente...')
      store.pedidos[pedidoIndex].estado = newStatus
      console.log('✅ Pedido actualizado localmente:', store.pedidos[pedidoIndex])
    } else {
      console.warn('⚠️ No se encontró el pedido en el store local')
    }
    
    // Si se está marcando como entregado, actualizar stock
    if (newStatus === 'ENTREGADO') {
      console.log('📦 Pedido entregado, actualizando stock...')
      await updateProductStock(order.producto_id, order.cantidad)
    }
    
    // Recargar todos los pedidos para asegurar consistencia
    console.log('🔄 Recargando pedidos desde la base de datos...')
    await store.loadPedidos()
    console.log('✅ Pedidos recargados, total:', store.pedidos.length)
    
    // Mostrar notificación de éxito
    const mensaje = `Pedido #${order.id} marcado como ${getStatusText(newStatus).toLowerCase()}`
    console.log('📢 Mostrando notificación:', mensaje)
    
    if (window.showNotification) {
      window.showNotification('✅ Estado actualizado exitosamente', mensaje)
    } else {
      console.warn('⚠️ window.showNotification no está disponible, usando alert')
      alert(`✅ ${mensaje}`)
    }
    
  } catch (error) {
    console.error('❌ Error completo actualizando estado:', {
      error,
      message: error.message,
      stack: error.stack,
      pedidoId: order.id
    })
    
    const errorMessage = error.message || 'Error desconocido al actualizar el estado'
    
    if (window.showError) {
      window.showError('❌ Error al actualizar estado', errorMessage)
    } else {
      console.warn('⚠️ window.showError no está disponible, usando alert')
      alert(`❌ Error: ${errorMessage}`)
    }
  } finally {
    loading.value = false
    console.log('🏁 Finalizada actualización de estado')
  }
}

const viewOrderDetails = (order) => {
  selectedOrder.value = order
  showDetailsModal.value = true
}

const debugPedidos = () => {
  console.log('🐛 DEBUG - Información completa de pedidos:')
  console.log('📊 Total pedidos en store:', store.pedidos.length)
  console.log('📋 Todos los pedidos:', store.pedidos)
  console.log('🔍 Pedidos filtrados:', filteredOrders.value)
  console.log('📄 Pedidos paginados:', paginatedOrders.value)
  console.log('🎛️ Filtro actual:', filterStatus.value)
  
  // Verificar específicamente el pedido 29
  const pedido29 = store.pedidos.find(p => p.id === 29)
  if (pedido29) {
    console.log('✅ Pedido 29 encontrado:', pedido29)
    console.log('🔢 Tipo de ID:', typeof pedido29.id)
    console.log('📝 Estado actual:', pedido29.estado)
  } else {
    console.log('❌ Pedido 29 NO encontrado en el store')
  }
  
  // Verificar tipos de datos de IDs
  console.log('🔢 Tipos de IDs de los primeros 5 pedidos:')
  store.pedidos.slice(0, 5).forEach(p => {
    console.log(`ID: ${p.id} (tipo: ${typeof p.id})`)
  })
  
  // Verificar si hay pedidos pendientes
  const pendientes = store.pedidos.filter(p => p.estado === 'PENDIENTE')
  console.log('⏳ Pedidos pendientes:', pendientes.length)
  console.log('📋 Lista de pendientes:', pendientes)
}

const createTestOrder = async () => {
  try {
    console.log('🧪 Creando pedido de prueba...')
    
    // Verificar que tengamos datos necesarios
    if (store.productos.length === 0 || store.vendedores.length === 0 || store.clientes.length === 0) {
      window.showError('❌ Error', 'Necesitas tener al menos 1 producto, 1 vendedor y 1 cliente para crear un pedido de prueba')
      return
    }
    
    const testOrder = {
      cliente_id: store.clientes[0].id,
      vendedor_id: store.vendedores[0].id,
      producto_id: store.productos[0].id,
      cantidad: 1,
      precio_unitario: 16000,
      total: 16000,
      fecha: new Date().toISOString(),
      estado: 'PENDIENTE',
      medio_pago: 'EFECTIVO'
    }
    
    console.log('📝 Datos del pedido de prueba:', testOrder)
    
    const { data, error } = await supabase
      .from('pedidos')
      .insert([testOrder])
      .select()
    
    if (error) {
      console.error('❌ Error creando pedido de prueba:', error)
      window.showError('❌ Error', `No se pudo crear el pedido de prueba: ${error.message}`)
      return
    }
    
    console.log('✅ Pedido de prueba creado:', data)
    
    // Recargar pedidos
    await store.loadPedidos()
    
    window.showNotification('✅ Pedido de prueba creado', `ID: ${data[0].id}`)
    
  } catch (error) {
    console.error('❌ Error en createTestOrder:', error)
    window.showError('❌ Error', error.message)
  }
}

const exportToCSV = () => {
  try {
    console.log('📄 Exportando a CSV...')
    
    // Preparar datos para exportar
    const dataToExport = filteredOrders.value.map(pedido => ({
      'ID': pedido.id,
      'Fecha': formatDate(pedido.fecha),
      'Cliente': pedido.cliente?.nombre || 'N/A',
      'Teléfono': pedido.cliente?.celular || 'N/A',
      'Vendedor': pedido.vendedor?.nombre || 'N/A',
      'Producto': pedido.producto?.nombre || 'N/A',
      'Cantidad': pedido.cantidad,
      'Precio Unitario': pedido.precio_unitario,
      'Total': pedido.total,
      'Estado': getStatusText(pedido.estado),
      'Medio de Pago': pedido.medio_pago || 'N/A',
      'Nombres Personalizados': pedido.nombres_personalizados || 'N/A'
    }))
    
    if (dataToExport.length === 0) {
      window.showWarning('⚠️ Sin datos', 'No hay pedidos para exportar')
      return
    }
    
    // Convertir a CSV
    const headers = Object.keys(dataToExport[0])
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escapar comillas y envolver en comillas si contiene comas
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value
        }).join(',')
      )
    ].join('\n')
    
    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `pedidos_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.showNotification('✅ CSV Exportado', `${dataToExport.length} pedidos exportados`)
    
  } catch (error) {
    console.error('❌ Error exportando CSV:', error)
    window.showError('❌ Error', 'No se pudo exportar el archivo CSV')
  }
}

const exportToExcel = () => {
  try {
    console.log('📊 Exportando a Excel...')
    
    // Preparar datos para exportar
    const dataToExport = filteredOrders.value.map(pedido => ({
      'ID': pedido.id,
      'Fecha': formatDate(pedido.fecha),
      'Cliente': pedido.cliente?.nombre || 'N/A',
      'Teléfono': pedido.cliente?.celular || 'N/A',
      'Vendedor': pedido.vendedor?.nombre || 'N/A',
      'Email Vendedor': pedido.vendedor?.email || 'N/A',
      'Producto': pedido.producto?.nombre || 'N/A',
      'Cantidad': pedido.cantidad,
      'Precio Unitario': pedido.precio_unitario,
      'Total': pedido.total,
      'Estado': getStatusText(pedido.estado),
      'Medio de Pago': pedido.medio_pago || 'N/A',
      'Monto Abono': pedido.monto_abono || 0,
      'Nombres Personalizados': pedido.nombres_personalizados || 'N/A'
    }))
    
    if (dataToExport.length === 0) {
      window.showWarning('⚠️ Sin datos', 'No hay pedidos para exportar')
      return
    }
    
    // Crear HTML para Excel
    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Pedidos</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .number { text-align: right; }
          </style>
        </head>
        <body>
          <h1>Reporte de Pedidos - ${new Date().toLocaleDateString('es-CO')}</h1>
          <p>Total de pedidos: ${dataToExport.length}</p>
          <p>Filtro aplicado: ${filterStatus.value || 'Todos los estados'}</p>
          
          <table>
            <thead>
              <tr>
                ${Object.keys(dataToExport[0]).map(key => `<th>${key}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${dataToExport.map(row => 
                `<tr>
                  ${Object.values(row).map(value => 
                    `<td class="${typeof value === 'number' ? 'number' : ''}">${value}</td>`
                  ).join('')}
                </tr>`
              ).join('')}
            </tbody>
          </table>
          
          <h3>Resumen:</h3>
          <p>Total Ingresos: ${formatCurrency(totalRevenue.value)}</p>
          <p>Pedidos Pendientes: ${pendingOrders.value}</p>
          <p>Pedidos Entregados: ${completedOrders.value}</p>
        </body>
      </html>
    `
    
    // Descargar como archivo Excel
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `reporte_pedidos_${new Date().toISOString().split('T')[0]}.xls`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.showNotification('✅ Excel Exportado', `Reporte con ${dataToExport.length} pedidos generado`)
    
  } catch (error) {
    console.error('❌ Error exportando Excel:', error)
    window.showError('❌ Error', 'No se pudo exportar el archivo Excel')
  }
}

const getDeliveryButtonText = (pedido) => {
  if (pedido.medio_pago === 'ABONO') {
    const montoAbonado = pedido.valor_cancelado || pedido.monto_abono || 0
    const saldoPendiente = pedido.total - montoAbonado
    return saldoPendiente > 0 ? 'Completar Pago' : 'Entregar'
  }
  return 'Entregar'
}

const getDeliveryButtonTitle = (pedido) => {
  if (pedido.medio_pago === 'ABONO') {
    const montoAbonado = pedido.valor_cancelado || pedido.monto_abono || 0
    const saldoPendiente = pedido.total - montoAbonado
    if (saldoPendiente > 0) {
      return `Falta pagar ${formatCurrency(saldoPendiente)} para poder entregar`
    }
    return 'Pago completo - Marcar como entregado'
  }
  return 'Marcar como entregado'
}

const handleDelivery = async (pedido) => {
  try {
    console.log('🚚 Iniciando proceso de entrega:', {
      pedidoId: pedido.id,
      medioPago: pedido.medio_pago,
      total: pedido.total,
      montoAbono: pedido.monto_abono,
      estado: pedido.estado
    })
    
    // Validar que el pedido esté en estado correcto
    if (pedido.estado === 'ENTREGADO') {
      window.showWarning('⚠️ Advertencia', 'Este pedido ya fue entregado')
      return
    }
    
    if (pedido.estado === 'CANCELADO') {
      window.showError('❌ Error', 'No se puede entregar un pedido cancelado')
      return
    }
    
    // Validar stock disponible antes de entregar
    const producto = store.productos.find(p => p.id === pedido.producto_id)
    if (!producto) {
      window.showError('❌ Error', 'No se encontró el producto asociado al pedido')
      return
    }
    
    if (producto.stock < pedido.cantidad) {
      const faltante = pedido.cantidad - producto.stock
      const stockFinal = Math.max(0, producto.stock - pedido.cantidad)
      const mensaje = `⚠️ Stock insuficiente para entregar:\n\n` +
        `Producto: ${producto.nombre}\n` +
        `Cantidad solicitada: ${pedido.cantidad} unidades\n` +
        `Stock disponible: ${producto.stock} unidades\n` +
        `Faltante: ${faltante} unidades\n` +
        `Stock después de entrega: ${stockFinal} unidades\n\n` +
        `¿Deseas continuar de todos modos? El stock quedará en ${stockFinal}.`
      
      const confirmacion = confirm(mensaje)
      if (!confirmacion) {
        window.showWarning('⚠️ Entrega Cancelada', 'La entrega fue cancelada por stock insuficiente')
        return
      }
      
      console.log('⚠️ Entregando con stock insuficiente - Usuario confirmó')
    }
    
    // Manejar pedidos con ABONO
    if (pedido.medio_pago === 'ABONO') {
      // Usar valor_cancelado si está disponible, sino monto_abono
      const montoAbonado = pedido.valor_cancelado || pedido.monto_abono || 0
      const saldoPendiente = pedido.total - montoAbonado
      
      console.log('💰 Validando pago con abono:', {
        pedidoId: pedido.id,
        total: pedido.total,
        monto_abono: pedido.monto_abono,
        valor_cancelado: pedido.valor_cancelado,
        montoUsado: montoAbonado,
        saldoPendiente: saldoPendiente,
        calculo: `${pedido.total} - ${montoAbonado} = ${saldoPendiente}`
      })
      
      if (saldoPendiente > 0.01) { // Tolerancia de 1 centavo para errores de redondeo
        // Mostrar modal para completar pago
        console.log('💳 Abriendo modal de pago - saldo pendiente:', saldoPendiente)
        showPaymentModal.value = true
        selectedOrderForPayment.value = pedido
        remainingAmount.value = saldoPendiente
        additionalPayment.value = saldoPendiente // Pre-llenar con el saldo exacto
        return
      } else if (saldoPendiente < -0.01) {
        // El cliente pagó de más
        const exceso = Math.abs(saldoPendiente)
        window.showWarning(
          '💰 Pago Excesivo', 
          `El cliente pagó ${formatCurrency(exceso)} de más. Total: ${formatCurrency(pedido.total)}, Pagado: ${formatCurrency(montoAbonado)}`
        )
      }
    }
    
    // Confirmar entrega
    const confirmacion = confirm(
      `¿Confirmar entrega del pedido #${pedido.id}?\n\n` +
      `Cliente: ${pedido.cliente?.nombre || 'N/A'}\n` +
      `Producto: ${producto.nombre}\n` +
      `Cantidad: ${pedido.cantidad}\n` +
      `Total: ${formatCurrency(pedido.total)}`
    )
    
    if (!confirmacion) return
    
    // Entregar pedido
    console.log('✅ Procediendo con la entrega del pedido')
    await updateOrderStatus(pedido, 'ENTREGADO')
    
  } catch (error) {
    console.error('❌ Error en handleDelivery:', error)
    window.showError('❌ Error', `No se pudo procesar la entrega: ${error.message}`)
  }
}

const completePayment = async () => {
  try {
    loading.value = true
    
    // Validaciones iniciales
    if (!selectedOrderForPayment.value || !additionalPayment.value) {
      window.showError('❌ Error', 'Datos de pago incompletos')
      return
    }
    
    if (additionalPayment.value <= 0) {
      window.showError('❌ Error', 'El monto debe ser mayor a cero')
      return
    }
    
    const currentPaid = selectedOrderForPayment.value.valor_cancelado || selectedOrderForPayment.value.monto_abono || 0
    const newTotalPaid = currentPaid + additionalPayment.value
    const totalOrder = selectedOrderForPayment.value.total
    const isFullyPaid = newTotalPaid >= totalOrder
    const remainingBalance = Math.max(0, totalOrder - newTotalPaid)
    
    // Validar que no se pague más de lo debido (con confirmación)
    if (newTotalPaid > totalOrder) {
      const exceso = newTotalPaid - totalOrder
      const confirmacion = confirm(
        `⚠️ El pago excede el total por ${formatCurrency(exceso)}. ¿Continuar de todos modos?`
      )
      if (!confirmacion) return
    }
    
    console.log('💰 Completando pago:', {
      pedidoId: selectedOrderForPayment.value.id,
      abonoAnterior: currentPaid,
      pagoAdicional: additionalPayment.value,
      nuevoTotalAbono: newTotalPaid,
      totalPedido: totalOrder,
      completamentePagado: isFullyPaid,
      saldoRestante: remainingBalance
    })
    
    // Crear registro detallado del pago
    const fechaPago = new Date().toISOString()
    const descripcionPago = isFullyPaid 
      ? 'Pago completado - Pedido entregado automáticamente'
      : `Pago parcial - Saldo restante: ${formatCurrency(remainingBalance)}`
    
    // Actualizar el pedido con información completa
    const updateData = { 
      monto_abono: newTotalPaid,
      valor_cancelado: newTotalPaid // Mantener registro del total pagado
      // Nota: campos adicionales se pueden agregar cuando existan en la BD
    }
    
    // Solo cambiar estado si está completamente pagado
    if (isFullyPaid) {
      updateData.estado = 'ENTREGADO'
      // Nota: fecha_entrega se puede agregar más tarde si se necesita
    }
    
    const { error } = await supabase
      .from('pedidos')
      .update(updateData)
      .eq('id', selectedOrderForPayment.value.id)
    
    if (error) {
      console.error('❌ Error actualizando pedido:', error)
      throw error
    }
    
    // Si está completamente pagado, actualizar stock
    if (isFullyPaid) {
      console.log('📦 Pedido completamente pagado, actualizando stock...')
      await updateProductStock(selectedOrderForPayment.value.producto_id, selectedOrderForPayment.value.cantidad)
    }
    
    // Recargar datos y verificar actualización
    await store.loadPedidos()
    
    // Verificar que el pedido se actualizó correctamente
    const pedidoActualizado = store.pedidos.find(p => p.id === selectedOrderForPayment.value.id)
    if (pedidoActualizado) {
      console.log('✅ Pedido actualizado correctamente:', {
        id: pedidoActualizado.id,
        total: pedidoActualizado.total,
        monto_abono: pedidoActualizado.monto_abono,
        valor_cancelado: pedidoActualizado.valor_cancelado,
        estado: pedidoActualizado.estado
      })
    }
    
    // Cerrar modal y limpiar
    showPaymentModal.value = false
    selectedOrderForPayment.value = null
    additionalPayment.value = 0
    remainingAmount.value = 0
    
    // Mensaje de éxito detallado
    let message = ''
    if (isFullyPaid) {
      message = `✅ Pago completado (${formatCurrency(newTotalPaid)}) y pedido entregado automáticamente`
    } else {
      message = `💰 Pago registrado (${formatCurrency(additionalPayment.value)}). Saldo pendiente: ${formatCurrency(remainingBalance)}`
    }
    
    window.showNotification('✅ Pago actualizado', message)
    
  } catch (error) {
    console.error('❌ Error completando pago:', error)
    window.showError('❌ Error', `No se pudo completar el pago: ${error.message}`)
  } finally {
    loading.value = false
  }
}

const updateProductStock = async (productoId, cantidadVendida) => {
  try {
    console.log('📦 Actualizando stock del producto:', { productoId, cantidadVendida })
    
    // Obtener el producto actual
    const { data: producto, error: fetchError } = await supabase
      .from('productos')
      .select('stock, nombre')
      .eq('id', productoId)
      .single()
    
    if (fetchError) {
      console.error('❌ Error obteniendo producto:', fetchError)
      return
    }
    
    const stockAnterior = producto.stock
    const nuevoStock = Math.max(0, stockAnterior - cantidadVendida) // Restar la cantidad vendida
    
    console.log('📊 Actualizando stock:', {
      producto: producto.nombre,
      stockAnterior: stockAnterior,
      cantidadVendida: cantidadVendida,
      nuevoStock: nuevoStock,
      operacion: `${stockAnterior} - ${cantidadVendida} = ${nuevoStock}`
    })
    
    // Actualizar el stock
    const { error: updateError } = await supabase
      .from('productos')
      .update({ stock: nuevoStock })
      .eq('id', productoId)
    
    if (updateError) {
      console.error('❌ Error actualizando stock:', updateError)
      window.showWarning('⚠️ Advertencia', 'El pedido se entregó pero no se pudo actualizar el stock automáticamente')
      return
    }
    
    // Recargar productos en el store
    await store.loadProductos()
    
    console.log('✅ Stock actualizado correctamente')
    
    // Alertas de stock
    if (nuevoStock === 0) {
      window.showWarning('⚠️ Stock Agotado', `${producto.nombre} se quedó sin stock`)
    } else if (nuevoStock <= 5) {
      window.showWarning('⚠️ Stock Bajo', `${producto.nombre} tiene solo ${nuevoStock} unidades restantes`)
    }
    
  } catch (error) {
    console.error('❌ Error en updateProductStock:', error)
    window.showWarning('⚠️ Advertencia', 'No se pudo actualizar el stock automáticamente')
  }
}


</script>
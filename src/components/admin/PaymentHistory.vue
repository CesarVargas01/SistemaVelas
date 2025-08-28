<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h4 class="text-lg font-semibold text-gray-900">💰 Historial de Pagos</h4>
      <button 
        @click="loadPaymentHistory" 
        :disabled="loading"
        class="text-blue-600 hover:text-blue-800 text-sm"
      >
        🔄 Actualizar
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="text-gray-500 mt-2">Cargando historial...</p>
    </div>

    <!-- Payment history list -->
    <div v-else-if="payments.length > 0" class="space-y-3">
      <div 
        v-for="payment in payments" 
        :key="payment.id"
        class="bg-gray-50 rounded-lg p-4 border-l-4"
        :class="getPaymentTypeClass(payment.tipo)"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center space-x-2">
              <span class="text-lg">{{ getPaymentIcon(payment.tipo) }}</span>
              <span class="font-medium text-gray-900">
                {{ formatCurrency(payment.monto) }}
              </span>
              <span class="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                {{ payment.tipo.replace('_', ' ') }}
              </span>
            </div>
            
            <p v-if="payment.descripcion" class="text-sm text-gray-600 mt-1">
              {{ payment.descripcion }}
            </p>
            
            <div class="text-xs text-gray-500 mt-2">
              📅 {{ formatDate(payment.fecha) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-8">
      <div class="text-gray-400 text-4xl mb-2">💳</div>
      <p class="text-gray-500">No hay historial de pagos disponible</p>
      <p class="text-xs text-gray-400 mt-1">
        Los pagos se registrarán automáticamente
      </p>
    </div>

    <!-- Payment summary -->
    <div v-if="pedido" class="bg-blue-50 rounded-lg p-4 mt-4">
      <h5 class="font-medium text-blue-900 mb-2">📊 Resumen de Pagos</h5>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-blue-700">Total del pedido:</span>
          <div class="font-bold text-blue-900">{{ formatCurrency(pedido.total) }}</div>
        </div>
        <div>
          <span class="text-blue-700">Total pagado:</span>
          <div class="font-bold" :class="totalPaid >= pedido.total ? 'text-green-600' : 'text-orange-600'">
            {{ formatCurrency(totalPaid) }}
          </div>
        </div>
        <div>
          <span class="text-blue-700">Saldo pendiente:</span>
          <div class="font-bold" :class="remainingBalance > 0 ? 'text-red-600' : 'text-green-600'">
            {{ formatCurrency(remainingBalance) }}
          </div>
        </div>
        <div>
          <span class="text-blue-700">Estado:</span>
          <div class="font-bold">
            <span v-if="remainingBalance <= 0" class="text-green-600">✅ Completo</span>
            <span v-else class="text-orange-600">⏳ Pendiente</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { supabase } from '@/lib/supabase'

const props = defineProps({
  pedido: {
    type: Object,
    required: true
  }
})

const payments = ref([])
const loading = ref(false)

const totalPaid = computed(() => {
  return payments.value.reduce((sum, payment) => sum + payment.monto, 0)
})

const remainingBalance = computed(() => {
  return Math.max(0, props.pedido.total - totalPaid.value)
})

const loadPaymentHistory = async () => {
  try {
    loading.value = true
    
    const { data, error } = await supabase
      .from('historial_pagos')
      .select('*')
      .eq('pedido_id', props.pedido.id)
      .order('fecha', { ascending: false })
    
    if (error) {
      console.warn('⚠️ No se pudo cargar historial de pagos:', error)
      // Si la tabla no existe, usar datos del pedido
      payments.value = []
      return
    }
    
    payments.value = data || []
    
  } catch (error) {
    console.error('❌ Error cargando historial de pagos:', error)
    payments.value = []
  } finally {
    loading.value = false
  }
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

const getPaymentIcon = (tipo) => {
  switch (tipo) {
    case 'PAGO_INICIAL':
      return '💰'
    case 'PAGO_ADICIONAL':
      return '💳'
    case 'PAGO_COMPLETO':
      return '✅'
    default:
      return '💵'
  }
}

const getPaymentTypeClass = (tipo) => {
  switch (tipo) {
    case 'PAGO_INICIAL':
      return 'border-blue-400'
    case 'PAGO_ADICIONAL':
      return 'border-orange-400'
    case 'PAGO_COMPLETO':
      return 'border-green-400'
    default:
      return 'border-gray-400'
  }
}

// Cargar historial cuando cambie el pedido
watch(() => props.pedido.id, () => {
  if (props.pedido.id) {
    loadPaymentHistory()
  }
}, { immediate: true })
</script>
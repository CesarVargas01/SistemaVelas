<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-2xl font-bold text-gray-900">Gestión de Vendedores</h3>
      <button @click="showAddModal = true" class="btn-primary">
        ➕ Agregar Vendedor
      </button>
    </div>

    <!-- Lista de Vendedores -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="vendedor in store.vendedores" :key="vendedor.id" class="card">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h4 class="text-lg font-semibold text-gray-900">{{ vendedor.nombre }}</h4>
            <p class="text-gray-600">{{ vendedor.email }}</p>
            <p v-if="vendedor.telefono" class="text-gray-500 text-sm">{{ vendedor.telefono }}</p>
            
            <!-- Estadísticas del vendedor -->
            <div class="mt-3 space-y-1">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Pedidos:</span>
                <span class="font-medium">{{ getVendorStats(vendedor.id).pedidos }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Ventas:</span>
                <span class="font-medium text-green-600">{{ formatCurrency(getVendorStats(vendedor.id).ventas) }}</span>
              </div>
            </div>
          </div>
          
          <div>
            <button
              @click="editVendor(vendedor)"
              class="btn-secondary text-sm px-3 py-1"
              title="Editar"
            >
              ✏️ Editar
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="store.vendedores.length === 0" class="text-center py-12">
      <div class="text-gray-400 text-6xl mb-4">👥</div>
      <p class="text-gray-500 text-lg">No hay vendedores registrados</p>
      <button @click="showAddModal = true" class="btn-primary mt-4">
        Agregar Primer Vendedor
      </button>
    </div>

    <!-- Modal Agregar/Editar Vendedor -->
    <div v-if="showAddModal || showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-md w-full">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-xl font-semibold">
              {{ showEditModal ? 'Editar Vendedor' : 'Agregar Vendedor' }}
            </h4>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <form @submit.prevent="saveVendor" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                v-model="vendorForm.nombre"
                type="text"
                required
                class="input-field"
                placeholder="Nombre completo del vendedor"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                v-model="vendorForm.email"
                type="email"
                required
                class="input-field"
                placeholder="email@ejemplo.com"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                v-model="vendorForm.telefono"
                type="tel"
                class="input-field"
                placeholder="Número de teléfono"
              />
            </div>

            <div class="flex space-x-3 pt-4">
              <button type="submit" :disabled="loading" class="flex-1 btn-primary disabled:opacity-50">
                <span v-if="loading">Guardando...</span>
                <span v-else">{{ showEditModal ? 'Actualizar' : 'Agregar' }} Vendedor</span>
              </button>
              <button type="button" @click="closeModal" class="flex-1 btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useMainStore } from '@/stores/main'
import { supabase } from '@/lib/supabase'

const store = useMainStore()

// Estado de modales
const showAddModal = ref(false)
const showEditModal = ref(false)
const loading = ref(false)

// Formulario
const vendorForm = reactive({
  id: null,
  nombre: '',
  email: '',
  telefono: ''
})

// Métodos
const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  resetForm()
}

const resetForm = () => {
  vendorForm.id = null
  vendorForm.nombre = ''
  vendorForm.email = ''
  vendorForm.telefono = ''
}

const editVendor = (vendedor) => {
  vendorForm.id = vendedor.id
  vendorForm.nombre = vendedor.nombre
  vendorForm.email = vendedor.email
  vendorForm.telefono = vendedor.telefono || ''
  showEditModal.value = true
}

const saveVendor = async () => {
  try {
    loading.value = true
    
    const vendorData = {
      nombre: vendorForm.nombre,
      email: vendorForm.email,
      telefono: vendorForm.telefono || null
    }
    
    if (showEditModal.value) {
      // Actualizar vendedor
      const { error } = await supabase
        .from('vendedores')
        .update(vendorData)
        .eq('id', vendorForm.id)
      
      if (error) throw error
      
      alert('Vendedor actualizado exitosamente')
    } else {
      // Crear vendedor
      const { error } = await supabase
        .from('vendedores')
        .insert([vendorData])
      
      if (error) throw error
      
      alert('Vendedor agregado exitosamente')
    }
    
    await store.loadVendedores()
    closeModal()
    
  } catch (error) {
    console.error('Error guardando vendedor:', error)
    alert('Error al guardar vendedor: ' + error.message)
  } finally {
    loading.value = false
  }
}



const getVendorStats = (vendorId) => {
  const vendorOrders = store.pedidos.filter(p => p.vendedor_id === vendorId)
  return {
    pedidos: vendorOrders.length,
    ventas: vendorOrders.reduce((sum, order) => sum + order.total, 0)
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
</script>
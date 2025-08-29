<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-2xl font-bold text-gray-900">Gestión de Productos</h3>
      <button @click="showAddModal = true" class="btn-primary">
        ➕ Agregar Producto
      </button>
    </div>

    <!-- Lista de Productos -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div v-for="producto in store.productos" :key="producto.id" class="card group hover:scale-105 transition-transform duration-200">
        <!-- Imagen del producto -->
        <div class="aspect-square mb-1 overflow-hidden rounded-lg bg-gray-100">
          <img
            :src="producto.imagen"
            :alt="producto.nombre"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            @error="handleImageError"
          />
        </div>

        <!-- Información del producto -->
        <div class="space-y-0.5">
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg px-3 py-2 border border-blue-100">
            <h3 class="font-bold text-base text-gray-900 text-center leading-tight min-h-[2.25rem] flex items-center justify-center">
              {{ producto.nombre }}
            </h3>
          </div>
          
          <!-- Stock Badge del mismo tamaño que el botón -->
          <div class="mt-0.5">
            <div 
              :class="[
                'w-full px-3 py-2 rounded-lg text-sm font-medium text-center',
                producto.stock > 10 ? 'bg-green-500 text-white' :
                producto.stock > 0 ? 'bg-yellow-500 text-white' :
                'bg-red-500 text-white'
              ]"
              :aria-label="`Stock disponible: ${producto.stock} unidades`"
            >
              <span aria-hidden="true">📦</span> {{ producto.stock }} unidades
            </div>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="mt-1 grid grid-cols-2 gap-1">
          <button
            @click="editProduct(producto)"
            class="w-full btn-secondary text-sm"
          >
            ✏️ Editar
          </button>
          <button
            @click="confirmDelete(producto)"
            class="w-full btn-danger text-sm"
          >
            🗑️ Eliminar
          </button>
        </div>
      </div>
    </div>

    <div v-if="store.productos.length === 0" class="text-center py-12">
      <div class="text-gray-400 text-6xl mb-4">📦</div>
      <p class="text-gray-500 text-lg">No hay productos registrados</p>
      <button @click="showAddModal = true" class="btn-primary mt-4">
        Agregar Primer Producto
      </button>
    </div>

    <!-- Modal Agregar/Editar Producto -->
    <!-- Modal Agregar/Editar Producto -->
    <div v-if="showAddModal || showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="p-8">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-2xl font-bold text-gray-900">
              {{ showEditModal ? 'Editar Producto' : 'Agregar Producto' }}
            </h4>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600 text-2xl font-bold p-2 hover:bg-gray-100 rounded-full transition-colors">
              ✕
            </button>
          </div>

          <form @submit.prevent="saveProduct" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Producto *
              </label>
              <input
                v-model="productForm.nombre"
                type="text"
                required
                class="input-field"
                placeholder="Nombre del producto"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Stock Inicial *
              </label>
              <input
                v-model.number="productForm.stock"
                type="number"
                min="0"
                required
                class="input-field"
                placeholder="Cantidad en stock"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Precio Público *
                </label>
                <input
                  v-model.number="productForm.costo_publico"
                  type="number"
                  min="0"
                  step="100"
                  required
                  class="input-field"
                  placeholder="16000"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Precio Mayorista *
                </label>
                <input
                  v-model.number="productForm.costo_mayorista"
                  type="number"
                  min="0"
                  step="100"
                  required
                  class="input-field"
                  placeholder="13000"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Imagen del Producto *
              </label>
              <input
                v-if="!showEditModal"
                @change="handleImageUpload"
                type="file"
                accept="image/*"
                required
                class="input-field"
              />
              <input
                v-else
                @change.prevent="handleImageUpload"
                type="file"
                accept="image/*"
                class="input-field"
              />
              
              <div v-if="imagePreview" class="mt-2">
                <img :src="imagePreview" alt="Preview" class="w-32 h-32 object-cover rounded-lg" />
              </div>
            </div>

            <div class="flex space-x-3 pt-4">
              <button type="submit" :disabled="loading" class="flex-1 btn-primary disabled:opacity-50">
                <span v-if="loading">Guardando...</span>
                <span v-else>{{ showEditModal ? 'Actualizar' : 'Agregar' }} Producto</span>
              </button>
              <button type="button" @click="closeModal" class="flex-1 btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Eliminar Producto -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-md w-full shadow-2xl">
        <div class="p-8 text-center">
          <div class="text-red-500 text-5xl mb-4">
            🗑️
          </div>
          <h4 class="text-2xl font-bold text-gray-900 mb-2">
            ¿Estás seguro?
          </h4>
          <p class="text-gray-600 mb-6">
            Estás a punto de eliminar el producto <strong>"{{ productToDelete.nombre }}"</strong>. Esta acción no se puede deshacer.
          </p>
          <div class="flex space-x-3">
            <button @click="deleteProduct" :disabled="loading" class="flex-1 btn-danger disabled:opacity-50">
              <span v-if="loading">Eliminando...</span>
              <span v-else>Sí, eliminar</span>
            </button>
            <button @click="closeModal" class="flex-1 btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useMainStore } from '@/stores/main'
import { supabase } from '@/lib/supabase'
import { useNotificationStore } from '@/stores/notifications'

const store = useMainStore()
const notificationStore = useNotificationStore()

// Estado de modales
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const loading = ref(false)
const imagePreview = ref('')
const selectedFile = ref(null)
const productToDelete = ref(null)

// Formularios
const productForm = reactive({
  id: null,
  nombre: '',
  stock: 0,
  costo_publico: 16000,
  costo_mayorista: 13000,
  imagen: ''
})

// Métodos
const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  showDeleteModal.value = false
  resetForm()
}

const confirmDelete = (producto) => {
  productToDelete.value = producto
  showDeleteModal.value = true
}

const deleteProduct = async () => {
  if (!productToDelete.value) return
  try {
    loading.value = true
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('No estás autenticado.')
    const token = session.access_token

    const response = await fetch(`/api/productos/${productToDelete.value.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.error)

    notificationStore.showSuccess('¡Éxito!', result.message)
    await store.loadProductos()
    closeModal()
  } catch (error) {
    notificationStore.showError('Error al eliminar', error.message)
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  productForm.id = null
  productForm.nombre = ''
  productForm.stock = 0
  productForm.costo_publico = 16000
  productForm.costo_mayorista = 13000
  productForm.imagen = ''
  imagePreview.value = ''
  selectedFile.value = null
}

const handleImageError = (event) => {
  event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y3ZjdmNyIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TaW4gSW1hZ2VuPC90ZXh0Pgo8L3N2Zz4K'
}

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const editProduct = (producto) => {
  productForm.id = producto.id
  productForm.nombre = producto.nombre
  productForm.stock = producto.stock
  productForm.costo_publico = producto.costo_publico
  productForm.costo_mayorista = producto.costo_mayorista
  productForm.imagen = producto.imagen
  imagePreview.value = producto.imagen
  showEditModal.value = true
}

const saveProduct = async () => {
  try {
    loading.value = true
    
    let imageUrl = productForm.imagen
    
    // Subir imagen si hay una nueva
    if (selectedFile.value) {
      const fileExt = selectedFile.value.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `public/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('imagenes_productos')
        .upload(filePath, selectedFile.value)
      
      if (uploadError) throw uploadError
      
      const { data: urlData } = supabase.storage
        .from('imagenes_productos')
        .getPublicUrl(filePath)
      
      imageUrl = urlData.publicUrl
    }
    
    const productData = {
      nombre: productForm.nombre,
      stock: productForm.stock,
      costo_publico: productForm.costo_publico,
      costo_mayorista: productForm.costo_mayorista,
      imagen: imageUrl
    }
    
    if (showEditModal.value) {
      // Actualizar producto
      const { error } = await supabase
        .from('productos')
        .update(productData)
        .eq('id', productForm.id)
      
      if (error) throw error
      
      notificationStore.showSuccess('¡Éxito!', 'Producto actualizado exitosamente')
    } else {
      // Crear producto
      const { error } = await supabase
        .from('productos')
        .insert([productData])
      
      if (error) throw error
      
      notificationStore.showSuccess('¡Éxito!', 'Producto agregado exitosamente')
    }
    
    await store.loadProductos()
    closeModal()
    
  } catch (error) {
    console.error('Error guardando producto:', error)
    notificationStore.showError('Error al guardar', error.message)
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
</script>
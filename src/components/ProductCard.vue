<template>
  <div class="card group hover:scale-105 transition-transform duration-200">
    <!-- Imagen del producto -->
    <div class="aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100">
      <img
        :src="producto.imagen"
        :alt="producto.nombre"
        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        @error="handleImageError"
      />
    </div>

    <!-- Información del producto -->
    <div class="space-y-2">
      <h3 class="font-semibold text-lg text-gray-900 line-clamp-2">
        {{ producto.nombre }}
      </h3>
      
      <!-- Stock Badge más grande y vistoso -->
      <div class="flex justify-center mt-3">
        <span 
          :class="[
            'px-4 py-2 rounded-full text-sm font-bold shadow-md',
            producto.stock > 10 ? 'bg-green-500 text-white' :
            producto.stock > 0 ? 'bg-yellow-500 text-white' :
            'bg-red-500 text-white'
          ]"
        >
          📦 {{ producto.stock }} unidades
        </span>
      </div>
    </div>

    <!-- Acciones (si se muestran) -->
    <div v-if="showActions || showAdminActions" class="mt-4 space-y-2">
      <!-- Botón de agregar al carrito (solo si showActions es true y no estamos en modo admin) -->
      <button
        v-if="showActions && !showAdminActions"
        @click="$emit('add-to-cart', producto)"
        :disabled="producto.stock === 0"
        class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ producto.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito' }}
      </button>
      
      <!-- Botones de administración -->
      <div v-if="showAdminActions" class="flex space-x-2">
        <button
          @click="$emit('edit-product', producto)"
          class="flex-1 btn-secondary text-sm"
        >
          ✏️ Editar
        </button>
        <button
          @click="$emit('delete-product', producto)"
          class="flex-1 btn-danger text-sm"
        >
          🗑️ Eliminar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  producto: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: true
  },
  showAdminActions: {
    type: Boolean,
    default: false
  }
})

defineEmits(['add-to-cart', 'edit-product', 'delete-product'])

const handleImageError = (event) => {
  // Usar una imagen base64 simple en lugar de un servicio externo
  event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y3ZjdmNyIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TaW4gSW1hZ2VuPC90ZXh0Pgo8L3N2Zz4K'
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

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
<template>
  <div class="space-y-8">
    <!-- Products Grid -->
    <div>
      <h3 class="text-2xl font-bold text-gray-900 mb-6">Productos Disponibles</h3>
      
      <div v-if="store.productos.length === 0" class="text-center py-12">
        <div class="text-gray-400 text-6xl mb-4">📦</div>
        <p class="text-gray-500 text-lg">No hay productos disponibles</p>
      </div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <ProductCard
          v-for="producto in store.productos"
          :key="producto.id"
          :producto="producto"
          :show-actions="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '@/stores/main'
import ProductCard from '@/components/ProductCard.vue'

const store = useMainStore()

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
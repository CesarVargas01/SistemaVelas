<template>
  <div class="space-y-6">
    <h3 class="text-2xl font-bold text-gray-900">Dashboard de Estadísticas</h3>
    
    <!-- Tarjetas de Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-100 text-sm">Total Productos</p>
            <p class="text-3xl font-bold">{{ store.productos.length }}</p>
          </div>
          <div class="text-4xl opacity-80">📦</div>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-100 text-sm">Stock Total</p>
            <p class="text-3xl font-bold">{{ store.totalStock }}</p>
          </div>
          <div class="text-4xl opacity-80">📊</div>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-purple-100 text-sm">Total Pedidos</p>
            <p class="text-3xl font-bold">{{ store.pedidos.length }}</p>
          </div>
          <div class="text-4xl opacity-80">🛒</div>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-yellow-100 text-sm">Ventas Totales</p>
            <p class="text-2xl font-bold">{{ formatCurrency(store.totalVentas) }}</p>
          </div>
          <div class="text-4xl opacity-80">💰</div>
        </div>
      </div>
    </div>

    <!-- Gráficos y Tablas -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Ventas por Producto -->
      <div class="card">
        <h4 class="text-lg font-semibold mb-4">📈 Ventas por Producto</h4>
        <div class="space-y-3">
          <div 
            v-for="venta in ventasPorProducto" 
            :key="venta.nombre"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p class="font-medium">{{ venta.nombre }}</p>
              <p class="text-sm text-gray-500">{{ venta.cantidad }} unidades vendidas</p>
            </div>
            <div class="text-right">
              <p class="font-bold text-green-600">{{ formatCurrency(venta.totalValor) }}</p>
              <p class="text-xs text-gray-500">Stock: {{ venta.stock }}</p>
            </div>
          </div>
          
          <div v-if="ventasPorProducto.length === 0" class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">📊</div>
            <p>No hay ventas registradas</p>
          </div>
        </div>
      </div>

      <!-- Ventas por Vendedor -->
      <div class="card">
        <h4 class="text-lg font-semibold mb-4">👥 Ventas por Vendedor</h4>
        <div class="space-y-3">
          <div 
            v-for="venta in ventasPorVendedor" 
            :key="venta.nombre"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p class="font-medium">{{ venta.nombre }}</p>
              <p class="text-sm text-gray-500">{{ venta.cantidad }} pedidos</p>
            </div>
            <div class="text-right">
              <p class="font-bold text-blue-600">{{ formatCurrency(venta.totalValor) }}</p>
            </div>
          </div>
          
          <div v-if="ventasPorVendedor.length === 0" class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">👥</div>
            <p>No hay ventas por vendedor</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Productos con Bajo Stock -->
    <div class="card">
      <h4 class="text-lg font-semibold mb-4">⚠️ Productos con Bajo Stock</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="producto in productosConBajoStock" 
          :key="producto.id"
          class="p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <div class="flex items-center space-x-3">
            <img 
              :src="producto.imagen" 
              :alt="producto.nombre"
              class="w-12 h-12 object-cover rounded-lg"
            />
            <div>
              <p class="font-medium text-red-900">{{ producto.nombre }}</p>
              <p class="text-sm text-red-600">Stock: {{ producto.stock }} unidades</p>
            </div>
          </div>
        </div>
        
        <div v-if="productosConBajoStock.length === 0" class="col-span-full text-center py-8 text-gray-500">
          <div class="text-4xl mb-2">✅</div>
          <p>Todos los productos tienen stock suficiente</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMainStore } from '@/stores/main'

const store = useMainStore()

const ventasPorProducto = computed(() => {
  const ventas = {}
  
  store.pedidos.forEach(pedido => {
    const productName = pedido.producto?.nombre || 'Desconocido'
    if (!ventas[productName]) {
      ventas[productName] = { cantidad: 0, totalValor: 0 }
    }
    ventas[productName].cantidad += pedido.cantidad
    ventas[productName].totalValor += pedido.total
  })
  
  return Object.entries(ventas)
    .map(([nombre, stats]) => {
      const producto = store.productos.find(p => p.nombre === nombre)
      return { 
        nombre, 
        cantidad: stats.cantidad, 
        stock: producto ? producto.stock : 'N/A', 
        totalValor: stats.totalValor 
      }
    })
    .sort((a, b) => b.totalValor - a.totalValor)
})

const ventasPorVendedor = computed(() => {
  const ventas = {}
  
  store.pedidos.forEach(pedido => {
    const vendorName = pedido.vendedor?.nombre || 'Desconocido'
    if (!ventas[vendorName]) {
      ventas[vendorName] = { cantidad: 0, totalValor: 0 }
    }
    ventas[vendorName].cantidad++
    ventas[vendorName].totalValor += pedido.total
  })
  
  return Object.entries(ventas)
    .map(([nombre, stats]) => ({ 
      nombre, 
      cantidad: stats.cantidad, 
      totalValor: stats.totalValor 
    }))
    .sort((a, b) => b.totalValor - a.totalValor)
})

const productosConBajoStock = computed(() => {
  return store.productos.filter(producto => producto.stock <= 5)
})

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
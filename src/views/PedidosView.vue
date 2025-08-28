<template>
  <div class="space-y-8">
    <div class="text-center">
      <h2 class="text-3xl font-bold text-gray-900 mb-2">Realizar Pedido</h2>
      <p class="text-gray-600">Selecciona productos y completa la información del pedido</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Formulario de Pedido -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Información del Vendedor -->
        <div class="card">
          <h3 class="text-xl font-semibold mb-4">👤 Información del Vendedor</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Vendedor *
              </label>
              <select v-model="selectedVendedorId" class="select-field">
                <option value="">Seleccione un vendedor</option>
                <option 
                  v-for="vendedor in store.vendedores" 
                  :key="vendedor.id" 
                  :value="vendedor.id"
                >
                  {{ vendedor.nombre }} - {{ vendedor.email }}
                </option>
              </select>
            </div>
            
            <div v-if="selectedVendedor" class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-medium text-blue-900">Vendedor Seleccionado:</h4>
              <p class="text-blue-700">{{ selectedVendedor.nombre }}</p>
              <p class="text-blue-600 text-sm">{{ selectedVendedor.email }}</p>
            </div>
          </div>
        </div>

        <!-- Información del Cliente -->
        <div class="card">
          <h3 class="text-xl font-semibold mb-4">👥 Información del Cliente</h3>
          <div class="text-xs text-gray-500 mb-4 bg-blue-50 p-2 rounded">
            💡 El celular debe tener 10 dígitos y empezar con 3 (ej: 3001234567)
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Cliente *
              </label>
              <input
                v-model="clienteNombre"
                type="text"
                placeholder="Nombre completo del cliente"
                class="input-field"
                @input="searchClients"
              />
              
              <!-- Resultados de búsqueda -->
              <div v-if="clientSearchResults.length > 0" class="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                <button
                  v-for="cliente in clientSearchResults"
                  :key="cliente.id"
                  @click="selectClient(cliente)"
                  class="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div class="font-medium">{{ cliente.nombre }}</div>
                  <div class="text-sm text-gray-500">{{ cliente.celular }}</div>
                </button>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Celular *
              </label>
              <input
                v-model="clienteCelular"
                type="tel"
                placeholder="3001234567 (10 dígitos)"
                class="input-field"
                :class="{ 'border-red-500': celularError }"
                maxlength="10"
                @input="validateCelular"
              />
              <div v-if="celularError" class="text-red-500 text-xs mt-1">
                {{ celularError }}
              </div>
              <div v-else-if="clienteCelular && !celularError" class="text-green-500 text-xs mt-1">
                ✅ Número válido
              </div>
            </div>
          </div>
        </div>

        <!-- Selección de Productos -->
        <div class="card">
          <h3 class="text-xl font-semibold mb-4">🛍️ Agregar Productos</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Producto *
                </label>
                <select v-model="selectedProductoId" class="select-field">
                  <option value="">Seleccione un producto</option>
                  <option 
                    v-for="producto in availableProducts" 
                    :key="producto.id" 
                    :value="producto.id"
                  >
                    {{ producto.nombre }} (Stock: {{ producto.stock }})
                  </option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad *
                </label>
                <input
                  v-model.number="cantidad"
                  type="number"
                  min="1"
                  :max="selectedProduct?.stock || 1"
                  class="input-field"
                />
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nombres Personalizados (opcional)
              </label>
              <textarea
                v-model="nombresPersonalizados"
                placeholder="Nombres para personalizar las velas..."
                rows="3"
                class="input-field"
              ></textarea>
            </div>
            
            <button
              @click="addToCart"
              :disabled="!canAddToCart"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ➕ Agregar al Carrito
            </button>
          </div>
        </div>
      </div>

      <!-- Carrito y Resumen -->
      <div class="space-y-6">
        <!-- Carrito -->
        <div class="card">
          <h3 class="text-xl font-semibold mb-4">🛒 Carrito de Compras</h3>
          
          <div v-if="store.carrito.length === 0" class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">🛒</div>
            <p>El carrito está vacío</p>
          </div>
          
          <div v-else class="space-y-3">
            <div
              v-for="(item, index) in store.carrito"
              :key="index"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex-1">
                <h4 class="font-medium text-sm">{{ item.producto.nombre }}</h4>
                <p class="text-xs text-gray-500">Cantidad: {{ item.cantidad }}</p>
                <p v-if="item.nombres_personalizados" class="text-xs text-blue-600">
                  Personalizado: {{ item.nombres_personalizados }}
                </p>
              </div>
              <div class="text-right">
                <p class="font-medium text-sm">{{ formatCurrency(item.cantidad * store.precioGlobal) }}</p>
                <button
                  @click="store.removeFromCart(index)"
                  class="text-red-500 hover:text-red-700 text-xs"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen del Pedido -->
        <div v-if="store.carrito.length > 0" class="card">
          <h3 class="text-xl font-semibold mb-4">📊 Resumen del Pedido</h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span>Total de unidades:</span>
              <span class="font-medium">{{ store.totalUnidadesCarrito }}</span>
            </div>
            <div class="flex justify-between">
              <span>Precio por unidad:</span>
              <span class="font-medium">{{ formatCurrency(store.precioGlobal) }}</span>
            </div>
            <div class="border-t pt-3">
              <div class="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span class="text-primary-600">{{ formatCurrency(store.totalCarrito) }}</span>
              </div>
            </div>
            
            <div class="text-xs text-gray-500 bg-blue-50 p-2 rounded">
              💡 Tip: Pedidos de 12+ unidades obtienen precio mayorista
            </div>
          </div>
        </div>

        <!-- Información de Pago -->
        <div v-if="store.carrito.length > 0" class="card">
          <h3 class="text-xl font-semibold mb-4">💳 Información de Pago</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Medio de Pago
              </label>
              <select v-model="medioPago" class="select-field">
                <option value="">Seleccionar medio de pago</option>
                <option value="EFECTIVO">💵 Efectivo</option>
                <option value="NEQUI">📱 Nequi</option>
                <option value="DAVIPLATA">📱 Daviplata</option>
                <option value="TRANSFERENCIA">🏦 Transferencia</option>
                <option value="ABONO">💰 Abono (Pago Parcial)</option>
              </select>
            </div>
            
            <!-- Información de monto según el tipo de pago -->
            <div v-if="medioPago && medioPago !== ''" class="bg-gray-50 p-4 rounded-lg space-y-3">
              <div v-if="medioPago === 'ABONO'">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  💰 Monto del Abono
                </label>
                <input
                  v-model.number="montoAbono"
                  type="number"
                  min="0"
                  :max="store.totalCarrito"
                  class="input-field"
                  placeholder="¿Cuánto abona el cliente?"
                />
                <div class="mt-2 text-sm text-gray-600">
                  <div class="flex justify-between">
                    <span>Total del pedido:</span>
                    <span class="font-medium">{{ formatCurrency(store.totalCarrito) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Monto abonado:</span>
                    <span class="font-medium text-green-600">{{ formatCurrency(montoAbono || 0) }}</span>
                  </div>
                  <div class="flex justify-between border-t pt-1">
                    <span>Saldo pendiente:</span>
                    <span class="font-bold text-red-600">{{ formatCurrency(store.totalCarrito - (montoAbono || 0)) }}</span>
                  </div>
                </div>
              </div>
              
              <div v-else>
                <div class="text-sm text-gray-600">
                  <div class="flex justify-between items-center">
                    <span>💳 Monto a cancelar:</span>
                    <span class="text-lg font-bold text-green-600">{{ formatCurrency(store.totalCarrito) }}</span>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    Pago completo con {{ medioPago.toLowerCase() }}
                  </div>
                </div>
              </div>
            </div>
            
            <button
              @click="confirmOrder"
              :disabled="!canConfirmOrder"
              class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✅ Confirmar Pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useMainStore } from '@/stores/main'
import { supabase } from '@/lib/supabase'

const store = useMainStore()

// Estado del formulario
const selectedVendedorId = ref('')
const clienteNombre = ref('')
const clienteCelular = ref('')
const selectedProductoId = ref('')
const cantidad = ref(1)
const nombresPersonalizados = ref('')
const medioPago = ref('')
const montoAbono = ref(null)
const clientSearchResults = ref([])
const selectedClient = ref(null)
const celularError = ref('')

// Computed properties
const selectedVendedor = computed(() => {
  return store.vendedores.find(v => v.id === selectedVendedorId.value)
})

const selectedProduct = computed(() => {
  return store.productos.find(p => p.id === selectedProductoId.value)
})

const availableProducts = computed(() => {
  return store.productos.filter(p => p.stock > 0)
})

const canAddToCart = computed(() => {
  return selectedVendedorId.value && 
         selectedProductoId.value && 
         cantidad.value > 0 && 
         cantidad.value <= (selectedProduct.value?.stock || 0)
})

const canConfirmOrder = computed(() => {
  return store.carrito.length > 0 && 
         selectedVendedorId.value && 
         clienteNombre.value.trim() && 
         clienteCelular.value.trim() &&
         !celularError.value &&
         medioPago.value &&
         (medioPago.value !== 'ABONO' || (montoAbono.value > 0 && montoAbono.value <= store.totalCarrito))
})

// Métodos
const searchClients = () => {
  if (!clienteNombre.value.trim()) {
    clientSearchResults.value = []
    selectedClient.value = null
    return
  }
  
  clientSearchResults.value = store.clientes.filter(cliente => 
    cliente.nombre.toLowerCase().includes(clienteNombre.value.toLowerCase())
  ).slice(0, 5)
}

const selectClient = (cliente) => {
  selectedClient.value = cliente
  clienteNombre.value = cliente.nombre
  clienteCelular.value = cliente.celular || ''
  clientSearchResults.value = []
  validateCelular()
}

const validateCelular = () => {
  const celular = clienteCelular.value.trim()
  
  if (!celular) {
    celularError.value = 'El celular es obligatorio'
    return
  }
  
  // Solo números
  if (!/^\d+$/.test(celular)) {
    celularError.value = 'Solo se permiten números'
    return
  }
  
  // Exactamente 10 dígitos
  if (celular.length !== 10) {
    celularError.value = 'Debe tener exactamente 10 dígitos'
    return
  }
  
  // Mayor a 3000000000
  const numero = parseInt(celular)
  if (numero < 3000000000) {
    celularError.value = 'Debe ser mayor a 3000000000'
    return
  }
  
  // Debe empezar con 3
  if (!celular.startsWith('3')) {
    celularError.value = 'Los celulares en Colombia empiezan con 3'
    return
  }
  
  celularError.value = ''
}

const addToCart = () => {
  if (!canAddToCart.value) return
  
  const agregado = store.addToCart(selectedProduct.value, cantidad.value, nombresPersonalizados.value)
  
  if (agregado) {
    // Limpiar formulario solo si se agregó exitosamente
    selectedProductoId.value = ''
    cantidad.value = 1
    nombresPersonalizados.value = ''
    
    window.showNotification('✅ Producto agregado', `${selectedProduct.value.nombre} agregado al carrito`)
  }
  // Si no se agregó, el error ya se mostró en el store
}

const confirmOrder = async () => {
  if (!canConfirmOrder.value) return
  
  try {
    // Determinar cliente final
    let finalClientId = selectedClient.value?.id
    
    if (!finalClientId) {
      // Buscar cliente existente por nombre
      const existingClient = store.clientes.find(c => 
        c.nombre.toLowerCase() === clienteNombre.value.toLowerCase()
      )
      
      if (existingClient) {
        finalClientId = existingClient.id
      } else {
        // Crear nuevo cliente
        const { data, error } = await supabase
          .from('clientes')
          .insert([{ 
            nombre: clienteNombre.value.trim(), 
            celular: clienteCelular.value.trim() 
          }])
          .select()
        
        if (error) throw error
        
        finalClientId = data[0].id
        await store.loadClientes()
      }
    }
    
    console.log('📝 Validando stock disponible...')
    
    // Validar stock antes de crear pedidos
    const stockInsuficiente = []
    for (const item of store.carrito) {
      const producto = store.productos.find(p => p.id === item.producto.id)
      if (!producto) {
        throw new Error(`Producto ${item.producto.nombre} no encontrado`)
      }
      
      if (producto.stock < item.cantidad) {
        stockInsuficiente.push({
          nombre: producto.nombre,
          solicitado: item.cantidad,
          disponible: producto.stock
        })
      }
    }
    
    // Si hay productos con stock insuficiente, mostrar error
    if (stockInsuficiente.length > 0) {
      let mensaje = '❌ Stock insuficiente para:\n\n'
      stockInsuficiente.forEach(item => {
        mensaje += `• ${item.nombre}: Solicitado ${item.solicitado}, Disponible ${item.disponible}\n`
      })
      mensaje += '\nPor favor ajusta las cantidades o verifica el inventario.'
      
      window.showError('❌ Stock Insuficiente', mensaje)
      return
    }
    
    console.log('✅ Stock validado correctamente')
    console.log('📝 Preparando pedidos para insertar...')
    
    // Crear pedidos con estructura mejorada y distribución proporcional del abono
    const totalCarrito = store.totalCarrito
    const pedidosAInsertar = store.carrito.map((item, index) => {
      const itemTotal = item.cantidad * store.precioGlobal
      const pedido = {
        cliente_id: finalClientId,
        vendedor_id: selectedVendedorId.value,
        producto_id: item.producto.id,
        cantidad: item.cantidad,
        precio_unitario: store.precioGlobal,
        total: itemTotal,
        fecha: new Date().toISOString(),
        medio_pago: medioPago.value,
        estado: 'PENDIENTE'
      }
      
      // Agregar campos opcionales solo si tienen valor
      if (item.nombres_personalizados && item.nombres_personalizados.trim()) {
        pedido.nombres_personalizados = item.nombres_personalizados.trim()
      }
      
      if (medioPago.value === 'ABONO') {
        // Distribuir el abono proporcionalmente entre todos los productos
        const proporcion = itemTotal / totalCarrito
        const abonoProporcionado = Math.round((montoAbono.value || 0) * proporcion)
        
        console.log(`💰 Distribuyendo abono para ${item.producto.nombre}:`, {
          itemTotal,
          totalCarrito,
          proporcion: (proporcion * 100).toFixed(2) + '%',
          abonoTotal: montoAbono.value,
          abonoProporcionado,
          calculo: `${montoAbono.value} × ${proporcion.toFixed(4)} = ${abonoProporcionado}`
        })
        
        pedido.monto_abono = abonoProporcionado
        pedido.valor_cancelado = 0
      } else {
        pedido.monto_abono = 0
        pedido.valor_cancelado = itemTotal
      }
      
      return pedido
    })
    
    console.log('📋 Pedidos a insertar:', pedidosAInsertar)
    
    const { data, error } = await supabase
      .from('pedidos')
      .insert(pedidosAInsertar)
      .select()
    
    console.log('✅ Respuesta de Supabase:', { data, error })
    
    if (error) throw error
    
    // Limpiar formulario y carrito
    resetForm()
    store.clearCart()
    
    // Recargar datos
    await store.loadInitialData()
    
    window.showNotification(
      'Pedido confirmado exitosamente',
      `Total: ${formatCurrency(store.totalCarrito)}`
    )
    
  } catch (error) {
    console.error('❌ Error confirmando pedido:', error)
    
    let errorMessage = 'Error desconocido'
    
    if (error.code === '23505') {
      if (error.details && error.details.includes('monto_abono')) {
        errorMessage = 'Error: Restricción incorrecta en monto_abono. Ejecuta el script fix_unique_constraint.sql'
      } else {
        errorMessage = 'Error: Pedido duplicado. Intenta nuevamente.'
      }
    } else if (error.code === '23503') {
      errorMessage = 'Error: Datos de referencia inválidos (cliente, vendedor o producto).'
    } else if (error.code === '42703') {
      errorMessage = 'Error: Estructura de tabla incorrecta. Ejecuta el script fix_pedidos_table.sql'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    window.showError('❌ Error al confirmar pedido', errorMessage)
  }
}

const resetForm = () => {
  selectedVendedorId.value = ''
  clienteNombre.value = ''
  clienteCelular.value = ''
  selectedProductoId.value = ''
  cantidad.value = 1
  nombresPersonalizados.value = ''
  medioPago.value = ''
  montoAbono.value = null
  clientSearchResults.value = []
  selectedClient.value = null
  celularError.value = ''
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

// Watchers
watch(selectedProductoId, () => {
  if (selectedProduct.value) {
    cantidad.value = Math.min(cantidad.value, selectedProduct.value.stock)
  }
})
</script>
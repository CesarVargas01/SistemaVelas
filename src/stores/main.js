import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, handleSupabaseError, handleSupabaseSuccess } from '@/lib/supabase'

export const useMainStore = defineStore('main', () => {
  // Estado reactivo
  const productos = ref([])
  const vendedores = ref([])
  const pedidos = ref([])
  const clientes = ref([])
  const carrito = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Estado de autenticación
  const isAdminLoggedIn = ref(false)
  const currentUser = ref(null)

  // Computed properties
  const totalUnidadesCarrito = computed(() => {
    return carrito.value.reduce((sum, item) => sum + item.cantidad, 0)
  })

  const precioGlobal = computed(() => {
    return totalUnidadesCarrito.value >= 12 ? 13000 : 16000
  })

  const totalCarrito = computed(() => {
    return carrito.value.reduce((sum, item) => sum + (item.cantidad * precioGlobal.value), 0)
  })

  const totalStock = computed(() => {
    return productos.value.reduce((sum, prod) => sum + prod.stock, 0)
  })

  const totalVentas = computed(() => {
    return pedidos.value.reduce((sum, pedido) => sum + pedido.total, 0)
  })

  // Acciones para cargar datos
  const loadProductos = async () => {
    try {
      loading.value = true
      const { data, error: supabaseError } = await supabase
        .from('productos')
        .select('*')
        .order('nombre')

      if (supabaseError) throw supabaseError
      
      productos.value = data || []
      return handleSupabaseSuccess(data, 'Productos cargados')
    } catch (err) {
      error.value = err.message
      return handleSupabaseError(err)
    } finally {
      loading.value = false
    }
  }

  const loadVendedores = async () => {
    try {
      loading.value = true
      const { data, error: supabaseError } = await supabase
        .from('vendedores')
        .select('*')
        .order('nombre')

      if (supabaseError) throw supabaseError
      
      vendedores.value = data || []
      return handleSupabaseSuccess(data, 'Vendedores cargados')
    } catch (err) {
      error.value = err.message
      return handleSupabaseError(err)
    } finally {
      loading.value = false
    }
  }

  const loadClientes = async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre')

      if (supabaseError) throw supabaseError
      
      clientes.value = data || []
      return handleSupabaseSuccess(data, 'Clientes cargados')
    } catch (err) {
      error.value = err.message
      return handleSupabaseError(err)
    }
  }

  const loadPedidos = async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('pedidos')
        .select(`
          *,
          producto:productos(nombre),
          vendedor:vendedores(nombre),
          cliente:clientes(nombre)
        `)
        .order('fecha', { ascending: false })

      if (supabaseError) throw supabaseError
      
      pedidos.value = data || []
      return handleSupabaseSuccess(data, 'Pedidos cargados')
    } catch (err) {
      error.value = err.message
      return handleSupabaseError(err)
    }
  }

  // Función para cargar todos los datos iniciales
  const loadInitialData = async () => {
    await Promise.all([
      loadProductos(),
      loadVendedores(),
      loadClientes(),
      loadPedidos()
    ])
  }

  // Acciones del carrito
  const addToCart = (producto, cantidad, nombresPersonalizados = '') => {
    const existingItem = carrito.value.find(item => item.producto.id === producto.id)
    
    if (existingItem) {
      existingItem.cantidad += cantidad
    } else {
      carrito.value.push({
        producto,
        cantidad,
        nombres_personalizados: nombresPersonalizados
      })
    }
  }

  const removeFromCart = (index) => {
    carrito.value.splice(index, 1)
  }

  const clearCart = () => {
    carrito.value = []
  }

  // Función para limpiar errores
  const clearError = () => {
    error.value = null
  }

  return {
    // Estado
    productos,
    vendedores,
    pedidos,
    clientes,
    carrito,
    loading,
    error,
    isAdminLoggedIn,
    currentUser,
    
    // Computed
    totalUnidadesCarrito,
    precioGlobal,
    totalCarrito,
    totalStock,
    totalVentas,
    
    // Acciones
    loadProductos,
    loadVendedores,
    loadClientes,
    loadPedidos,
    loadInitialData,
    addToCart,
    removeFromCart,
    clearCart,
    clearError
  }
})
<template>
  <div class="min-h-[60vh] flex items-center justify-center">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">Iniciar Sesión</h2>
        <p class="mt-2 text-gray-600">Accede al panel de administración</p>
      </div>
      
      <form @submit.prevent="login" class="card space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Correo Electrónico
          </label>
          <input
            v-model="email"
            type="email"
            required
            class="input-field"
            placeholder="admin@ejemplo.com"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Contraseña
          </label>
          <input
            v-model="password"
            type="password"
            required
            class="input-field"
            placeholder="••••••••"
          />
        </div>
        
        <button
          type="submit"
          :disabled="loading"
          class="w-full btn-primary disabled:opacity-50"
        >
          <span v-if="loading">Iniciando sesión...</span>
          <span v-else>Iniciar Sesión</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMainStore } from '@/stores/main'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const store = useMainStore()

const email = ref('')
const password = ref('')
const loading = ref(false)

const login = async () => {
  if (!email.value || !password.value) {
    window.showError('Complete todos los campos')
    return
  }
  
  try {
    loading.value = true
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })
    
    if (error) throw error
    
    store.isAdminLoggedIn = true
    store.currentUser = data.user
    
    window.showNotification('Bienvenido, administrador')
    router.push('/admin')
    
  } catch (error) {
    console.error('Error de login:', error)
    window.showError('Error de autenticación', error.message)
  } finally {
    loading.value = false
  }
}
</script>
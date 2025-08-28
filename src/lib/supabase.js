import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uvfyjylzqkchrocrydkf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2ZnlqeWx6cWtjaHJvY3J5ZGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwODc1NTQsImV4cCI6MjA3MTY2MzU1NH0.hiu5dsQP1c_0nf5EhAWxEIhZAFHzWs39lj5YvRetut4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// Función helper para manejo de errores
export const handleSupabaseError = (error) => {
  console.error('Supabase Error:', error)
  return {
    success: false,
    error: error.message || 'Error desconocido'
  }
}

// Función helper para respuestas exitosas
export const handleSupabaseSuccess = (data, message = 'Operación exitosa') => {
  return {
    success: true,
    data,
    message
  }
}
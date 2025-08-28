import { createRouter, createWebHistory } from 'vue-router'
import { useMainStore } from '@/stores/main'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'Sistema de Velas' }
  },
  {
    path: '/pedidos',
    name: 'Pedidos',
    component: () => import('@/views/PedidosView.vue'),
    meta: { title: 'Hacer Pedido' }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { 
      title: 'Panel de Administración',
      requiresAuth: true 
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Iniciar Sesión' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Guard de navegación para rutas protegidas
router.beforeEach((to, from, next) => {
  const store = useMainStore()
  
  // Actualizar título de la página
  document.title = to.meta.title || 'Sistema de Velas'
  
  // Verificar autenticación para rutas protegidas
  if (to.meta.requiresAuth && !store.isAdminLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router
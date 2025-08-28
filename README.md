# Sistema de Inventario de Velas

Una aplicación web moderna para gestionar inventario, pedidos y ventas de velas personalizadas.

## 🚀 Características

- **Gestión de Productos**: Agregar, editar y eliminar productos con imágenes
- **Sistema de Pedidos**: Proceso completo de pedidos con carrito de compras
- **Gestión de Vendedores**: Administrar vendedores y sus estadísticas
- **Dashboard Administrativo**: Visualización de estadísticas y métricas
- **Precios Dinámicos**: Precios públicos y mayoristas automáticos
- **Personalización**: Soporte para nombres personalizados en velas
- **Responsive**: Diseño adaptable a dispositivos móviles

## 🛠️ Tecnologías

- **Frontend**: Vue 3 + Composition API
- **Routing**: Vue Router 4
- **Estado**: Pinia
- **Estilos**: Tailwind CSS
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Almacenamiento**: Supabase Storage

## 📦 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd sistema-velas
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Editar `.env` con tus credenciales de Supabase:
   ```
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```

4. **Configurar base de datos**
   
   Ejecutar las siguientes consultas SQL en Supabase:

   ```sql
   -- Crear tablas
   CREATE TABLE productos (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     nombre TEXT NOT NULL,
     stock INTEGER NOT NULL DEFAULT 0,
     costo_publico DECIMAL(10,2) NOT NULL,
     costo_mayorista DECIMAL(10,2) NOT NULL,
     imagen TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE vendedores (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     nombre TEXT NOT NULL,
     email TEXT UNIQUE NOT NULL,
     telefono TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE clientes (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     nombre TEXT NOT NULL,
     celular TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE pedidos (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     cliente_id UUID REFERENCES clientes(id),
     vendedor_id UUID REFERENCES vendedores(id),
     producto_id UUID REFERENCES productos(id),
     cantidad INTEGER NOT NULL,
     nombres_personalizados TEXT,
     precio_unitario DECIMAL(10,2) NOT NULL,
     total DECIMAL(10,2) NOT NULL,
     fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     medio_pago TEXT,
     monto_abono DECIMAL(10,2),
     valor_cancelado DECIMAL(10,2),
     estado TEXT DEFAULT 'PENDIENTE'
   );

   -- Crear bucket para imágenes
   INSERT INTO storage.buckets (id, name, public) VALUES ('imagenes_productos', 'imagenes_productos', true);
   ```

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

## 🏗️ Estructura del Proyecto

```
src/
├── components/           # Componentes reutilizables
│   ├── admin/           # Componentes de administración
│   ├── AppHeader.vue    # Header de la aplicación
│   ├── ProductCard.vue  # Tarjeta de producto
│   └── ...
├── views/               # Vistas principales
│   ├── HomeView.vue     # Página de inicio
│   ├── PedidosView.vue  # Vista de pedidos
│   ├── AdminView.vue    # Panel administrativo
│   └── LoginView.vue    # Login de administrador
├── stores/              # Estado global (Pinia)
│   └── main.js          # Store principal
├── lib/                 # Utilidades
│   └── supabase.js      # Cliente de Supabase
├── router/              # Configuración de rutas
│   └── index.js
└── styles/              # Estilos globales
    └── main.css
```

## 📱 Uso

### Para Vendedores
1. Ir a "Hacer Pedido"
2. Seleccionar vendedor y cliente
3. Agregar productos al carrito
4. Completar información de pago
5. Confirmar pedido

### Para Administradores
1. Acceder al panel de administración
2. Gestionar productos, vendedores y pedidos
3. Ver estadísticas y métricas
4. Actualizar stock de productos

## 🔧 Configuración Adicional

### Precios Automáticos
- Pedidos de 1-11 unidades: Precio público
- Pedidos de 12+ unidades: Precio mayorista

### Estados de Pedidos
- **PENDIENTE**: Pedido recién creado
- **COMPLETADO**: Pedido entregado
- **CANCELADO**: Pedido cancelado

## 🚀 Despliegue

1. **Build de producción**
   ```bash
   npm run build
   ```

2. **Desplegar en Netlify/Vercel**
   - Conectar repositorio
   - Configurar variables de entorno
   - Desplegar desde la carpeta `dist`

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte o preguntas, crear un issue en el repositorio o contactar al equipo de desarrollo.
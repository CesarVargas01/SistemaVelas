const { createApp } = Vue;

const SUPABASE_URL = 'https://uvfyjylzqkchrocrydkf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2ZnlqeWx6cWtjaHJvY3J5ZGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwODc1NTQsImV4cCI6MjA3MTY2MzU1NH0.hiu5dsQP1c_0nf5EhAWxEIhZAFHzWs39lj5YvRetut4';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AppNotification = {
    props: ['message', 'isError', 'show'],
    template: `
        <div v-if="show" :class="{ 'error': isError, 'success': !isError }" class="notification-message">
            {{ message }}
        </div>
    `,
};

createApp({
    data() {
        return {
            // App State
            activeTab: 'cliente',
            isAdminLoggedIn: false,

            // Notification State
            clientNotification: { message: '', isError: false, show: false },
            adminNotification: { message: '', isError: false, show: false },

            // Raw Data
            productos: [],
            vendedores: [],
            pedidos: [],
            clientes: [],

            // Order & Cart
            carrito: [],
            vendedorSeleccionado: null,
            clienteSeleccionado: null,

            // Form Models
            formClienteNombre: '',
            formClienteCelular: '',
            formVendedorId: '',
            formProductoId: '',
            formCantidad: 1,
            formNombresPersonalizados: '',
            formMedioPago: '',
            formMontoAbono: null,
            formValorCancelado: null,
            clientSearchResults: [],
            formCostoPublico: 16000,
            formCostoMayorista: 13000,
            formProductoAEliminar: '',
        };
    },
    computed: {
        totalUnidadesCarrito() {
            return this.carrito.reduce((sum, item) => sum + item.cantidad, 0);
        },
        precioGlobal() {
            return this.totalUnidadesCarrito >= 12 ? 13000 : 16000;
        },
        totalCarrito() {
            return this.carrito.reduce((sum, item) => sum + (item.cantidad * this.precioGlobal), 0);
        },
        totalStock() {
            return this.productos.reduce((sum, prod) => sum + prod.stock, 0);
        },
        totalVentas() {
            return this.pedidos.reduce((sum, pedido) => sum + pedido.total, 0);
        },
        ventasPorProducto() {
            const ventas = {};
            this.pedidos.forEach(pedido => {
                const productName = pedido.producto?.nombre || 'Desconocido';
                if (!ventas[productName]) {
                    ventas[productName] = { cantidad: 0, totalValor: 0 };
                }
                ventas[productName].cantidad += pedido.cantidad;
                ventas[productName].totalValor += pedido.total;
            });
            return Object.entries(ventas).map(([nombre, stats]) => {
                const producto = this.productos.find(p => p.nombre === nombre);
                return { nombre, cantidad: stats.cantidad, stock: producto ? producto.stock : 'N/A', totalValor: stats.totalValor };
            });
        },
        ventasPorVendedor() {
            const ventas = {};
            this.pedidos.forEach(pedido => {
                const vendorName = pedido.vendedor?.nombre || 'Desconocido';
                if (!ventas[vendorName]) {
                    ventas[vendorName] = { cantidad: 0, totalValor: 0 };
                }
                ventas[vendorName].cantidad++;
                ventas[vendorName].totalValor += pedido.total;
            });
            return Object.entries(ventas).map(([nombre, stats]) => ({ nombre, cantidad: stats.cantidad, totalValor: stats.totalValor }));
        },
        selectedProductToDelete() {
            if (!this.formProductoAEliminar) return null;
            return this.productos.find(p => p.id === parseInt(this.formProductoAEliminar));
        }
    },
    mounted() {
        this.loadInitialData();
    },
    methods: {
        async loadInitialData() {
            await this.loadProductos();
            await this.loadVendedores();
            await this.loadPedidos();
            await this.loadClientes();
        },
        
        async loadProductos() {
            try {
                const { data, error } = await supabase.from('productos').select('*');
                if (error) throw error;
                this.productos = data || [];
            } catch (error) {
                console.error('Error cargando productos:', error);
                this.showNotification('Error al cargar productos', true);
            }
        },
        
        async loadVendedores() {
            try {
                const { data, error } = await supabase.from('vendedores').select('*');
                if (error) throw error;
                this.vendedores = data || [];
            } catch (error) {
                console.error('Error cargando vendedores:', error);
                this.showNotification('Error al cargar vendedores', true);
            }
        },
        
        async loadClientes() {
            try {
                const { data, error } = await supabase.from('clientes').select('*');
                if (error) throw error;
                this.clientes = data || [];
            } catch (error) {
                console.error('Error cargando clientes:', error);
            }
        },
        
        async loadPedidos() {
            try {
                const { data, error } = await supabase.from('pedidos').select('*, producto:productos(nombre), vendedor:vendedores(nombre), cliente:clientes(nombre)');
                if (error) throw error;
                this.pedidos = data || [];
            } catch (error) {
                console.error('Error cargando pedidos:', error);
                this.showNotification('Error al cargar pedidos', true);
            }
        },

        // FUNCIÓN CORREGIDA: Agregar Vendedor
        async addVendor(event) {
            event.preventDefault();
            
            const nombre = document.getElementById('nombre_vendedor').value.trim();
            const email = document.getElementById('email_vendedor').value.trim();
            const telefono = document.getElementById('telefono_vendedor').value.trim();
            
            if (!nombre || !email) {
                this.showAdminNotification('Por favor complete nombre y email', true);
                return;
            }
            
            // Verificar email duplicado
            if (this.vendedores.find(v => v.email.toLowerCase() === email.toLowerCase())) {
                this.showAdminNotification('Ya existe un vendedor con este email', true);
                return;
            }

            try {
                // Usar el endpoint del backend
                const response = await fetch('/api/vendedores', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ nombre, email, telefono })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // Limpiar formulario
                    document.getElementById('nombre_vendedor').value = '';
                    document.getElementById('email_vendedor').value = '';
                    document.getElementById('telefono_vendedor').value = '';
                    
                    // Recargar vendedores
                    await this.loadVendedores();
                    
                    this.showAdminNotification('Vendedor agregado exitosamente!', false);
                } else {
                    this.showAdminNotification(`Error: ${result.error}`, true);
                }
            } catch (error) {
                console.error('Error agregando vendedor:', error);
                this.showAdminNotification('Error de conexión', true);
            }
        },

        // FUNCIÓN CORREGIDA: Eliminar Producto
        async deleteProduct(event) {
            event.preventDefault();
            
            const productoId = parseInt(this.formProductoAEliminar);
            if (!productoId) {
                this.showAdminNotification('Por favor seleccione un producto', true);
                return;
            }

            const producto = this.productos.find(p => p.id === productoId);
            if (!producto) {
                this.showAdminNotification('Producto no encontrado', true);
                return;
            }

            if (!confirm(`¿Eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`)) {
                return;
            }

            try {
                this.showAdminNotification('Eliminando producto...', false);
                
                // Usar el endpoint del backend
                const response = await fetch(`/api/productos/${productoId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // Eliminar del array local inmediatamente
                    this.productos = this.productos.filter(p => p.id !== productoId);
                    this.formProductoAEliminar = '';
                    
                    // Recargar datos
                    await Promise.all([this.loadProductos(), this.loadPedidos()]);
                    
                    this.showAdminNotification(result.message, false);
                } else {
                    this.showAdminNotification(`Error: ${result.error}`, true);
                }
            } catch (error) {
                console.error('Error eliminando producto:', error);
                this.showAdminNotification('Error de conexión', true);
            }
        },

        // Resto de funciones existentes...
        cargarDatosVendedor() {
            if (this.formVendedorId) {
                this.vendedorSeleccionado = this.vendedores.find(v => v.id === this.formVendedorId);
            } else {
                this.vendedorSeleccionado = null;
            }
        },

        searchClient() {
            if (!this.formClienteNombre) {
                this.clientSearchResults = [];
                this.clienteSeleccionado = null;
                return;
            }
            this.clientSearchResults = this.clientes.filter(cliente => 
                cliente.nombre.toUpperCase().includes(this.formClienteNombre.toUpperCase())
            );
        },

        selectClient(cliente) {
            this.clienteSeleccionado = cliente;
            this.formClienteNombre = cliente.nombre;
            this.formClienteCelular = cliente.celular || '';
            this.clientSearchResults = [];
        },

        addToCart() {
            if (!this.formVendedorId) {
                this.showNotification('Por favor seleccione un vendedor', true);
                return;
            }
            if (!this.formProductoId || !this.formCantidad || this.formCantidad <= 0) {
                this.showNotification('Por favor seleccione un producto y cantidad válida', true);
                return;
            }
            const producto = this.productos.find(p => p.id === this.formProductoId);
            if (!producto) {
                this.showNotification('Producto no encontrado', true);
                return;
            }
            if (producto.stock < this.formCantidad) {
                this.showNotification(`Stock insuficiente. Solo quedan ${producto.stock} unidades`, true);
                return;
            }
            const existingItem = this.carrito.find(item => item.producto.id === this.formProductoId);
            if (existingItem) {
                existingItem.cantidad += this.formCantidad;
            } else {
                this.carrito.push({ 
                    producto: producto,
                    cantidad: this.formCantidad,
                    nombres_personalizados: this.formNombresPersonalizados
                });
            }
            this.formProductoId = '';
            this.formCantidad = 1;
            this.formNombresPersonalizados = '';
            this.showNotification('Producto agregado al carrito!');
        },

        removeFromCart(index) {
            this.carrito.splice(index, 1);
            this.showNotification('Producto eliminado del carrito');
        },

        async confirmOrder() {
            if (this.carrito.length === 0) {
                this.showNotification('El carrito está vacío', true);
                return;
            }
            if (!this.vendedorSeleccionado) {
                this.showNotification('Por favor seleccione un vendedor', true);
                return;
            }
            if (this.formMedioPago === 'ABONO' && (!this.formMontoAbono || this.formMontoAbono <= 0)) {
                this.showNotification('Por favor ingrese un monto de abono válido.', true);
                return;
            }

            let finalClientId = this.clienteSeleccionado ? this.clienteSeleccionado.id : null;
            if (!this.formClienteNombre) {
                this.showNotification('El nombre del cliente es obligatorio.', true);
                return;
            }

            if (!this.clienteSeleccionado) {
                const existingClient = this.clientes.find(c => c.nombre.toUpperCase() === this.formClienteNombre.toUpperCase());
                if (existingClient) {
                    finalClientId = existingClient.id;
                } else {
                    const { data, error } = await supabase.from('clientes').insert([{ nombre: this.formClienteNombre, celular: this.formClienteCelular }]).select();
                    if (error) {
                        this.showNotification('Error al guardar los datos del nuevo cliente.', true);
                        return;
                    }
                    finalClientId = data[0].id;
                    await this.loadClientes();
                }
            }
            
            if (!confirm('¿Desea confirmar este pedido?')) return;
            
            const pedidosAInsertar = this.carrito.map(item => ({
                cliente_id: finalClientId,
                vendedor_id: this.vendedorSeleccionado.id,
                producto_id: item.producto.id,
                cantidad: item.cantidad,
                nombres_personalizados: item.nombres_personalizados,
                precio_unitario: this.precioGlobal,
                total: item.cantidad * this.precioGlobal,
                fecha: new Date().toISOString(),
                medio_pago: this.formMedioPago,
                monto_abono: this.formMontoAbono,
                valor_cancelado: this.formValorCancelado
            }));

            const { error } = await supabase.from('pedidos').insert(pedidosAInsertar);

            if (error) {
                this.showNotification('Error al procesar el pedido.', true);
            } else {
                this.showNotification(`Pedido confirmado! Total: ${this.formatCurrency(this.totalCarrito)}`);
                this.resetOrderForm();
                await this.loadInitialData();
            }
        },

        resetOrderForm() {
            this.carrito = [];
            this.clienteSeleccionado = null;
            this.vendedorSeleccionado = null;
            this.formClienteNombre = '';
            this.formClienteCelular = '';
            this.formVendedorId = '';
            this.formProductoId = '';
            this.formCantidad = 1;
            this.formNombresPersonalizados = '';
            this.formMedioPago = '';
            this.formMontoAbono = null;
            this.formValorCancelado = null;
            this.clientSearchResults = [];
        },

        async updateInventory(event) {
            event.preventDefault();
            const productoId = parseInt(document.getElementById('update_producto').value);
            const nuevoStock = parseInt(document.getElementById('nuevo_stock').value);

            if (!productoId || isNaN(nuevoStock)) {
                this.showAdminNotification('Por favor seleccione un producto y ingrese un stock válido', true);
                return;
            }

            const selectedProduct = this.productos.find(p => p.id === productoId);
            if (!selectedProduct) {
                this.showAdminNotification('Producto no encontrado en el inventario.', true);
                return;
            }
            const oldStock = selectedProduct.stock;

            const { error } = await supabase.from('productos').update({ stock: nuevoStock }).eq('id', productoId);

            if (error) {
                this.showAdminNotification(`Error al actualizar stock: ${error.message}`, true);
            } else {
                await this.loadProductos();
                const stockChange = nuevoStock - oldStock;
                let message = `Stock de ${selectedProduct.nombre} actualizado correctamente.`;
                if (stockChange > 0) {
                    message += ` Se agregaron ${stockChange} unidades.`;
                } else if (stockChange < 0) {
                    message += ` Se restaron ${Math.abs(stockChange)} unidades.`;
                } else {
                    message += ` El stock no cambió.`;
                }
                message += ` Stock anterior: ${oldStock}, Stock actual: ${nuevoStock}.`;

                this.showAdminNotification(message, false);
                document.getElementById('inventory-update-form').reset();
            }
        },

        async addProduct(event) {
            event.preventDefault();
            const nombre = document.getElementById('nuevo_producto_nombre').value;
            const stock = parseInt(document.getElementById('nuevo_producto_stock').value);
            const costoPublico = parseFloat(document.getElementById('costo_publico').value);
            const costoMayorista = parseFloat(document.getElementById('costo_mayorista').value);
            const imageFile = document.getElementById('nueva_imagen_file').files[0];
            
            if (!nombre || isNaN(stock) || !imageFile || isNaN(costoPublico) || isNaN(costoMayorista)) {
                this.showAdminNotification('Por favor complete todos los campos y seleccione una imagen.', true);
                return;
            }
            
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `public/${fileName}`;
            
            const { error: uploadError } = await supabase.storage.from('imagenes_productos').upload(filePath, imageFile);
            if (uploadError) {
                this.showAdminNotification('Error al subir la imagen.', true);
                return;
            }
            
            const { data: urlData } = supabase.storage.from('imagenes_productos').getPublicUrl(filePath);
            if (!urlData) {
                this.showAdminNotification('Error al obtener la URL de la imagen.', true);
                return;
            }
            
            const publicURL = urlData.publicUrl;
            const { error: insertError } = await supabase.from('productos').insert([{
                nombre: nombre,
                stock: stock,
                imagen: publicURL,
                costo_publico: costoPublico,
                costo_mayorista: costoMayorista
            }]);
            
            if (insertError) {
                this.showAdminNotification(`Error al agregar producto: ${insertError.message}`, true);
            } else {
                await this.loadProductos();
                document.getElementById('add-product-form').reset();
                this.showAdminNotification('¡Producto agregado exitosamente!', false);
            }
        },

        async loginAdmin() {
            const email = document.getElementById('admin_email').value;
            const password = document.getElementById('admin_password').value;
            if (!email || !password) {
                this.showNotification('Por favor, ingrese email y contraseña.', true);
                return;
            }
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                this.showNotification(`Error: ${error.message}`, true);
                this.isAdminLoggedIn = false;
            } else {
                this.isAdminLoggedIn = true;
                this.showAdminNotification('Acceso concedido. Bienvenido, administrador.');
            }
        },

        showNotification(message, isError = false) {
            this.clientNotification.message = message;
            this.clientNotification.isError = isError;
            this.clientNotification.show = true;
            setTimeout(() => {
                this.clientNotification.show = false;
                this.clientNotification.message = '';
            }, 10000);
        },

        showAdminNotification(message, isError = false) {
            this.adminNotification.message = message;
            this.adminNotification.isError = isError;
            this.adminNotification.show = true;
            setTimeout(() => {
                this.adminNotification.show = false;
                this.adminNotification.message = '';
            }, 10000);
        },

        formatCurrency(value) {
            if (typeof value !== 'number') return value;
            return value.toLocaleString('es-CO', { 
                style: 'currency', 
                currency: 'COP', 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
            });
        }
    }
}).component('AppNotification', AppNotification).mount('#app');
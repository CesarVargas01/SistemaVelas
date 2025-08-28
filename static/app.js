const { createApp } = Vue;

const SUPABASE_URL = "https://uvfyjylzqkchrocrydkf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2ZnlqeWx6cWtjaHJvY3J5ZGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwODc1NTQsImV4cCI6MjA3MTY2MzU1NH0.hiu5dsQP1c_0nf5EhAWxEIhZAFHzWs39lj5YvRetut4";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AppNotification = {
  props: ["message", "isError", "show"],
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
      activeTab: "cliente",
      isAdminLoggedIn: false, // New property for admin login state

      // Notification State
      clientNotification: { message: "", isError: false, show: false },
      adminNotification: { message: "", isError: false, show: false },

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
      formClienteNombre: "",
      formClienteCelular: "",
      formVendedorId: "",
      formProductoId: "",
      formCantidad: 1,
      formNombresPersonalizados: "",
      formMedioPago: "",
      formMontoAbono: null,
      formValorCancelado: null,
      clientSearchResults: [],
      formCostoPublico: 16000,
      formCostoMayorista: 13000,
      formProductoAEliminar: "",
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
      return this.carrito.reduce(
        (sum, item) => sum + item.cantidad * this.precioGlobal,
        0
      );
    },
    totalStock() {
      return this.productos.reduce((sum, prod) => sum + prod.stock, 0);
    },
    totalVentas() {
      return this.pedidos.reduce((sum, pedido) => sum + pedido.total, 0);
    },
    ventasPorProducto() {
      const ventas = {};
      this.pedidos.forEach((pedido) => {
        const productName = pedido.producto?.nombre || "Desconocido";
        if (!ventas[productName]) {
          ventas[productName] = { cantidad: 0, totalValor: 0 };
        }
        ventas[productName].cantidad += pedido.cantidad;
        ventas[productName].totalValor += pedido.total;
      });
      return Object.entries(ventas).map(([nombre, stats]) => {
        const producto = this.productos.find((p) => p.nombre === nombre);
        return {
          nombre,
          cantidad: stats.cantidad,
          stock: producto ? producto.stock : "N/A",
          totalValor: stats.totalValor,
        };
      });
    },
    ventasPorVendedor() {
      const ventas = {};
      this.pedidos.forEach((pedido) => {
        const vendorName = pedido.vendedor?.nombre || "Desconocido";
        if (!ventas[vendorName]) {
          ventas[vendorName] = { cantidad: 0, totalValor: 0 };
        }
        ventas[vendorName].cantidad++;
        ventas[vendorName].totalValor += pedido.total;
      });
      return Object.entries(ventas).map(([nombre, stats]) => ({
        nombre,
        cantidad: stats.cantidad,
        totalValor: stats.totalValor,
      }));
    },
    selectedProductToDelete() {
      if (!this.formProductoAEliminar) return null;
      return this.productos.find(
        (p) => p.id === parseInt(this.formProductoAEliminar)
      );
    },
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
      console.log("🔄 Cargando productos...");
      const { data, error } = await supabase.from("productos").select("*");
      if (error) {
        console.error("❌ Error cargando productos:", error);
        this.showNotification("Error al cargar productos.", true);
      } else {
        console.log("✅ Productos cargados:", data);
        console.log("📊 Cantidad de productos:", data.length);

        // Forzar reactividad
        this.productos = [];
        this.$nextTick(() => {
          this.productos = data;
        });
      }
    },
    async loadVendedores() {
      const { data, error } = await supabase.from("vendedores").select("*");
      if (error) {
        this.showNotification("Error al cargar vendedores.", true);
      } else {
        this.vendedores = data;
      }
    },
    async loadClientes() {
      const { data, error } = await supabase.from("clientes").select("*");
      if (error) {
        this.showAdminNotification("Error al cargar clientes.", true);
      } else {
        this.clientes = data;
      }
    },
    async loadPedidos() {
      const { data, error } = await supabase
        .from("pedidos")
        .select(
          "*, producto:productos(nombre), vendedor:vendedores(nombre), cliente:clientes(nombre)"
        );
      if (error) {
        this.showNotification("Error al cargar pedidos.", true);
      } else {
        this.pedidos = data;
      }
    },
    cargarDatosVendedor() {
      // The vendorInfo div is now controlled by v-if="vendedorSeleccionado" in index.html
      // So, direct DOM manipulation for display is no longer needed.
      if (this.formVendedorId) {
        this.vendedorSeleccionado = this.vendedores.find(
          (v) => v.id === this.formVendedorId
        );
        if (this.vendedorSeleccionado) {
          // No longer need to manually update textContent, Vue handles it
        }
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
      this.clientSearchResults = this.clientes.filter((cliente) =>
        cliente.nombre
          .toUpperCase()
          .includes(this.formClienteNombre.toUpperCase())
      );
    },
    selectClient(cliente) {
      this.clienteSeleccionado = cliente;
      this.formClienteNombre = cliente.nombre;
      this.formClienteCelular = cliente.celular || "";
      this.clientSearchResults = [];
    },
    addToCart() {
      if (!this.formVendedorId) {
        this.showNotification("Por favor seleccione un vendedor", true);
        return;
      }
      if (
        !this.formProductoId ||
        !this.formCantidad ||
        this.formCantidad <= 0
      ) {
        this.showNotification(
          "Por favor seleccione un producto y cantidad válida",
          true
        );
        return;
      }
      const producto = this.productos.find((p) => p.id === this.formProductoId);
      if (!producto) {
        this.showNotification("Producto no encontrado", true);
        return;
      }
      if (producto.stock < this.formCantidad) {
        this.showNotification(
          `Stock insuficiente. Solo quedan ${producto.stock} unidades`,
          true
        );
        return;
      }
      const existingItem = this.carrito.find(
        (item) => item.producto.id === this.formProductoId
      );
      if (existingItem) {
        existingItem.cantidad += this.formCantidad;
      } else {
        this.carrito.push({
          producto: producto,
          cantidad: this.formCantidad,
          nombres_personalizados: this.formNombresPersonalizados,
        });
      }
      this.formProductoId = "";
      this.formCantidad = 1;
      this.formNombresPersonalizados = "";
      this.showNotification("Producto agregado al carrito!");
    },
    removeFromCart(index) {
      this.carrito.splice(index, 1);
      this.showNotification("Producto eliminado del carrito");
    },
    async confirmOrder() {
      if (this.carrito.length === 0) {
        this.showNotification("El carrito está vacío", true);
        return;
      }
      if (!this.vendedorSeleccionado) {
        this.showNotification("Por favor seleccione un vendedor", true);
        return;
      }
      if (
        this.formMedioPago === "ABONO" &&
        (!this.formMontoAbono || this.formMontoAbono <= 0)
      ) {
        this.showNotification(
          "Por favor ingrese un monto de abono válido.",
          true
        );
        return;
      }

      let finalClientId = this.clienteSeleccionado
        ? this.clienteSeleccionado.id
        : null;
      if (!this.formClienteNombre) {
        this.showNotification("El nombre del cliente es obligatorio.", true);
        return;
      }

      if (!this.clienteSeleccionado) {
        const existingClient = this.clientes.find(
          (c) => c.nombre.toUpperCase() === this.formClienteNombre.toUpperCase()
        );
        if (existingClient) {
          finalClientId = existingClient.id;
        } else {
          const { data, error } = await supabase
            .from("clientes")
            .insert([
              {
                nombre: this.formClienteNombre,
                celular: this.formClienteCelular,
              },
            ])
            .select();
          if (error) {
            this.showNotification(
              "Error al guardar los datos del nuevo cliente.",
              true
            );
            return;
          }
          finalClientId = data[0].id;
          await this.loadClientes();
        }
      }

      if (!confirm("¿Desea confirmar este pedido?")) return;

      const pedidosAInsertar = this.carrito.map((item) => ({
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
        valor_cancelado: this.formValorCancelado,
      }));

      const { error } = await supabase.from("pedidos").insert(pedidosAInsertar);

      if (error) {
        this.showNotification(`Error al procesar el pedido.`, true);
      } else {
        this.showNotification(
          `Pedido confirmado! Total: ${this.formatCurrency(this.totalCarrito)}`
        );
        this.resetOrderForm();
        await this.loadInitialData();
      }
    },
    resetOrderForm() {
      this.carrito = [];
      this.clienteSeleccionado = null;
      this.vendedorSeleccionado = null;
      this.formClienteNombre = "";
      this.formClienteCelular = "";
      this.formVendedorId = "";
      this.formProductoId = "";
      this.formCantidad = 1;
      this.formNombresPersonalizados = "";
      this.formMedioPago = "";
      this.formMontoAbono = null;
      this.formValorCancelado = null;
      this.clientSearchResults = [];
      const vendorInfo = document.getElementById("vendor-info");
      if (vendorInfo) vendorInfo.style.display = "none";
    },
    async updateInventory(event) {
      event.preventDefault();
      const productoId = parseInt(
        document.getElementById("update_producto").value
      );
      const nuevoStock = parseInt(document.getElementById("nuevo_stock").value);

      if (!productoId || isNaN(nuevoStock)) {
        this.showAdminNotification(
          "Por favor seleccione un producto y ingrese un stock válido",
          true
        );
        return;
      }

      // 1. Get the current stock before updating
      const selectedProduct = this.productos.find((p) => p.id === productoId);
      if (!selectedProduct) {
        this.showAdminNotification(
          "Producto no encontrado en el inventario.",
          true
        );
        return;
      }
      const oldStock = selectedProduct.stock;

      const { error } = await supabase
        .from("productos")
        .update({ stock: nuevoStock })
        .eq("id", productoId);

      if (error) {
        this.showAdminNotification(
          `Error al actualizar stock: ${error.message}`,
          true
        );
      } else {
        await this.loadProductos(); // Reloads data from Supabase

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
        document.getElementById("inventory-update-form").reset();

        const salesTable = document.getElementById("sales-table");
        if (salesTable) {
          salesTable.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    },
    async addVendor(event) {
      event.preventDefault();
      
      const nombre = document.getElementById("nombre_vendedor").value.trim();
      const email = document.getElementById("email_vendedor").value.trim();
      const telefono = document.getElementById("telefono_vendedor").value.trim();
      
      if (!nombre || !email) {
        this.showAdminNotification("Por favor complete nombre y email", true);
        return;
      }
      
      // Verificar email duplicado
      if (this.vendedores.find(v => v.email.toLowerCase() === email.toLowerCase())) {
        this.showAdminNotification("Ya existe un vendedor con este email", true);
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
        console.log('Respuesta del servidor:', result);

        if (response.ok && result.success) {
          // Limpiar formulario
          document.getElementById("nombre_vendedor").value = '';
          document.getElementById("email_vendedor").value = '';
          document.getElementById("telefono_vendedor").value = '';
          
          // Recargar vendedores
          await this.loadVendedores();
          
          this.showAdminNotification(result.message, false);
        } else {
          this.showAdminNotification(`Error: ${result.error}`, true);
        }
      } catch (error) {
        console.error('Error agregando vendedor:', error);
        this.showAdminNotification('Error de conexión', true);
      }
    },
    async addProduct(event) {
      event.preventDefault();
      const nombre = document.getElementById("nuevo_producto_nombre").value;
      const stock = parseInt(
        document.getElementById("nuevo_producto_stock").value
      );
      const costoPublico = parseFloat(
        document.getElementById("costo_publico").value
      );
      const costoMayorista = parseFloat(
        document.getElementById("costo_mayorista").value
      );
      const imageFile = document.getElementById("nueva_imagen_file").files[0];
      if (
        !nombre ||
        isNaN(stock) ||
        !imageFile ||
        isNaN(costoPublico) ||
        isNaN(costoMayorista)
      ) {
        this.showAdminNotification(
          "Por favor complete todos los campos y seleccione una imagen.",
          true
        );
        return;
      }
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("imagenes_productos")
        .upload(filePath, imageFile);
      if (uploadError) {
        this.showAdminNotification("Error al subir la imagen.", true);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("imagenes_productos")
        .getPublicUrl(filePath);
      if (!urlData) {
        this.showAdminNotification(
          "Error al obtener la URL de la imagen.",
          true
        );
        return;
      }
      const publicURL = urlData.publicUrl;
      const { data, error: insertError } = await supabase
        .from("productos")
        .insert([
          {
            nombre: nombre,
            stock: stock,
            imagen: publicURL,
            costo_publico: costoPublico,
            costo_mayorista: costoMayorista,
          },
        ]);
      if (insertError) {
        this.showAdminNotification(
          `Error al agregar producto: ${insertError.message}`,
          true
        );
      } else {
        await this.loadProductos();
        document.getElementById("add-product-form").reset();
        this.showAdminNotification("¡Producto agregado exitosamente!", false);
      }
    },
    async deleteProduct(event) {
      event.preventDefault();

      console.log("🔥 deleteProduct iniciado");
      console.log("formProductoAEliminar:", this.formProductoAEliminar);

      const productoId = parseInt(this.formProductoAEliminar);
      console.log("productoId parseado:", productoId);

      if (!productoId || isNaN(productoId)) {
        console.log("❌ ID de producto inválido");
        this.showAdminNotification(
          "Por favor seleccione un producto a eliminar",
          true
        );
        return;
      }

      const producto = this.productos.find((p) => p.id === productoId);
      console.log("Producto encontrado:", producto);

      if (!producto) {
        console.log("❌ Producto no encontrado en la lista");
        this.showAdminNotification("Producto no encontrado", true);
        return;
      }

      // Confirmación más detallada
      const confirmMessage =
        `¿Está seguro que desea eliminar "${producto.nombre}"?\n\n` +
        `• Se eliminarán ${producto.stock} unidades del inventario\n` +
        `• Se eliminarán todos los pedidos asociados\n` +
        `• Esta acción NO se puede deshacer\n\n` +
        `Escriba "ELIMINAR" para confirmar:`;

      const userConfirmation = prompt(confirmMessage);
      console.log("Confirmación del usuario:", userConfirmation);

      if (userConfirmation !== "ELIMINAR") {
        this.showAdminNotification("Eliminación cancelada", false);
        return;
      }

      console.log("🚀 Iniciando proceso de eliminación...");
      this.showAdminNotification(
        "Eliminando producto, por favor espere...",
        false
      );

      try {
        // 1. Eliminar pedidos asociados
        console.log("📦 Eliminando pedidos asociados...");
        const { data: pedidosData, error: deletePedidosError } = await supabase
          .from("pedidos")
          .delete()
          .eq("producto_id", productoId)
          .select();

        console.log("Pedidos eliminados:", pedidosData);

        if (deletePedidosError) {
          console.error("❌ Error eliminando pedidos:", deletePedidosError);
          throw new Error(
            `Error al eliminar pedidos: ${deletePedidosError.message}`
          );
        }

        // 2. Eliminar imagen del storage si existe
        if (producto.imagen && producto.imagen.includes("supabase")) {
          console.log("🖼️ Eliminando imagen del storage...");
          try {
            const imagePath = producto.imagen.split("/").pop();
            console.log("Ruta de imagen a eliminar:", imagePath);

            const { error: deleteImageError } = await supabase.storage
              .from("imagenes_productos")
              .remove([`public/${imagePath}`]);

            if (deleteImageError) {
              console.warn(
                "No se pudo eliminar la imagen:",
                deleteImageError.message
              );
            } else {
              console.log("✅ Imagen eliminada correctamente");
            }
          } catch (imageError) {
            console.warn(
              "Error al procesar eliminación de imagen:",
              imageError
            );
          }
        }

        // 3. Eliminar producto
        console.log("🗑️ Eliminando producto de la base de datos...");
        const { data: productData, error: deleteProductError } = await supabase
          .from("productos")
          .delete()
          .eq("id", productoId)
          .select();

        console.log("Producto eliminado:", productData);

        if (deleteProductError) {
          console.error("❌ Error eliminando producto:", deleteProductError);
          throw new Error(
            `Error al eliminar producto: ${deleteProductError.message}`
          );
        }

        // 4. Actualizar datos y UI
        console.log("🔄 Actualizando datos...");

        // Primero eliminar el producto del array local para respuesta inmediata
        const productoIndex = this.productos.findIndex(
          (p) => p.id === productoId
        );
        if (productoIndex !== -1) {
          this.productos.splice(productoIndex, 1);
          console.log("🗑️ Producto eliminado del array local");
        }

        // Luego recargar desde la base de datos para asegurar consistencia
        await Promise.all([this.loadProductos(), this.loadPedidos()]);

        this.formProductoAEliminar = "";
        console.log("✅ Eliminación completada exitosamente");

        // Forzar actualización de la vista
        this.$forceUpdate();

        this.showAdminNotification(
          `Producto "${producto.nombre}" eliminado exitosamente junto con todos sus pedidos asociados`,
          false
        );
      } catch (error) {
        console.error("❌ Error en deleteProduct:", error);
        this.showAdminNotification(
          `Error al eliminar producto: ${error.message}`,
          true
        );
      }
    },
    async loginAdmin() {
      const email = document.getElementById("admin_email").value;
      const password = document.getElementById("admin_password").value;
      if (!email || !password) {
        this.showNotification("Por favor, ingrese email y contraseña.", true);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        this.showNotification(`Error: ${error.message}`, true);
        this.isAdminLoggedIn = false; // Set to false on failed login
      } else {
        // The admin-section should also be controlled by v-if in index.html
        // document.querySelector('#administrador-tab .admin-section').style.display = 'none';
        // document.getElementById('admin-controls').style.display = 'block'; // Handled by v-if
        this.isAdminLoggedIn = true; // Set to true on successful login
        this.showAdminNotification(
          "Acceso concedido. Bienvenido, administrador."
        ); // Assuming 'login' is a valid type for admin login notification
      }
    },
    showNotification(message, isError = false) {
      this.clientNotification.message = message;
      this.clientNotification.isError = isError;
      this.clientNotification.show = true;
      setTimeout(() => {
        this.clientNotification.show = false;
        this.clientNotification.message = ""; // Clear message after hiding
      }, 10000);
    },
    showAdminNotification(message, isError = false) {
      this.adminNotification.message = message;
      this.adminNotification.isError = isError;
      this.adminNotification.show = true;
      setTimeout(() => {
        this.adminNotification.show = false;
        this.adminNotification.message = ""; // Clear message after hiding
      }, 10000);
    },
    formatCurrency(value) {
      if (typeof value !== "number") return value;
      return value.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    },

    // Función de prueba para verificar conectividad
    async testSupabaseConnection() {
      try {
        console.log("🔍 Probando conexión con Supabase...");

        // Probar SELECT
        const { data: selectData, error: selectError } = await supabase
          .from("productos")
          .select("id, nombre")
          .limit(1);

        if (selectError) {
          console.error("❌ Error en SELECT:", selectError);
          this.showAdminNotification(
            `Error SELECT: ${selectError.message}`,
            true
          );
          return;
        }

        console.log("✅ SELECT exitoso:", selectData);

        // Probar DELETE (sin ejecutar realmente)
        if (selectData && selectData.length > 0) {
          const testId = selectData[0].id;
          console.log("🧪 Probando DELETE con ID:", testId);

          // Solo verificar si podemos hacer la query sin ejecutarla
          const { error: deleteError } = await supabase
            .from("productos")
            .delete()
            .eq("id", -999); // ID que no existe para no eliminar nada real

          if (deleteError) {
            console.error("❌ Error en DELETE test:", deleteError);
            this.showAdminNotification(
              `Error DELETE: ${deleteError.message}`,
              true
            );
          } else {
            console.log("✅ DELETE test exitoso (sin eliminar datos)");
            this.showAdminNotification("Conexión y permisos OK", false);
          }
        }
      } catch (error) {
        console.error("❌ Error inesperado:", error);
        this.showAdminNotification(`Error inesperado: ${error.message}`, true);
      }
    },

    // Función simple de eliminación para testing
    async simpleDeleteTest() {
      const productoId = parseInt(this.formProductoAEliminar);
      if (!productoId) return;

      const producto = this.productos.find((p) => p.id === productoId);
      if (!producto) return;

      if (!confirm(`Eliminar ${producto.nombre}?`)) return;

      try {
        console.log("🧪 Test simple de eliminación...");
        console.log("🔍 Producto antes de eliminar:", producto);

        // Verificar que el producto existe en la base antes de eliminar
        const { data: beforeData, error: beforeError } = await supabase
          .from("productos")
          .select("id, nombre")
          .eq("id", productoId);

        console.log("📋 Producto en BD antes:", beforeData);

        // Solo eliminar el producto, sin pedidos ni imágenes
        const { data, error, count } = await supabase
          .from("productos")
          .delete()
          .eq("id", productoId)
          .select();

        console.log("🗑️ Resultado eliminación:", { data, error, count });

        // Verificar que el producto ya no existe después de eliminar
        const { data: afterData, error: afterError } = await supabase
          .from("productos")
          .select("id, nombre")
          .eq("id", productoId);

        console.log("📋 Producto en BD después:", afterData);

        if (error) {
          this.showAdminNotification(`Error: ${error.message}`, true);
        } else if (afterData && afterData.length > 0) {
          // El producto aún existe en la base de datos
          this.showAdminNotification(
            "⚠️ El producto no se eliminó de la base de datos. Problema de permisos RLS.",
            true
          );
          console.error("❌ RLS está bloqueando la eliminación");
        } else {
          // Eliminación exitosa
          this.productos = this.productos.filter((p) => p.id !== productoId);
          this.formProductoAEliminar = "";
          this.showAdminNotification(
            "✅ Eliminación exitosa confirmada",
            false
          );
        }
      } catch (error) {
        console.error("Error en test simple:", error);
        this.showAdminNotification(`Error: ${error.message}`, true);
      }
    },

    // Función para refrescar la lista manualmente
    async refreshProductList() {
      console.log("🔄 Refrescando lista de productos...");
      await this.loadProductos();
      this.showAdminNotification("Lista actualizada", false);
    },

    // Función para eliminar vía backend (solución para RLS)
    async deleteViaBackend() {
      const productoId = parseInt(this.formProductoAEliminar);
      if (!productoId) return;

      const producto = this.productos.find((p) => p.id === productoId);
      if (!producto) return;

      if (!confirm(`Eliminar ${producto.nombre} vía backend?`)) return;

      try {
        console.log("🚀 Eliminando vía backend...");

        const response = await fetch(`/api/productos/${productoId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();
        console.log("📡 Respuesta del backend:", result);

        if (response.ok && result.success) {
          // Actualizar lista inmediatamente
          this.productos = this.productos.filter((p) => p.id !== productoId);
          this.formProductoAEliminar = "";
          this.showAdminNotification(`✅ ${result.message}`, false);

          // Recargar para confirmar
          await this.loadProductos();
        } else {
          this.showAdminNotification(
            `❌ Error: ${result.error || "Error desconocido"}`,
            true
          );
        }
      } catch (error) {
        console.error("Error eliminando vía backend:", error);
        this.showAdminNotification(
          `❌ Error de conexión: ${error.message}`,
          true
        );
      }
    },
  },
})
  .component("AppNotification", AppNotification)
  .mount("#app");

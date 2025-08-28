import os
from dotenv import load_dotenv
from flask import Flask, render_template, url_for, jsonify, request
from supabase import create_client, Client

# Cargar variables de entorno desde .env
load_dotenv()

app = Flask(__name__, static_folder='static')

app.jinja_env.variable_start_string = '[['
app.jinja_env.variable_end_string = ']]'

# Configuración del cliente de Supabase
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# Ruta para servir el archivo HTML principal
@app.route('/')
def serve_html():
    return render_template('index.html')

# --- Rutas de la API (ejemplos que crearemos a continuación) ---

# Ejemplo de cómo obtener todos los productos
@app.route('/api/productos', methods=['GET'])
def get_productos():
    try:
        response = supabase.table('productos').select("*").execute()
        # La data está en response.data
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint para eliminar producto (solución temporal para RLS)
@app.route('/api/productos/<int:producto_id>', methods=['DELETE'])
def delete_producto(producto_id):
    try:
        # 1. Obtener información del producto antes de eliminar
        producto_response = supabase.table('productos').select("*").eq('id', producto_id).execute()
        if not producto_response.data:
            return jsonify({'error': 'Producto no encontrado'}), 404
        
        producto = producto_response.data[0]
        
        # 2. Eliminar pedidos asociados
        pedidos_response = supabase.table('pedidos').delete().eq('producto_id', producto_id).execute()
        
        # 3. Eliminar imagen del storage si existe
        if producto.get('imagen') and 'supabase' in producto['imagen']:
            try:
                image_path = producto['imagen'].split('/')[-1]
                supabase.storage.from_('imagenes_productos').remove([f'public/{image_path}'])
            except Exception as img_error:
                print(f"Error eliminando imagen: {img_error}")
        
        # 4. Eliminar producto
        delete_response = supabase.table('productos').delete().eq('id', producto_id).execute()
        
        return jsonify({
            'success': True, 
            'message': f'Producto "{producto["nombre"]}" eliminado exitosamente',
            'deleted_product': producto
        })
        
    except Exception as e:
        return jsonify({'error': f'Error al eliminar producto: {str(e)}'}), 500

# Endpoint para agregar vendedor (solución temporal para RLS)
@app.route('/api/vendedores', methods=['POST'])
def add_vendedor():
    try:
        print("🔥 Endpoint /api/vendedores llamado")
        data = request.get_json()
        print(f"📝 Datos recibidos: {data}")
        
        if not data or not data.get('nombre') or not data.get('email'):
            print("❌ Datos faltantes")
            return jsonify({'error': 'Nombre y email son requeridos'}), 400
        
        # Verificar si ya existe un vendedor con ese email
        print(f"🔍 Verificando email existente: {data['email']}")
        existing_response = supabase.table('vendedores').select("*").eq('email', data['email']).execute()
        print(f"📋 Vendedores existentes: {existing_response.data}")
        
        if existing_response.data:
            print("❌ Email duplicado")
            return jsonify({'error': 'Ya existe un vendedor con este email'}), 400
        
        # Insertar nuevo vendedor
        print("📤 Insertando nuevo vendedor...")
        insert_data = {
            'nombre': data['nombre'],
            'email': data['email'],
            'telefono': data.get('telefono', '')
        }
        print(f"📦 Datos a insertar: {insert_data}")
        
        insert_response = supabase.table('vendedores').insert([insert_data]).execute()
        print(f"📥 Respuesta de inserción: {insert_response}")
        
        if insert_response.data:
            print("✅ Vendedor insertado exitosamente")
            return jsonify({
                'success': True,
                'message': f'Vendedor "{data["nombre"]}" agregado exitosamente',
                'vendedor': insert_response.data[0]
            })
        else:
            print("❌ No se pudo insertar el vendedor")
            return jsonify({'error': 'Error al insertar vendedor'}), 500
        
    except Exception as e:
        print(f"❌ Error en add_vendedor: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Error al agregar vendedor: {str(e)}'}), 500

# --- Fin de rutas de la API ---

if __name__ == '__main__':
    app.run(debug=True)
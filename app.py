import os
from functools import wraps
from dotenv import load_dotenv
from flask import Flask, render_template, url_for, jsonify, request
from supabase import create_client, Client
import re

# Cargar variables de entorno desde .env
load_dotenv()

app = Flask(__name__, static_folder='static')

app.jinja_env.variable_start_string = '[['
app.jinja_env.variable_end_string = ']]'

# Configuración del cliente de Supabase
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# Decorador para verificar la autenticación
def auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Authorization header missing'}), 401

        try:
            token = auth_header.split(" ")[1]
            user = supabase.auth.get_user(token)
            if not user:
                return jsonify({'error': 'Invalid token'}), 401
        except Exception as e:
            return jsonify({'error': 'Authentication failed', 'details': str(e)}), 401

        return f(*args, **kwargs)
    return decorated_function

# --- Rutas de la API ---

@app.route('/api/productos', methods=['GET'])
def get_productos():
    try:
        response = supabase.table('productos').select("*").execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/productos/<producto_id>', methods=['DELETE'])
@auth_required
def delete_producto(producto_id):
    try:
        # Validar que el producto_id sea un UUID válido
        try:
            from uuid import UUID
            UUID(producto_id)
        except ValueError:
            return jsonify({'error': 'ID de producto inválido'}), 400

        producto_response = supabase.table('productos').select("*").eq('id', producto_id).execute()
        if not producto_response.data:
            return jsonify({'error': 'Producto no encontrado'}), 404
        
        producto = producto_response.data[0]
        
        supabase.table('pedidos').delete().eq('producto_id', producto_id).execute()
        
        if producto.get('imagen') and 'supabase' in producto['imagen']:
            try:
                # Extraer el path de la imagen de forma más robusta
                image_path = '/'.join(producto['imagen'].split('/')[-2:])
                supabase.storage.from_('imagenes_productos').remove([image_path])
            except Exception as img_error:
                print(f"Error eliminando imagen: {img_error}")
        
        supabase.table('productos').delete().eq('id', producto_id).execute()
        
        return jsonify({
            'success': True, 
            'message': f'Producto "{producto["nombre"]}" eliminado exitosamente',
        })
        
    except Exception as e:
        return jsonify({'error': f'Error al eliminar producto: {str(e)}'}), 500

@app.route('/api/vendedores', methods=['POST'])
@auth_required
def add_vendedor():
    try:
        data = request.get_json()
        
        # Validación de datos
        errors = {}
        if not data or not data.get('nombre') or len(data['nombre'].strip()) < 3:
            errors['nombre'] = 'El nombre es requerido y debe tener al menos 3 caracteres.'
        
        email = data.get('email')
        if not email or not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            errors['email'] = 'El email no es válido.'
        
        telefono = data.get('telefono', '')
        if telefono and not re.match(r"^\+?[0-9\s-]{7,15}$", telefono):
            errors['telefono'] = 'El número de teléfono no es válido.'

        if errors:
            return jsonify({'error': 'Datos inválidos', 'details': errors}), 400

        # Limpieza de datos
        clean_nombre = data['nombre'].strip()
        clean_email = email.lower().strip()
        clean_telefono = telefono.strip()

        # Verificar si ya existe un vendedor con ese email
        existing_response = supabase.table('vendedores').select("id").eq('email', clean_email).execute()
        if existing_response.data:
            return jsonify({'error': 'Ya existe un vendedor con este email'}), 409 # 409 Conflict
        
        # Insertar nuevo vendedor
        insert_data = {
            'nombre': clean_nombre,
            'email': clean_email,
            'telefono': clean_telefono
        }
        
        insert_response = supabase.table('vendedores').insert([insert_data]).execute()
        
        if insert_response.data:
            return jsonify({
                'success': True,
                'message': f'Vendedor "{clean_nombre}" agregado exitosamente',
                'vendedor': insert_response.data[0]
            }), 201 # 201 Created
        else:
            return jsonify({'error': 'No se pudo insertar el vendedor'}), 500
        
    except Exception as e:
        return jsonify({'error': f'Error al agregar vendedor: {str(e)}'}), 500

# --- Fin de rutas de la API ---

if __name__ == '__main__':
    app.run(debug=True)
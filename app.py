import os
from dotenv import load_dotenv
from flask import Flask, send_from_directory, jsonify
from supabase import create_client, Client

# Cargar variables de entorno desde .env
load_dotenv()

app = Flask(__name__)

# Configuración del cliente de Supabase
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# Ruta para servir el archivo HTML principal
@app.route('/')
def serve_html():
    return send_from_directory('.', 'codigobase.html')

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

# --- Fin de rutas de la API ---

if __name__ == '__main__':
    app.run(debug=True)
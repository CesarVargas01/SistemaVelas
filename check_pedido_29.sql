-- Script para verificar específicamente el pedido ID 29

-- 1. Verificar si existe el pedido con ID 29
SELECT * FROM pedidos WHERE id = 29;

-- 2. Verificar el tipo de dato de la columna ID
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pedidos' AND column_name = 'id';

-- 3. Ver todos los pedidos con sus IDs para verificar
SELECT id, cliente_id, producto_id, estado, fecha 
FROM pedidos 
ORDER BY id DESC 
LIMIT 10;

-- 4. Intentar actualizar manualmente el pedido 29
UPDATE pedidos 
SET estado = 'ENTREGADO' 
WHERE id = 29;

-- 5. Verificar si se actualizó
SELECT id, estado FROM pedidos WHERE id = 29;

-- 6. Ver si hay algún problema con constraints o triggers
SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'pedidos';
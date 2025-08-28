-- Script para debuggear la tabla pedidos

-- 1. Verificar estructura de la tabla
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'pedidos' 
ORDER BY ordinal_position;

-- 2. Ver algunos pedidos con todos los campos
SELECT id, cliente_id, vendedor_id, producto_id, cantidad, total, fecha, estado, medio_pago
FROM pedidos 
ORDER BY fecha DESC 
LIMIT 10;

-- 3. Contar pedidos por estado
SELECT estado, COUNT(*) as cantidad
FROM pedidos 
GROUP BY estado;

-- 4. Ver pedidos sin estado o con estado NULL
SELECT id, cliente_id, producto_id, estado
FROM pedidos 
WHERE estado IS NULL OR estado = '';

-- 5. Actualizar pedidos sin estado a PENDIENTE
UPDATE pedidos 
SET estado = 'PENDIENTE' 
WHERE estado IS NULL OR estado = '';

-- 6. Verificar que todos los pedidos tengan estado
SELECT COUNT(*) as total_pedidos,
       COUNT(CASE WHEN estado IS NOT NULL AND estado != '' THEN 1 END) as con_estado
FROM pedidos;
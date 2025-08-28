-- Verificar el estado actual de la tabla pedidos

-- 1. Contar total de pedidos
SELECT COUNT(*) as total_pedidos FROM pedidos;

-- 2. Ver todos los pedidos con sus IDs y estados
SELECT id, cliente_id, producto_id, cantidad, estado, fecha 
FROM pedidos 
ORDER BY id DESC;

-- 3. Verificar si existe el pedido 29 específicamente
SELECT COUNT(*) as existe_pedido_29 FROM pedidos WHERE id = 29;

-- 4. Ver la estructura completa de la tabla
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'pedidos' 
ORDER BY ordinal_position;

-- 5. Si no hay pedidos, crear uno de prueba
INSERT INTO pedidos (cliente_id, vendedor_id, producto_id, cantidad, precio_unitario, total, fecha, estado, medio_pago)
SELECT 
    (SELECT id FROM clientes LIMIT 1),
    (SELECT id FROM vendedores LIMIT 1), 
    (SELECT id FROM productos LIMIT 1),
    1,
    16000,
    16000,
    NOW(),
    'PENDIENTE',
    'EFECTIVO'
WHERE NOT EXISTS (SELECT 1 FROM pedidos);

-- 6. Verificar pedidos después de la inserción
SELECT id, cliente_id, producto_id, estado FROM pedidos ORDER BY id DESC LIMIT 5;
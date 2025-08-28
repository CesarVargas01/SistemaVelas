-- Arreglar restricción UNIQUE incorrecta en monto_abono

-- 1. Ver todas las restricciones de la tabla pedidos
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'pedidos'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 2. Eliminar la restricción UNIQUE incorrecta en monto_abono
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_monto_abono_key;

-- 3. Verificar que se eliminó
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'pedidos' AND constraint_type = 'UNIQUE';

-- 4. Limpiar datos duplicados si los hay
DELETE FROM pedidos a USING pedidos b 
WHERE a.id < b.id 
AND a.cliente_id = b.cliente_id 
AND a.producto_id = b.producto_id 
AND a.fecha::date = b.fecha::date;

-- 5. Verificar estructura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pedidos' 
ORDER BY ordinal_position;
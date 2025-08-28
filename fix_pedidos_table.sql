-- Arreglar estructura de tabla pedidos para evitar error 409

-- 1. Ver estructura actual
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'pedidos' 
ORDER BY ordinal_position;

-- 2. Agregar columnas faltantes si no existen
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS valor_cancelado DECIMAL(10,2);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS monto_abono DECIMAL(10,2);

-- 3. Actualizar pedidos existentes para evitar conflictos
UPDATE pedidos 
SET valor_cancelado = total 
WHERE valor_cancelado IS NULL AND medio_pago != 'ABONO';

UPDATE pedidos 
SET valor_cancelado = 0 
WHERE valor_cancelado IS NULL AND medio_pago = 'ABONO';

-- 4. Verificar que no hay duplicados o conflictos
SELECT id, cliente_id, vendedor_id, producto_id, fecha, COUNT(*) as duplicados
FROM pedidos 
GROUP BY id, cliente_id, vendedor_id, producto_id, fecha
HAVING COUNT(*) > 1;

-- 5. Ver algunos pedidos para verificar
SELECT id, cliente_id, producto_id, medio_pago, monto_abono, valor_cancelado, total
FROM pedidos 
ORDER BY id DESC 
LIMIT 5;
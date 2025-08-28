-- Actualizar tabla pedidos para incluir estados mejorados
-- Agregar columna estado si no existe
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'PENDIENTE';

-- Actualizar pedidos existentes que no tengan estado
UPDATE pedidos 
SET estado = 'PENDIENTE' 
WHERE estado IS NULL OR estado = '';

-- Crear índice para mejorar performance en consultas por estado
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);

-- Comentarios sobre los estados:
-- PENDIENTE: Pedido creado, esperando entrega
-- ENTREGADO: Pedido entregado al cliente
-- CANCELADO: Pedido cancelado por alguna razón
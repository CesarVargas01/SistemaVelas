-- Agregar campos adicionales a la tabla pedidos para mejor seguimiento de pagos

-- Agregar campos si no existen (solo los que realmente necesitamos)
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS valor_cancelado DECIMAL(10,2) DEFAULT 0;

-- Campos opcionales que se pueden agregar más tarde si se necesitan:
-- ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS fecha_ultimo_pago TIMESTAMPTZ;
-- ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS fecha_entrega TIMESTAMPTZ;
-- ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS observaciones_pago TEXT;

-- Actualizar valores existentes donde valor_cancelado sea NULL
UPDATE pedidos 
SET valor_cancelado = COALESCE(monto_abono, 0) 
WHERE valor_cancelado IS NULL OR valor_cancelado = 0;

-- Agregar índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_ultimo_pago ON pedidos(fecha_ultimo_pago);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_entrega ON pedidos(fecha_entrega);
CREATE INDEX IF NOT EXISTS idx_pedidos_valor_cancelado ON pedidos(valor_cancelado);

-- Agregar constraint para validar que valor_cancelado no sea negativo
ALTER TABLE pedidos 
ADD CONSTRAINT IF NOT EXISTS check_valor_cancelado_positive 
CHECK (valor_cancelado >= 0);

-- Comentarios para documentación
COMMENT ON COLUMN pedidos.fecha_ultimo_pago IS 'Fecha del último pago realizado';
COMMENT ON COLUMN pedidos.fecha_entrega IS 'Fecha cuando se entregó el pedido';
COMMENT ON COLUMN pedidos.observaciones_pago IS 'Observaciones adicionales sobre el pago';
COMMENT ON COLUMN pedidos.valor_cancelado IS 'Valor total cancelado/pagado del pedido';

-- Vista para consultas de pagos pendientes
CREATE OR REPLACE VIEW pedidos_con_saldo AS
SELECT 
  p.*,
  (p.total - COALESCE(p.valor_cancelado, 0)) as saldo_pendiente,
  CASE 
    WHEN p.total <= COALESCE(p.valor_cancelado, 0) THEN true 
    ELSE false 
  END as pago_completo,
  CASE 
    WHEN p.medio_pago = 'ABONO' AND p.total > COALESCE(p.valor_cancelado, 0) THEN 'PAGO_PENDIENTE'
    WHEN p.medio_pago = 'ABONO' AND p.total <= COALESCE(p.valor_cancelado, 0) THEN 'PAGO_COMPLETO'
    ELSE 'PAGO_UNICO'
  END as estado_pago
FROM pedidos p;

COMMENT ON VIEW pedidos_con_saldo IS 'Vista que incluye cálculos de saldo pendiente y estado de pago';
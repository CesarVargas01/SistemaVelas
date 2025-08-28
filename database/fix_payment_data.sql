-- Script para corregir y sincronizar datos de pagos
-- Este script asegura que valor_cancelado esté sincronizado con monto_abono

-- 1. Actualizar valor_cancelado donde esté NULL o sea 0 pero monto_abono tenga valor
UPDATE pedidos 
SET valor_cancelado = COALESCE(monto_abono, 0)
WHERE (valor_cancelado IS NULL OR valor_cancelado = 0) 
  AND monto_abono IS NOT NULL 
  AND monto_abono > 0;

-- 2. Verificar pedidos con inconsistencias
SELECT 
  id,
  total,
  monto_abono,
  valor_cancelado,
  medio_pago,
  estado,
  (total - COALESCE(valor_cancelado, monto_abono, 0)) as saldo_calculado
FROM pedidos 
WHERE medio_pago = 'ABONO'
  AND (
    valor_cancelado != monto_abono 
    OR valor_cancelado IS NULL 
    OR monto_abono IS NULL
  )
ORDER BY id DESC;

-- 3. Mostrar resumen de pedidos con ABONO
SELECT 
  'Total pedidos con ABONO' as descripcion,
  COUNT(*) as cantidad
FROM pedidos 
WHERE medio_pago = 'ABONO'

UNION ALL

SELECT 
  'Pedidos con saldo pendiente' as descripcion,
  COUNT(*) as cantidad
FROM pedidos 
WHERE medio_pago = 'ABONO'
  AND total > COALESCE(valor_cancelado, monto_abono, 0)

UNION ALL

SELECT 
  'Pedidos completamente pagados' as descripcion,
  COUNT(*) as cantidad
FROM pedidos 
WHERE medio_pago = 'ABONO'
  AND total <= COALESCE(valor_cancelado, monto_abono, 0);

-- 4. Crear función para calcular saldo pendiente
CREATE OR REPLACE FUNCTION calcular_saldo_pendiente(pedido_id BIGINT)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  pedido_record RECORD;
  saldo DECIMAL(10,2);
BEGIN
  SELECT total, COALESCE(valor_cancelado, monto_abono, 0) as pagado
  INTO pedido_record
  FROM pedidos 
  WHERE id = pedido_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  saldo := pedido_record.total - pedido_record.pagado;
  RETURN GREATEST(saldo, 0);
END;
$$ LANGUAGE plpgsql;

-- 5. Ejemplo de uso de la función
SELECT 
  id,
  total,
  COALESCE(valor_cancelado, monto_abono, 0) as pagado,
  calcular_saldo_pendiente(id) as saldo_pendiente
FROM pedidos 
WHERE medio_pago = 'ABONO'
ORDER BY id DESC
LIMIT 10;

-- 6. Comentarios para documentación
COMMENT ON FUNCTION calcular_saldo_pendiente(BIGINT) IS 'Calcula el saldo pendiente de un pedido considerando valor_cancelado o monto_abono';
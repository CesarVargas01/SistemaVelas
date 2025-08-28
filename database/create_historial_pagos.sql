-- Crear tabla para historial de pagos
-- Esta tabla permite llevar un registro detallado de todos los pagos realizados

CREATE TABLE IF NOT EXISTS historial_pagos (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tipo VARCHAR(50) NOT NULL DEFAULT 'PAGO_ADICIONAL',
  descripcion TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_historial_pagos_pedido_id ON historial_pagos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_historial_pagos_fecha ON historial_pagos(fecha);
CREATE INDEX IF NOT EXISTS idx_historial_pagos_tipo ON historial_pagos(tipo);

-- RLS (Row Level Security)
ALTER TABLE historial_pagos ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a usuarios autenticados
CREATE POLICY "Usuarios pueden ver historial de pagos" ON historial_pagos
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserción a usuarios autenticados
CREATE POLICY "Usuarios pueden insertar historial de pagos" ON historial_pagos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir actualización a usuarios autenticados
CREATE POLICY "Usuarios pueden actualizar historial de pagos" ON historial_pagos
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_historial_pagos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_historial_pagos_updated_at
  BEFORE UPDATE ON historial_pagos
  FOR EACH ROW
  EXECUTE FUNCTION update_historial_pagos_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE historial_pagos IS 'Registro detallado de todos los pagos realizados en pedidos';
COMMENT ON COLUMN historial_pagos.pedido_id IS 'ID del pedido al que pertenece el pago';
COMMENT ON COLUMN historial_pagos.monto IS 'Monto del pago realizado';
COMMENT ON COLUMN historial_pagos.tipo IS 'Tipo de pago: PAGO_INICIAL, PAGO_ADICIONAL, PAGO_COMPLETO, etc.';
COMMENT ON COLUMN historial_pagos.descripcion IS 'Descripción adicional del pago';
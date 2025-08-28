-- Solución simple: Deshabilitar RLS para todas las tablas (SOLO PARA DESARROLLO)

-- Deshabilitar RLS en todas las tablas principales
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY;

-- Verificar que se deshabilitó
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('productos', 'vendedores', 'clientes', 'pedidos');

-- Probar actualización del pedido 29
UPDATE pedidos SET estado = 'ENTREGADO' WHERE id = 29;

-- Verificar resultado
SELECT id, estado FROM pedidos WHERE id = 29;
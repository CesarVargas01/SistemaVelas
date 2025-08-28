-- Configurar Row Level Security para la tabla pedidos

-- 1. Verificar el estado actual de RLS
SELECT schemaname, tablename, rowsecurity, forcerowsecurity 
FROM pg_tables 
WHERE tablename = 'pedidos';

-- 2. Ver las políticas actuales
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'pedidos';

-- 3. Deshabilitar RLS temporalmente para testing (CUIDADO: Solo para desarrollo)
ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY;

-- 4. O crear políticas permisivas para desarrollo
-- Habilitar RLS
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (leer)
DROP POLICY IF EXISTS "Enable read access for all users" ON pedidos;
CREATE POLICY "Enable read access for all users" ON pedidos
    FOR SELECT USING (true);

-- Política para UPDATE (actualizar)
DROP POLICY IF EXISTS "Enable update access for all users" ON pedidos;
CREATE POLICY "Enable update access for all users" ON pedidos
    FOR UPDATE USING (true);

-- Política para INSERT (crear)
DROP POLICY IF EXISTS "Enable insert access for all users" ON pedidos;
CREATE POLICY "Enable insert access for all users" ON pedidos
    FOR INSERT WITH CHECK (true);

-- Política para DELETE (eliminar)
DROP POLICY IF EXISTS "Enable delete access for all users" ON pedidos;
CREATE POLICY "Enable delete access for all users" ON pedidos
    FOR DELETE USING (true);

-- 5. Verificar que las políticas se crearon
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'pedidos';

-- 6. Probar actualización manual
UPDATE pedidos SET estado = 'ENTREGADO' WHERE id = 29;

-- 7. Verificar que se actualizó
SELECT id, estado FROM pedidos WHERE id = 29;
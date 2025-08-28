-- SOLUCIÓN PARA PROBLEMAS DE RLS EN SUPABASE
-- Ejecuta estos comandos en Supabase Dashboard > SQL Editor

-- 1. Deshabilitar RLS en todas las tablas
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;

-- 2. O si prefieres mantener RLS pero permitir todas las operaciones:
-- (Ejecuta SOLO UNA de las dos opciones, no ambas)

-- Opción A: Políticas permisivas (más seguro)
CREATE POLICY "Allow all operations on productos" ON productos FOR ALL USING (true);
CREATE POLICY "Allow all operations on vendedores" ON vendedores FOR ALL USING (true);
CREATE POLICY "Allow all operations on pedidos" ON pedidos FOR ALL USING (true);
CREATE POLICY "Allow all operations on clientes" ON clientes FOR ALL USING (true);

-- 3. Verificar que las tablas existen y tienen los permisos correctos
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('productos', 'vendedores', 'pedidos', 'clientes');
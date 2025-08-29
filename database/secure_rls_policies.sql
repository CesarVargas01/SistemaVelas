-- SECURE RLS POLICIES FOR VALDA
-- This script enables RLS and creates secure policies for the tables.

-- 1. Enable RLS on all tables
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing permissive policies if they exist
DROP POLICY IF EXISTS "Allow all operations on productos" ON productos;
DROP POLICY IF EXISTS "Allow all operations on vendedores" ON vendedores;
DROP POLICY IF EXISTS "Allow all operations on clientes" ON clientes;
DROP POLICY IF EXISTS "Allow all operations on pedidos" ON pedidos;

-- 3. Create policies for 'productos' table
-- Allow public read access
CREATE POLICY "Allow public read access on productos"
  ON productos FOR SELECT
  USING (true);

-- Allow admins to perform all operations
CREATE POLICY "Allow admin full access on productos"
  ON productos FOR ALL
  USING (auth.role() = 'authenticated') -- Assuming admins are authenticated users
  WITH CHECK (auth.role() = 'authenticated');


-- 4. Create policies for 'vendedores' table
-- Allow public read access
CREATE POLICY "Allow public read access on vendedores"
  ON vendedores FOR SELECT
  USING (true);

-- Allow admins to perform all operations
CREATE POLICY "Allow admin full access on vendedores"
  ON vendedores FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- 5. Create policies for 'clientes' table
-- Allow authenticated users to see all clients
CREATE POLICY "Allow auth users to read clientes"
  ON clientes FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert new clients
CREATE POLICY "Allow auth users to insert clientes"
  ON clientes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow admins to update/delete clients
CREATE POLICY "Allow admin to update/delete clientes"
  ON clientes FOR UPDATE, DELETE
  USING (auth.role() = 'authenticated');


-- 6. Create policies for 'pedidos' table
-- Allow admins to see all orders
CREATE POLICY "Allow admin to read all pedidos"
  ON pedidos FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow users to insert their own orders.
-- This assumes that 'vendedor_id' might be linked to a user.
-- If there's no direct link, we might need a different approach.
-- For now, we'll restrict inserts to authenticated users.
CREATE POLICY "Allow auth users to insert pedidos"
  ON pedidos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow admins to update/delete orders
CREATE POLICY "Allow admin to update/delete pedidos"
  ON pedidos FOR UPDATE, DELETE
  USING (auth.role() = 'authenticated');

-- 7. Grant usage on schema and sequences to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;


-- 8. Policies for Supabase Storage
-- Allow public read access to product images
CREATE POLICY "Allow public read on product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'imagenes_productos');

-- Allow authenticated users to upload product images
CREATE POLICY "Allow admin insert on product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'imagenes_productos' AND auth.role() = 'authenticated');

-- Allow authenticated users to update product images
CREATE POLICY "Allow admin update on product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'imagenes_productos' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete product images
CREATE POLICY "Allow admin delete on product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'imagenes_productos' AND auth.role() = 'authenticated');

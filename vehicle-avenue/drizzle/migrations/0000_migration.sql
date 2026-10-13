
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  documento text,
  telefono text,
  ciudad text,
  direccion text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email,'@',1)));
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.vendedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  nombre_comercial text NOT NULL,
  nit text,
  telefono text,
  email text,
  ciudad text,
  calificacion numeric(2,1) NOT NULL DEFAULT 5.0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vendedores TO anon;
GRANT SELECT, INSERT, UPDATE ON public.vendedores TO authenticated;
GRANT ALL ON public.vendedores TO service_role;
ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vendedores public" ON public.vendedores FOR SELECT USING (true);
CREATE POLICY "vendedor insert own" ON public.vendedores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vendedor update own" ON public.vendedores FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.categorias (
  id serial PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE
);
GRANT SELECT ON public.categorias TO anon, authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categorias public" ON public.categorias FOR SELECT USING (true);

CREATE TABLE public.marcas (
  id serial PRIMARY KEY,
  nombre text NOT NULL,
  categoria_id int NOT NULL REFERENCES public.categorias(id),
  pais_origen text
);
GRANT SELECT ON public.marcas TO anon, authenticated;
GRANT ALL ON public.marcas TO service_role;
ALTER TABLE public.marcas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marcas public" ON public.marcas FOR SELECT USING (true);

CREATE TABLE public.vehiculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id uuid NOT NULL REFERENCES public.vendedores(id) ON DELETE CASCADE,
  categoria_id int NOT NULL REFERENCES public.categorias(id),
  marca_id int NOT NULL REFERENCES public.marcas(id),
  modelo text NOT NULL,
  anio int NOT NULL,
  precio numeric(14,0) NOT NULL,
  kilometraje int NOT NULL DEFAULT 0,
  color text,
  condicion text NOT NULL DEFAULT 'usado',
  combustible text,
  transmision text,
  descripcion text,
  imagen_url text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vehiculos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehiculos TO authenticated;
GRANT ALL ON public.vehiculos TO service_role;
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehiculos public" ON public.vehiculos FOR SELECT USING (true);
CREATE POLICY "vehiculos owner write" ON public.vehiculos FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.vendedores v WHERE v.id = vendedor_id AND v.user_id = auth.uid()));
CREATE POLICY "vehiculos owner update" ON public.vehiculos FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.vendedores v WHERE v.id = vendedor_id AND v.user_id = auth.uid()));
CREATE POLICY "vehiculos owner delete" ON public.vehiculos FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.vendedores v WHERE v.id = vendedor_id AND v.user_id = auth.uid()));

CREATE TABLE public.inventario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehiculo_id uuid NOT NULL UNIQUE REFERENCES public.vehiculos(id) ON DELETE CASCADE,
  stock int NOT NULL DEFAULT 1 CHECK (stock >= 0),
  ubicacion text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.inventario TO anon;
GRANT SELECT, INSERT, UPDATE ON public.inventario TO authenticated;
GRANT ALL ON public.inventario TO service_role;
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventario public" ON public.inventario FOR SELECT USING (true);
CREATE POLICY "inventario owner insert" ON public.inventario FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.vehiculos h JOIN public.vendedores v ON v.id = h.vendedor_id WHERE h.id = vehiculo_id AND v.user_id = auth.uid()));
CREATE POLICY "inventario owner update" ON public.inventario FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.vehiculos h JOIN public.vendedores v ON v.id = h.vendedor_id WHERE h.id = vehiculo_id AND v.user_id = auth.uid()));

CREATE TABLE public.carrito_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vehiculo_id uuid NOT NULL REFERENCES public.vehiculos(id) ON DELETE CASCADE,
  cantidad int NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, vehiculo_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carrito_items TO authenticated;
GRANT ALL ON public.carrito_items TO service_role;
ALTER TABLE public.carrito_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "carrito own" ON public.carrito_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  total numeric(14,0) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'pagado',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pedidos TO authenticated;
GRANT ALL ON public.pedidos TO service_role;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pedidos own" ON public.pedidos FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.detalle_pedido (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  vehiculo_id uuid NOT NULL REFERENCES public.vehiculos(id),
  cantidad int NOT NULL,
  precio_unitario numeric(14,0) NOT NULL
);
GRANT SELECT ON public.detalle_pedido TO authenticated;
GRANT ALL ON public.detalle_pedido TO service_role;
ALTER TABLE public.detalle_pedido ENABLE ROW LEVEL SECURITY;
CREATE POLICY "detalle own" ON public.detalle_pedido FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_id AND p.user_id = auth.uid()));

CREATE TABLE public.pagos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  metodo text NOT NULL,
  monto numeric(14,0) NOT NULL,
  estado text NOT NULL DEFAULT 'aprobado',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pagos TO authenticated;
GRANT ALL ON public.pagos TO service_role;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pagos own" ON public.pagos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_id AND p.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.realizar_pedido(p_metodo text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_pedido uuid; v_total numeric := 0; r record;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  IF NOT EXISTS (SELECT 1 FROM carrito_items WHERE user_id = v_uid) THEN RAISE EXCEPTION 'El carrito está vacío'; END IF;
  INSERT INTO pedidos (user_id) VALUES (v_uid) RETURNING id INTO v_pedido;
  FOR r IN SELECT c.vehiculo_id, c.cantidad, h.precio, i.stock FROM carrito_items c JOIN vehiculos h ON h.id = c.vehiculo_id LEFT JOIN inventario i ON i.vehiculo_id = c.vehiculo_id WHERE c.user_id = v_uid FOR UPDATE OF c LOOP
    IF COALESCE(r.stock,0) < r.cantidad THEN RAISE EXCEPTION 'Stock insuficiente para un vehículo'; END IF;
    UPDATE inventario SET stock = stock - r.cantidad, updated_at = now() WHERE vehiculo_id = r.vehiculo_id;
    INSERT INTO detalle_pedido (pedido_id, vehiculo_id, cantidad, precio_unitario) VALUES (v_pedido, r.vehiculo_id, r.cantidad, r.precio);
    v_total := v_total + r.precio * r.cantidad;
  END LOOP;
  UPDATE pedidos SET total = v_total WHERE id = v_pedido;
  INSERT INTO pagos (pedido_id, metodo, monto) VALUES (v_pedido, p_metodo, v_total);
  DELETE FROM carrito_items WHERE user_id = v_uid;
  RETURN v_pedido;
END $$;
REVOKE EXECUTE ON FUNCTION public.realizar_pedido(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.realizar_pedido(text) TO authenticated;

-- Datos de ejemplo
INSERT INTO public.categorias (id, nombre, slug) VALUES (1,'Carros','carro'),(2,'Motos','moto'),(3,'Bicicletas','bicicleta');
SELECT setval('public.categorias_id_seq', 3);
INSERT INTO public.marcas (id, nombre, categoria_id, pais_origen) VALUES
 (1,'Mazda',1,'Japón'),(2,'Renault',1,'Francia'),(3,'Chevrolet',1,'EE.UU.'),(4,'Toyota',1,'Japón'),
 (5,'Yamaha',2,'Japón'),(6,'Honda',2,'Japón'),(7,'AKT',2,'Colombia'),(8,'KTM',2,'Austria'),
 (9,'GW',3,'Colombia'),(10,'Specialized',3,'EE.UU.'),(11,'Trek',3,'EE.UU.'),(12,'Shimano Urban',3,'Japón');
SELECT setval('public.marcas_id_seq', 12);
INSERT INTO public.vendedores (id, nombre_comercial, nit, telefono, email, ciudad, calificacion) VALUES
 ('11111111-1111-1111-1111-111111111111','AutoAndes Medellín','900123456-1','3001234567','ventas@autoandes.co','Medellín',4.8),
 ('22222222-2222-2222-2222-222222222222','MotoRuta Bogotá','900654321-2','3109876543','hola@motoruta.co','Bogotá',4.6),
 ('33333333-3333-3333-3333-333333333333','Pedal Cali','901112233-3','3205551234','info@pedalcali.co','Cali',4.9);
INSERT INTO public.vehiculos (id, vendedor_id, categoria_id, marca_id, modelo, anio, precio, kilometraje, color, condicion, combustible, transmision, descripcion) VALUES
 ('a0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',1,1,'Mazda 3 Grand Touring',2021,89900000,32000,'Rojo','usado','Gasolina','Automática','Único dueño, mantenimientos en concesionario.'),
 ('a0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111',1,2,'Duster Intens',2022,78500000,18000,'Gris','usado','Gasolina','Manual','4x2, papeles al día, SOAT vigente.'),
 ('a0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111',1,4,'Corolla Cross Híbrida',2024,139000000,0,'Blanco','nuevo','Híbrido','Automática','0 km, garantía de fábrica.'),
 ('a0000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111',1,3,'Onix Turbo',2023,72000000,12000,'Azul','usado','Gasolina','Automática','Turbo 1.0, excelente consumo.'),
 ('a0000000-0000-0000-0000-000000000005','22222222-2222-2222-2222-222222222222',2,5,'MT-09',2023,58900000,5000,'Negro','usado','Gasolina','Manual','Naked 890cc, como nueva.'),
 ('a0000000-0000-0000-0000-000000000006','22222222-2222-2222-2222-222222222222',2,6,'CB190R',2024,11200000,0,'Rojo','nuevo','Gasolina','Manual','Ideal para ciudad.'),
 ('a0000000-0000-0000-0000-000000000007','22222222-2222-2222-2222-222222222222',2,7,'NKD 125',2022,5400000,15000,'Gris','usado','Gasolina','Manual','Económica y confiable.'),
 ('a0000000-0000-0000-0000-000000000008','22222222-2222-2222-2222-222222222222',2,8,'Duke 390',2023,26500000,7000,'Naranja','usado','Gasolina','Manual','Deportiva, accesorios incluidos.'),
 ('a0000000-0000-0000-0000-000000000009','33333333-3333-3333-3333-333333333333',3,9,'Zebra Ruta 29',2024,2300000,0,'Verde','nuevo',NULL,'Cambios 1x12','MTB aluminio rin 29.'),
 ('a0000000-0000-0000-0000-000000000010','33333333-3333-3333-3333-333333333333',3,10,'Allez Sport',2023,7800000,1200,'Negro','usado',NULL,'Cambios 2x9','Ruta en aluminio, talla 54.'),
 ('a0000000-0000-0000-0000-000000000011','33333333-3333-3333-3333-333333333333',3,11,'FX 3 Disc',2024,4900000,0,'Azul','nuevo',NULL,'Cambios 1x10','Urbana híbrida con frenos de disco.'),
 ('a0000000-0000-0000-0000-000000000012','33333333-3333-3333-3333-333333333333',3,12,'City Fold',2022,1500000,800,'Amarillo','usado',NULL,'Cambios 7v','Plegable, perfecta para el metro.');
INSERT INTO public.inventario (vehiculo_id, stock, ubicacion)
 SELECT id, CASE WHEN categoria_id = 3 THEN 5 WHEN categoria_id = 2 THEN 3 ELSE 1 END,
   CASE vendedor_id WHEN '11111111-1111-1111-1111-111111111111' THEN 'Medellín' WHEN '22222222-2222-2222-2222-222222222222' THEN 'Bogotá' ELSE 'Cali' END
 FROM public.vehiculos;

-- 1. Insertar Categorías
INSERT INTO public.categorias (id, nombre, slug) VALUES
(1, 'Carro', 'carro'),
(2, 'Moto', 'moto'),
(3, 'Bicicleta', 'bicicleta')
ON CONFLICT (id) DO NOTHING;

-- 2. Insertar Marcas
INSERT INTO public.marcas (id, categoria_id, nombre, pais_origen) VALUES
(1, 1, 'Chevrolet', 'EE.UU.'),
(2, 1, 'Renault', 'Francia'),
(3, 1, 'Toyota', 'Japón'),
(4, 1, 'Mazda', 'Japón'),
(5, 2, 'Yamaha', 'Japón'),
(6, 2, 'AKT', 'Colombia'),
(7, 2, 'Bajaj', 'India'),
(8, 3, 'GW', 'Colombia'),
(9, 3, 'Specialized', 'EE.UU.')
ON CONFLICT (id) DO NOTHING;

-- 3. Ajustar secuencias de IDs autoincrementables
SELECT setval('public.categorias_id_seq', (SELECT MAX(id) FROM public.categorias));
SELECT setval('public.marcas_id_seq', (SELECT MAX(id) FROM public.marcas));

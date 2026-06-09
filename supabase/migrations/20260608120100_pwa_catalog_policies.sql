-- Políticas de leitura para PWA (catálogo offline)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_insumo' AND policyname = 'dim_insumo_anon_read') THEN
    CREATE POLICY dim_insumo_anon_read ON public.dim_insumo FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'preco_insumo' AND policyname = 'preco_insumo_anon_read') THEN
    CREATE POLICY preco_insumo_anon_read ON public.preco_insumo FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dim_equipamento_lubri' AND policyname = 'dim_equipamento_lubri_anon_read') THEN
    CREATE POLICY dim_equipamento_lubri_anon_read ON public.dim_equipamento_lubri FOR SELECT USING (true);
  END IF;
END $$;

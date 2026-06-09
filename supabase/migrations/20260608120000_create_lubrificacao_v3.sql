-- Espelho da migration aplicada no Supabase (dados_controladoria_sv)
CREATE TABLE IF NOT EXISTS public.lubrificacao_v3 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid UNIQUE NOT NULL,
  order_number text,
  vehicle text NOT NULL,
  operator text,
  tipo_servico text NOT NULL CHECK (tipo_servico IN ('preventiva', 'corretiva')),
  hourmeter_atual numeric,
  hourmeter_prox numeric,
  data_servico timestamptz NOT NULL DEFAULT now(),
  localizacao text DEFAULT 'CAMPO',
  observation text,
  itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  custo_total numeric DEFAULT 0,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lub_v3_vehicle ON public.lubrificacao_v3(vehicle);
CREATE INDEX IF NOT EXISTS idx_lub_v3_data ON public.lubrificacao_v3(data_servico DESC);
CREATE INDEX IF NOT EXISTS idx_lub_v3_client ON public.lubrificacao_v3(client_id);

ALTER TABLE public.lubrificacao_v3 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lub_v3_anon_all" ON public.lubrificacao_v3;
CREATE POLICY "lub_v3_anon_all" ON public.lubrificacao_v3
  FOR ALL USING (true) WITH CHECK (true);

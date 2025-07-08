-- Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  plan_name VARCHAR(50) NOT NULL,
  plan_value DECIMAL(10, 2) NOT NULL,
  plan_cycle VARCHAR(20) NOT NULL,
  billing_type VARCHAR(20) NOT NULL,
  asaas_subscription_id VARCHAR(100),
  payment_url TEXT,
  next_due_date TIMESTAMPTZ,
  asaas_data JSONB,
  latest_payment JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar comentário à tabela
COMMENT ON TABLE public.subscriptions IS 'Armazena informações sobre assinaturas de clínicas';

-- Adicionar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_clinic_id ON public.subscriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas_subscription_id ON public.subscriptions(asaas_subscription_id);

-- Configurar RLS (Row Level Security)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Política para administradores (acesso total)
CREATE POLICY admin_all_subscriptions ON public.subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política para proprietários de clínicas (visualizar apenas suas próprias assinaturas)
CREATE POLICY owner_view_subscriptions ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'clinic_owner'
      AND profiles.clinic_id = subscriptions.clinic_id
    )
  );

-- Política para profissionais (visualizar assinaturas da clínica onde trabalham)
CREATE POLICY professional_view_subscriptions ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals
      WHERE professionals.user_id = auth.uid()
      AND professionals.clinic_id = subscriptions.clinic_id
    )
  );

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o campo updated_at automaticamente
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para obter dados da assinatura de uma clínica
CREATE OR REPLACE FUNCTION public.get_subscription_data(p_clinic_id UUID)
RETURNS TABLE (
  id UUID,
  status VARCHAR,
  plan_name VARCHAR,
  plan_value DECIMAL,
  plan_cycle VARCHAR,
  next_due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  payment_url TEXT,
  billing_type VARCHAR,
  asaas_data JSONB,
  latest_payment JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.status,
    s.plan_name,
    s.plan_value,
    s.plan_cycle,
    s.next_due_date,
    s.created_at,
    s.payment_url,
    s.billing_type,
    s.asaas_data,
    s.latest_payment
  FROM
    public.subscriptions s
  WHERE
    s.clinic_id = p_clinic_id
  ORDER BY
    s.created_at DESC
  LIMIT 1;
END;
$$;

-- Criar tabela para imagens das ferramentas do dashboard
CREATE TABLE public.dashboard_card_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL,
  card_id TEXT NOT NULL, -- ID único da ferramenta (ex: 'avaliacao-facial', 'avaliacao-corporal')
  card_type TEXT NOT NULL, -- tipo da ferramenta (ex: 'ai', 'management', 'settings')
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.dashboard_card_images ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Clinic owners can manage their own card images"
ON public.dashboard_card_images
FOR ALL
USING (get_my_claim('clinic_owner_id')::UUID = clinic_id);

CREATE POLICY "Professionals can read their clinic's card images"
ON public.dashboard_card_images
FOR SELECT
USING (get_my_claim('clinic_id')::UUID = clinic_id);

-- Adicionar foreign key para clínicas
ALTER TABLE public.dashboard_card_images
ADD CONSTRAINT dashboard_card_images_clinic_id_fkey
FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;
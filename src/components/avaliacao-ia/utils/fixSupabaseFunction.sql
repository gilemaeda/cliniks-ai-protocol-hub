-- Corrigir a função get_user_clinic_data que está com problema
-- O erro é: column c.deleted_at does not exist, com sugestão de usar p.deleted_at

-- Recriando a função get_user_clinic_data
CREATE OR REPLACE FUNCTION public.get_user_clinic_data(user_uuid UUID)
RETURNS TABLE (
  clinic_id UUID,
  clinic_name TEXT,
  professional_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário é um proprietário de clínica
  IF EXISTS (
    SELECT 1 FROM profiles p
    JOIN clinics c ON c.owner_id = p.id
    WHERE p.id = user_uuid
    AND p.role = 'clinic_owner'
  ) THEN
    RETURN QUERY
    SELECT 
      c.id AS clinic_id,
      c.name AS clinic_name,
      NULL::UUID AS professional_id
    FROM clinics c
    WHERE c.owner_id = user_uuid;
  
  -- Verificar se o usuário é um profissional
  ELSE
    RETURN QUERY
    SELECT 
      p.clinic_id,
      c.name AS clinic_name,
      p.id AS professional_id
    FROM professionals p
    JOIN clinics c ON c.id = p.clinic_id
    WHERE p.user_id = user_uuid
    AND p.is_active = true
    AND p.deleted_at IS NULL;
  END IF;
END;
$$; 
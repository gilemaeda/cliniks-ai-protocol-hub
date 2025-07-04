-- Função para verificar se um e-mail já existe no sistema
-- Esta função pode ser chamada pelo frontend de forma segura
CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  email_exists BOOLEAN;
BEGIN
  -- Verifica se o e-mail existe na tabela de autenticação
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = email_to_check
  ) INTO email_exists;
  
  RETURN email_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Concede permissão para todos os usuários chamarem esta função
GRANT EXECUTE ON FUNCTION public.check_email_exists TO authenticated, anon;

-- Comentário explicativo
COMMENT ON FUNCTION public.check_email_exists IS 'Verifica se um e-mail já existe no sistema de autenticação';

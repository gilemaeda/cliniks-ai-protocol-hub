-- Adicionar políticas RLS para a tabela system_settings
-- Permitir que administradores acessem e modifiquem os registros

-- Habilitar RLS na tabela system_settings (caso ainda não esteja habilitado)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Admins podem visualizar configurações do sistema" ON system_settings;
DROP POLICY IF EXISTS "Admins podem editar configurações do sistema" ON system_settings;

-- Política para permitir que administradores visualizem as configurações
CREATE POLICY "Admins podem visualizar configurações do sistema"
ON system_settings
FOR SELECT
USING (
  -- Verificar se o usuário é admin
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.email = auth.jwt() ->> 'email'
    AND admin_users.is_active = true
  )
  -- Ou se o usuário é o admin master (gilemaeda@gmail.com)
  OR (auth.jwt() ->> 'email' = 'gilemaeda@gmail.com')
);

-- Política para permitir que administradores editem as configurações
CREATE POLICY "Admins podem editar configurações do sistema"
ON system_settings
FOR ALL
USING (
  -- Verificar se o usuário é admin
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.email = auth.jwt() ->> 'email'
    AND admin_users.is_active = true
  )
  -- Ou se o usuário é o admin master (gilemaeda@gmail.com)
  OR (auth.jwt() ->> 'email' = 'gilemaeda@gmail.com')
);

-- Garantir que a tabela admin_users tenha o campo is_active
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

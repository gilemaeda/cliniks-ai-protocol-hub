-- Configura a exclusão em cascata para as tabelas 'profiles' e 'professionals'.
-- Isso garante que, ao excluir um usuário de 'auth.users', seus dados relacionados
-- em 'profiles' e 'professionals' sejam removidos automaticamente.

-- Etapa 1: Lidar com a relação entre 'profiles' e 'professionals'.

-- Remove a restrição de chave estrangeira existente.
-- O nome 'professionals_user_id_fkey' foi obtido da mensagem de erro do Supabase.
ALTER TABLE public.professionals
DROP CONSTRAINT professionals_user_id_fkey;

-- Adiciona a restrição de volta com a regra ON DELETE CASCADE.
ALTER TABLE public.professionals
ADD CONSTRAINT professionals_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Etapa 2: Lidar com a relação entre 'auth.users' e 'profiles'.

-- Remove a restrição de chave estrangeira existente.
-- O nome 'profiles_id_fkey' é uma suposição padrão. Se a migração falhar aqui,
-- precisaremos encontrar o nome correto no painel do Supabase.
ALTER TABLE public.profiles
DROP CONSTRAINT profiles_id_fkey;

-- Adiciona a restrição de volta com a regra ON DELETE CASCADE.
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

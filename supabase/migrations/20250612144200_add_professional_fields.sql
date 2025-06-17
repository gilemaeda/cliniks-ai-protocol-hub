-- Adiciona colunas para CPF, telefone e formação na tabela de perfis.
ALTER TABLE public.profiles
ADD COLUMN cpf TEXT,
ADD COLUMN phone TEXT,
ADD COLUMN formation TEXT;

-- Cria o bucket para fotos de pacientes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('patient-photos', 'patient-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Políticas de Acesso para o bucket 'patient-photos'

-- 1. Permite que qualquer pessoa leia as imagens (acesso público)
CREATE POLICY "Allow public read access to patient photos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'patient-photos' );

-- 2. Permite que usuários autenticados façam upload de imagens
-- A lógica da aplicação deve garantir que o usuário pertence à clínica correta.
CREATE POLICY "Allow authenticated users to upload photos"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'patient-photos' AND auth.role() = 'authenticated' );

-- 3. Permite que usuários autenticados atualizem suas próprias fotos
-- A verificação de propriedade será baseada nos metadados ou na lógica da aplicação.
CREATE POLICY "Allow authenticated users to update their photos"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'patient-photos' AND auth.role() = 'authenticated' );

-- 4. Permite que usuários autenticados deletem suas próprias fotos
CREATE POLICY "Allow authenticated users to delete their photos"
ON storage.objects FOR DELETE
USING ( bucket_id = 'patient-photos' AND auth.role() = 'authenticated' );

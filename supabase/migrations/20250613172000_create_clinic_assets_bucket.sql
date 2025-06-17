-- Create the storage bucket for clinic assets
insert into storage.buckets (id, name, public)
values ('clinic-assets', 'clinic-assets', true)
on conflict (id) do nothing;

-- RLS Policies for clinic-assets bucket

-- 1. Allow public read access to all files in the bucket
-- This policy allows anyone to view the images, which is necessary for them to be displayed in the app.
create policy "Allow public read access on clinic-assets"
on storage.objects for select
to public
using ( bucket_id = 'clinic-assets' );

-- 2. Allow clinic owners to upload, update, and delete their own clinic's assets.
-- The policy checks that the authenticated user's ID matches the owner_id of the clinic
-- whose ID is in the file path (e.g., 'clinic_id/logo.png').
create policy "Allow clinic owners to manage their assets"
on storage.objects for all
to authenticated
using (
  bucket_id = 'clinic-assets' and
  auth.uid() = (
    select owner_id from public.clinics where id::text = (storage.foldername(name))[1]
  )
)
with check (
  bucket_id = 'clinic-assets' and
  auth.uid() = (
    select owner_id from public.clinics where id::text = (storage.foldername(name))[1]
  )
);

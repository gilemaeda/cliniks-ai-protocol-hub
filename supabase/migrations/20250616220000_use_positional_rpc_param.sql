-- Final attempt to fix the persistent 400 Bad Request error.
-- This migration changes the function to use a positional parameter instead of a named one.
-- The hypothesis is a potential bug in how PostgREST or the Supabase SDK handles named parameters in this specific context.

-- Drop the previous function.
DROP FUNCTION IF EXISTS list_clinic_professionals(uuid);
DROP FUNCTION IF EXISTS list_clinic_professionals(text);

-- Recreate the function accepting a single unnamed UUID parameter.
CREATE OR REPLACE FUNCTION list_clinic_professionals(uuid)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    clinic_id uuid,
    full_name text,
    specialty text,
    council_number text,
    is_active boolean,
    created_at timestamptz,
    email text,
    cpf text,
    phone text,
    formation text,
    education text
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.user_id,
        p.clinic_id,
        p.name AS full_name,
        p.specialty,
        p.council_number,
        p.is_active,
        p.created_at,
        u.email,
        p.cpf,
        p.phone,
        p.formation,
        p.education
    FROM
        public.professionals p
    JOIN
        auth.users u ON p.user_id = u.id
    WHERE
        p.clinic_id = $1; -- Use $1 to reference the first positional parameter.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

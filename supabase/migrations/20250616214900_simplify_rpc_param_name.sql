-- This migration attempts to fix a persistent 400 Bad Request error by simplifying the function's parameter name.
-- The hypothesis is that 'in_clinic_id' might be causing a conflict or parsing issue in the API layer (PostgREST).

-- Drop the previous function to ensure a clean update.
DROP FUNCTION IF EXISTS list_clinic_professionals(uuid);

-- Recreate the function with a simplified parameter name: 'p_clinic_id'.
CREATE OR REPLACE FUNCTION list_clinic_professionals(p_clinic_id uuid)
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
        p.clinic_id = p_clinic_id; -- Use the new parameter name in the query.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

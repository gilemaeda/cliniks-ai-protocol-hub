DROP FUNCTION IF EXISTS get_clinic_professionals(uuid);

CREATE OR REPLACE FUNCTION get_clinic_professionals(in_clinic_id uuid)
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
        p.clinic_id = in_clinic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

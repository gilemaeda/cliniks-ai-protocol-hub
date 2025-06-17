CREATE OR REPLACE FUNCTION get_protocols_for_clinic(p_clinic_id uuid)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    content jsonb,
    therapeutic_objective text,
    target_audience text,
    duration_weeks integer,
    equipment_used text[],
    substances_used text[],
    created_at timestamptz,
    clinic_id uuid,
    created_by uuid,
    updated_at timestamptz,
    profiles jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cp.id,
        cp.name,
        cp.description,
        cp.content::jsonb, -- Ensure content is treated as jsonb
        cp.therapeutic_objective,
        cp.target_audience,
        cp.duration_weeks,
        cp.equipment_used,
        cp.substances_used,
        cp.created_at,
        cp.clinic_id,
        cp.created_by,
        cp.updated_at,
        jsonb_build_object('full_name', prof.full_name) as profiles
    FROM
        public.custom_protocols AS cp
    LEFT JOIN
        public.profiles AS prof ON cp.created_by = prof.id
    WHERE
        cp.clinic_id = p_clinic_id
    ORDER BY
        cp.created_at DESC;
END;
$$;

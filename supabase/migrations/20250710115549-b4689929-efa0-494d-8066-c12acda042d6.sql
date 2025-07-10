-- Corrigir a função get_clinic_statistics para usar a tabela correta
CREATE OR REPLACE FUNCTION public.get_clinic_statistics()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
    auth_uid uuid;
    caller_role text;
    clinic_id_to_use uuid;
    result json;
BEGIN
    -- Obter o UID do usuário autenticado
    auth_uid := auth.uid();

    -- Se não houver UID, retorna zerado para segurança
    IF auth_uid IS NULL THEN
        RETURN json_build_object('assessments', 0, 'patients', 0, 'photos', 0, 'protocols', 0, 'professionals', 0, 'resources', 0);
    END IF;

    -- Obter o papel do usuário
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth_uid;

    -- Se não encontrar o perfil, retorna zerado
    IF caller_role IS NULL THEN
        RETURN json_build_object('assessments', 0, 'patients', 0, 'photos', 0, 'protocols', 0, 'professionals', 0, 'resources', 0);
    END IF;

    -- Determinar o clinic_id a ser usado para as contagens
    IF caller_role = 'clinic_owner' THEN
        -- Para proprietários, o ID da clínica é o ID da clínica que ele possui
        SELECT id INTO clinic_id_to_use FROM public.clinics WHERE owner_id = auth_uid;
    ELSE
        -- Para outros papéis (como 'professional'), usa o clinic_id do seu perfil
        SELECT clinic_id INTO clinic_id_to_use FROM public.profiles WHERE id = auth_uid;
    END IF;
    
    -- Se, após a lógica, não houver um clinic_id, retorna zerado
    IF clinic_id_to_use IS NULL THEN
        RETURN json_build_object('assessments', 0, 'patients', 0, 'photos', 0, 'protocols', 0, 'professionals', 0, 'resources', 0);
    END IF;

    -- Construir o JSON com as contagens corretas e finais
    SELECT json_build_object(
        'assessments', (SELECT COUNT(*) FROM public.assessments WHERE clinic_id = clinic_id_to_use),
        'patients', (SELECT COUNT(*) FROM public.patients WHERE clinic_id = clinic_id_to_use AND deleted_at IS NULL),
        'photos', (SELECT COUNT(*) FROM public.patient_photos WHERE clinic_id = clinic_id_to_use),
        'protocols', (SELECT COUNT(*) FROM public.custom_protocols WHERE clinic_id = clinic_id_to_use),
        'professionals', (SELECT COUNT(*) FROM public.professionals WHERE clinic_id = clinic_id_to_use AND is_active = true AND deleted_at IS NULL),
        'resources', (SELECT COUNT(*) FROM public.clinic_resources WHERE clinic_id = clinic_id_to_use)
    ) INTO result;

    RETURN result;
END;$function$
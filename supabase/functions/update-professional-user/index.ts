import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0'
import { corsHeaders } from '../_shared/cors.ts'

// Define a type for the values we expect in our update objects
type UpdateValue = string | boolean | number | null;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const updates = await req.json()
    const { user_id, professional_id } = updates

    if (!user_id || !professional_id) {
      throw new Error('Faltando parâmetros obrigatórios: user_id ou professional_id.')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Atualizar auth.users se houver dados de autenticação
    const authUpdates: { email?: string; password?: string } = {}
    if (updates.email) authUpdates.email = updates.email
    if (updates.password) authUpdates.password = updates.password

    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        user_id,
        authUpdates
      )
      if (authError) throw authError
    }

    // 2. Preparar dados para 'profiles' e 'professionals'
    const profileDataToUpdate: { [key: string]: UpdateValue } = {}
    const professionalDataToUpdate: { [key: string]: UpdateValue } = {}

    const professionalFields = ['specialty', 'council_number', 'is_active']

    for (const key in updates) {
      if (key === 'user_id' || key === 'professional_id' || key === 'password' || key === 'email') {
        continue
      }

      if (professionalFields.includes(key)) {
        professionalDataToUpdate[key] = updates[key]
      } else {
        // Mapear full_name para name para a tabela profiles
        if (key === 'full_name') {
          profileDataToUpdate['name'] = updates[key]
        } else {
          profileDataToUpdate[key] = updates[key]
        }
      }
    }

    // 3. Atualizar a tabela 'profiles'
    if (Object.keys(profileDataToUpdate).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileDataToUpdate)
        .eq('id', user_id)
      if (profileError) throw profileError
    }

    // 4. Atualizar a tabela 'professionals'
    if (Object.keys(professionalDataToUpdate).length > 0) {
      const { error: professionalError } = await supabaseAdmin
        .from('professionals')
        .update(professionalDataToUpdate)
        .eq('id', professional_id)
      if (professionalError) throw professionalError
    }

    return new Response(JSON.stringify({ message: 'Profissional atualizado com sucesso!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

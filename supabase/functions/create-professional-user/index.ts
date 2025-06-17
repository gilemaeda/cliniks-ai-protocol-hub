import { serve } from 'std/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    console.log('--- Payload Recebido ---', JSON.stringify(payload, null, 2));

    const { professionalData, clinicId } = payload;
    const { email, password, full_name, ...professional } = professionalData;

    if (!email || !full_name) {
      return new Response(JSON.stringify({ error: 'Email e Nome Completo são obrigatórios.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('--- Verificando usuário existente... ---');
    const { data: existingUserData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ email });
    console.log('--- Resultado listUsers ---', JSON.stringify(existingUserData, null, 2));

    if (listError) {
      console.error('Error listing users:', listError);
      throw new Error('Falha ao verificar usuário existente.');
    }

    let userToProcess;
    let isNewUser = false;

    // Adiciona uma verificação de correspondência exata do e-mail para evitar falsos positivos com alias (+)
    const exactMatchUser = existingUserData?.users.find(user => user.email === email);

    if (exactMatchUser) {
      userToProcess = exactMatchUser;
      console.log(`Usuário com correspondência exata de email encontrado: ${email}: ID ${userToProcess.id}`);

      const { data: existingProfessional, error: profError } = await supabaseAdmin
        .from('professionals')
        .select('id')
        .eq('user_id', userToProcess.id)
        .single();

      if (profError && profError.code !== 'PGRST116') {
        console.error('Erro ao verificar profissional existente:', profError);
        throw new Error('Falha ao verificar registro de profissional.');
      }

      if (existingProfessional) {
        return new Response(JSON.stringify({ error: 'Este profissional já está cadastrado no sistema.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409,
        });
      }
    } else {
      console.log('--- Nenhuma correspondência exata de e-mail encontrada, criando novo usuário... ---');
      if (!password) {
        return new Response(JSON.stringify({ error: 'A senha é obrigatória para novos usuários.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
      });
      console.log('--- Resultado createUser ---', JSON.stringify(authData, null, 2));

      if (authError || !authData?.user) {
        console.error('Error creating user in Auth:', authError);
        const errorMessage = authError ? authError.message : 'Não foi possível criar o usuário no Auth.';
        return new Response(JSON.stringify({ error: errorMessage }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
      userToProcess = authData.user;
      isNewUser = true;
      console.log(`Novo usuário criado com o email ${email}: ID ${userToProcess.id}`);
    }

    const userId = userToProcess.id;

    console.log(`--- Processando para o User ID: ${userId} ---`);

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'professional',
        full_name: full_name,
        email: email,
        cpf: professionalData.cpf,
        phone: professionalData.phone,
        education: professionalData.formation,
      })
      .eq('id', userId);

    if (profileError) {
      if (isNewUser) await supabaseAdmin.auth.admin.deleteUser(userId);
      console.error('Erro ao atualizar perfil:', profileError);
      throw new Error('Falha ao atualizar o perfil do usuário.');
    }

    console.log('--- Perfil atualizado com sucesso. Inserindo em professionals... ---');

    const professionalRecord = {
      ...professional,
      name: full_name,
      user_id: userId,
      clinic_id: clinicId,
    };

    const { data: newProfessionalRecord, error: dbError } = await supabaseAdmin
      .from('professionals')
      .insert(professionalRecord)
      .select()
      .single();

    if (dbError) {
      if (isNewUser) await supabaseAdmin.auth.admin.deleteUser(userId);
      console.error('Erro ao inserir profissional:', dbError);
      throw new Error('Falha ao criar o registro do profissional.');
    }

    console.log('--- Profissional criado com sucesso! ---');
    return new Response(JSON.stringify(newProfessionalRecord), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('--- ERRO INESPERADO NO CATCH ---');
    console.error('Error Object:', error);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    return new Response(JSON.stringify({ error: 'Ocorreu um erro inesperado no servidor.', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

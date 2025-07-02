import { serve } from 'std/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Configuração CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extrai os dados da requisição
    const requestData = await req.json();
    const { clinicId, professionalData } = requestData;
    
    // Como email e password estão dentro de professionalData no payload enviado pelo frontend
    const email = professionalData?.email;
    const password = professionalData?.password;
    
    // Log para debug
    console.log('Dados recebidos:', JSON.stringify({ clinicId, professionalData: { ...professionalData, password: '***' } }));
    
    // Validação básica de campos obrigatórios
    if (!email || !password || !clinicId || !professionalData || !professionalData.full_name) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios faltando', status: 400 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }
    
    // Configuração do cliente Supabase com chave de serviço
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Iniciando processo de criação de profissional...');

    // 1. Verificar se o usuário já existe
    console.log('Verificando se o email já está em uso...');
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      console.log('Email já está em uso:', email);
      return new Response(
        JSON.stringify({ error: 'E-mail já em uso', status: 409 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409
        }
      );
    }

    // 2. Criar o usuário no Auth
    console.log('Criando usuário no Auth...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      // Adicionamos apenas o mínimo de metadados aqui
      user_metadata: {
        full_name: professionalData.full_name,
        role: 'professional'
      }
    });

    if (authError || !authData.user) {
      console.error('Erro ao criar usuário no Auth:', authError);
      return new Response(
        JSON.stringify({ 
          error: `Erro ao criar usuário: ${authError?.message || 'Falha desconhecida'}`, 
          status: 500 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    const userId = authData.user.id;
    console.log('Usuário criado com ID:', userId);

    try {
      // 3. Verificar se o perfil já existe e, se não, insertí-lo
      console.log('Verificando se o perfil já existe...');
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (!existingProfile) {
        console.log('Perfil não existe, inserindo na tabela profiles...');
        // Somente campos que pertencem à tabela profiles
        const profileData = {
          id: userId,
          email,
          full_name: professionalData.full_name,
          role: 'professional'
          // Não incluir outros campos profissionais aqui
        };
        
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert(profileData);
  
        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
          throw new Error(`Falha ao criar perfil: ${profileError.message}`);
        }
      } else {
        console.log('Perfil já existe, pulando inserção...');
      }
      
      // 4. Inserir registro na tabela professionals
      console.log('Inserindo registro na tabela professionals...');
      const professionalRecord = {
        user_id: userId,
        clinic_id: clinicId,
        name: professionalData.full_name,
        is_active: true,
        // Adicionar os campos específicos de professional
        cpf: professionalData.cpf,
        formation: professionalData.formation,
        phone: professionalData.phone,
        specialty: professionalData.specialty,
        council_number: professionalData.council_number
      };
      
      const { error: professionalError } = await supabaseAdmin
        .from('professionals')
        .insert(professionalRecord);

      if (professionalError) {
        console.error('Erro ao adicionar profissional:', professionalError);
        throw new Error(`Falha ao adicionar profissional: ${professionalError.message}`);
      }

      // 5. Sucesso! Retorna os dados do usuário e profissional criados
      console.log('Profissional criado com sucesso!');
      return new Response(
        JSON.stringify({ 
          user: authData.user, 
          professional: professionalRecord 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201
        }
      );

    } catch (error) {
      // Se algo deu errado após criar o usuário no Auth,
      // tentamos excluir o usuário para evitar usuários órfãos
      console.error('Erro durante a criação do profissional, removendo usuário:', error);
      
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error('CRÍTICO: Falha ao remover usuário após erro:', deleteError);
      }
      
      return new Response(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Erro desconhecido', 
          status: 500 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

  } catch (error) {
    console.error('ERRO FATAL:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        status: 500
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Importar biblioteca para decodificar JWT
import * as base64 from 'https://deno.land/std@0.168.0/encoding/base64.ts';

// Definição de CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função principal
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    // Verificar e extrair o token JWT do cabeçalho Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Extrair o token JWT
    const token = authHeader.split(' ')[1];
    
    // Verificar variáveis de ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    const asaasBaseUrl = Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com/v3';

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas corretamente.');
    }

    if (!asaasApiKey) {
      throw new Error('Chave da API do Asaas não configurada.');
    }

    // Cliente Admin para operações com privilégios de serviço
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Cliente para operações no contexto do usuário autenticado
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey, 
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    // Extrair o clinic_id da URL
    const url = new URL(req.url);
    const clinicId = url.searchParams.get('clinic_id');
    
    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'ID da clínica não fornecido' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Decodificar o token JWT manualmente para extrair o ID do usuário
    try {
      // Função para decodificar o token JWT
      function decodeJWT(token: string) {
        try {
          const [header, payload, signature] = token.split('.');
          // Decodificar a parte do payload (segunda parte do token)
          const decodedPayload = new TextDecoder().decode(
            base64.decode(payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(payload.length + (4 - payload.length % 4) % 4, '='))
          );
          return JSON.parse(decodedPayload);
        } catch (error) {
          console.error('Erro ao decodificar JWT:', error);
          return null;
        }
      }
      
      // Decodificar o token
      const decodedToken = decodeJWT(token);
      
      if (!decodedToken || !decodedToken.sub) {
        console.error('DEBUG: AUTH_HEADER:', req.headers.get('Authorization'));
        console.error('DEBUG: ANON_KEY_USED:', Deno.env.get('SUPABASE_ANON_KEY')?.substring(0, 10) + '...');
        console.error('Token inválido ou sem ID de usuário');
        return new Response(JSON.stringify({ error: 'Token inválido ou expirado' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        });
      }
      
      // Extrair o ID do usuário do token decodificado
      const userId = decodedToken.sub;
      console.log('Usuário autenticado com sucesso:', userId);
      
      // Verificar se o usuário tem acesso à clínica usando o UUID extraído do token
      const { data: userClinicData, error: rpcError } = await supabaseAdmin
        .rpc('get_user_clinic_data', { user_uuid: userId });

      if (rpcError) {
        console.error('Erro na RPC get_user_clinic_data:', rpcError);
        return new Response(JSON.stringify({ error: 'Erro ao verificar acesso à clínica' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }

      // Verificar se o usuário tem acesso à clínica especificada
      const hasAccess = userClinicData.some((data: {clinic_id: string}) => data.clinic_id === clinicId);
      if (!hasAccess) {
        return new Response(JSON.stringify({ error: 'Acesso negado à clínica especificada' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }
    } catch (error) {
      console.error('Erro ao processar token:', error);
      return new Response(JSON.stringify({ error: 'Erro ao processar autenticação' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // O código de verificação de acesso à clínica já foi implementado acima
    // usando o userId extraído do token JWT

    // Buscar a assinatura da clínica
    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('clinic_id', clinicId)
      .maybeSingle();

    if (subscriptionError) {
      console.error('Erro ao buscar assinatura:', subscriptionError);
      throw new Error('Falha ao buscar dados da assinatura.');
    }

    // Se não houver assinatura, retornar null
    if (!subscriptionData) {
      return new Response(JSON.stringify({ data: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Se houver uma assinatura e ela tiver um ID no Asaas, buscar dados atualizados
    if (subscriptionData.asaas_subscription_id) {
      try {
        const asaasResponse = await fetch(`${asaasBaseUrl}/subscriptions/${subscriptionData.asaas_subscription_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'access_token': asaasApiKey
          }
        });

        if (asaasResponse.ok) {
          const asaasData = await asaasResponse.json();
          
          // Atualizar o status da assinatura no banco se necessário
          if (asaasData.status !== subscriptionData.status) {
            await supabaseAdmin
              .from('subscriptions')
              .update({ status: asaasData.status })
              .eq('id', subscriptionData.id);
            
            // Atualizar o objeto que será retornado
            subscriptionData.status = asaasData.status;
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados atualizados do Asaas:', error);
        // Continuar com os dados locais em caso de erro
      }
    }

    return new Response(JSON.stringify({ data: subscriptionData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

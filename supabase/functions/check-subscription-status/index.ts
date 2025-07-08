import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY') || '';
const ASAAS_API_URL = Deno.env.get('ASAAS_API_URL') || 'https://sandbox.asaas.com/api/v3';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  // Tratamento de CORS para preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase com a chave de serviço
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verificar JWT do usuário
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter dados do corpo da requisição
    const { clinic_id } = await req.json();

    if (!clinic_id) {
      return new Response(
        JSON.stringify({ error: 'ID da clínica não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o usuário tem permissão para acessar esta clínica
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Perfil não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profile.role !== 'clinic_owner' && profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Permissão negada' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar a assinatura da clínica
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('clinic_id', clinic_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subscriptionError || !subscription) {
      return new Response(
        JSON.stringify({ error: 'Assinatura não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se não tiver ID da assinatura no Asaas, retornar erro
    if (!subscription.asaas_subscription_id) {
      return new Response(
        JSON.stringify({ error: 'Assinatura sem ID do Asaas' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Consultar status da assinatura na API do Asaas
    const asaasResponse = await fetch(
      `${ASAAS_API_URL}/subscriptions/${subscription.asaas_subscription_id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY
        }
      }
    );

    if (!asaasResponse.ok) {
      const asaasError = await asaasResponse.json();
      console.error('Erro na API do Asaas:', asaasError);
      return new Response(
        JSON.stringify({ error: 'Erro ao consultar API do Asaas', details: asaasError }),
        { status: asaasResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const asaasData = await asaasResponse.json();

    // Verificar pagamentos recentes para esta assinatura
    const paymentsResponse = await fetch(
      `${ASAAS_API_URL}/payments?subscription=${subscription.asaas_subscription_id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY
        }
      }
    );

    if (!paymentsResponse.ok) {
      const paymentsError = await paymentsResponse.json();
      console.error('Erro ao buscar pagamentos:', paymentsError);
      return new Response(
        JSON.stringify({ error: 'Erro ao consultar pagamentos', details: paymentsError }),
        { status: paymentsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentsData = await paymentsResponse.json();
    const latestPayment = paymentsData.data.length > 0 ? paymentsData.data[0] : null;

    // Atualizar status da assinatura no banco de dados
    if (asaasData.status) {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: asaasData.status,
          updated_at: new Date().toISOString(),
          asaas_data: asaasData,
          latest_payment: latestPayment
        })
        .eq('id', subscription.id);

      if (updateError) {
        console.error('Erro ao atualizar assinatura:', updateError);
      }
    }

    // Retornar dados atualizados
    return new Response(
      JSON.stringify({
        status: asaasData.status,
        subscription: {
          ...subscription,
          asaas_data: asaasData,
          latest_payment: latestPayment
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

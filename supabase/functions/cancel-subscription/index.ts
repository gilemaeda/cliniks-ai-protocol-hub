import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY') || '';
const ASAAS_API_URL = Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com/v3';

interface RequestBody {
  subscription_id: string;
}

serve(async (req) => {
  console.log(`Received request: ${req.method} ${req.url}`);

  // Tratamento de CORS para preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request for CORS preflight in cancel-subscription.');
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Verificar se é um método POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar autenticação do usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Criar cliente Supabase com a chave de serviço
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verificar a sessão do usuário
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter dados do corpo da requisição
    const { subscription_id } = await req.json() as RequestBody;
    console.log(`Attempting to cancel subscription with asaas_subscription_id: ${subscription_id} for user: ${user.id}`);
    
    if (!subscription_id) {
      return new Response(
        JSON.stringify({ error: 'ID da assinatura não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se a assinatura pertence ao usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('clinic_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error(`Profile not found for user_id: ${user.id}`, profileError);
      return new Response(
        JSON.stringify({ error: 'PROFILE_NOT_FOUND', details: 'Perfil do usuário não encontrado.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o usuário é proprietário da clínica
    if (profile.role !== 'clinic_owner' && profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Permissão negada. Apenas proprietários de clínicas podem cancelar assinaturas.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User profile found. clinic_id: ${profile.clinic_id}, role: ${profile.role}`);

    // Buscar a assinatura no banco de dados
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('asaas_subscription_id', subscription_id)
      .eq('clinic_id', profile.clinic_id)
      .single();

    if (subscriptionError || !subscription) {
      console.error(`Subscription not found with asaas_subscription_id: ${subscription_id} for clinic_id: ${profile.clinic_id}`, subscriptionError);
      return new Response(
        JSON.stringify({ error: 'SUBSCRIPTION_NOT_FOUND', details: 'Assinatura não encontrada ou não pertence à sua clínica.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cancelar a assinatura no Asaas (usando o método DELETE, padrão RESTful)
    const asaasResponse = await fetch(`${ASAAS_API_URL}/subscriptions/${subscription_id}`, {
      method: 'DELETE',
      headers: {
        'access_token': ASAAS_API_KEY
      }
    });

    const asaasData = await asaasResponse.json();

    if (!asaasResponse.ok) {
      console.error('Erro ao cancelar assinatura no Asaas:', asaasData);
      return new Response(
        JSON.stringify({ error: 'Erro ao cancelar assinatura no Asaas', details: asaasData }),
        { status: asaasResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar o status da assinatura no banco de dados
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'CANCELED',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Erro ao atualizar assinatura no banco de dados:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar assinatura no banco de dados', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // O status da clínica não deve ser alterado aqui.
    // A lógica de acesso deve ser baseada no status e na data de vencimento da assinatura.

    // Registrar o cancelamento no log
    await supabase
      .from('subscription_logs')
      .insert({
        subscription_id: subscription.id,
        clinic_id: subscription.clinic_id,
        action: 'CANCEL',
        status: 'SUCCESS',
        details: {
          asaas_response: asaasData,
          canceled_by: user.id,
          canceled_at: new Date().toISOString()
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Assinatura cancelada com sucesso',
        data: {
          subscription_id: subscription.id,
          status: 'CANCELED',
          asaas_status: asaasData.status
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao processar cancelamento de assinatura:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

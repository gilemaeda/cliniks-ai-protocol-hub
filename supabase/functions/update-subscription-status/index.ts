import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY') || '';
const ASAAS_API_URL = Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com/v3';

interface RequestBody {
  subscription_id: string;
  status: string;
  clinic_id: string;
}

serve(async (req) => {
  // Tratamento de CORS para preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
    const { subscription_id, status, clinic_id } = await req.json() as RequestBody;
    
    if (!subscription_id || !status || !clinic_id) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o usuário é administrador
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Perfil do usuário não encontrado', details: profileError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Apenas administradores podem atualizar o status manualmente
    if (profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Permissão negada. Apenas administradores podem atualizar o status manualmente.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar a assinatura no banco de dados
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .eq('clinic_id', clinic_id)
      .single();

    if (subscriptionError || !subscription) {
      return new Response(
        JSON.stringify({ error: 'Assinatura não encontrada', details: subscriptionError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar o status da assinatura no banco de dados
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar assinatura', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar o status da clínica com base no novo status da assinatura
    let clinicStatus = 'inactive';
    if (status === 'ACTIVE' || status === 'TRIAL') {
      clinicStatus = 'active';
    }

    const { error: clinicUpdateError } = await supabase
      .from('clinics')
      .update({
        status: clinicStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', clinic_id);

    if (clinicUpdateError) {
      console.error('Erro ao atualizar status da clínica:', clinicUpdateError);
      // Não interromper o fluxo se a atualização da clínica falhar
    }

    // Se o status for ACTIVE e a assinatura tiver um ID no Asaas, tentar atualizar lá também
    if (status === 'ACTIVE' && subscription.asaas_subscription_id) {
      try {
        await fetch(`${ASAAS_API_URL}/subscriptions/${subscription.asaas_subscription_id}/restore`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY
          }
        });
        // Não precisamos verificar a resposta, pois isso é apenas uma tentativa extra
      } catch (asaasError) {
        console.error('Erro ao atualizar assinatura no Asaas:', asaasError);
        // Não interromper o fluxo se a atualização no Asaas falhar
      }
    }

    // Registrar a atualização manual no log
    await supabase
      .from('subscription_logs')
      .insert({
        subscription_id: subscription_id,
        clinic_id: clinic_id,
        action: 'MANUAL_UPDATE',
        status: 'SUCCESS',
        details: {
          old_status: subscription.status,
          new_status: status,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Status da assinatura atualizado com sucesso',
        data: {
          subscription_id: subscription_id,
          status: status,
          clinic_id: clinic_id,
          clinic_status: clinicStatus
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao processar atualização de status:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

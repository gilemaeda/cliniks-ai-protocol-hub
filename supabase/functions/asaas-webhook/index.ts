import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const N8N_WEBHOOK_URL = Deno.env.get('N8N_WEBHOOK_URL') || '';
const ASAAS_WEBHOOK_TOKEN = Deno.env.get('ASAAS_WEBHOOK_TOKEN') || '';

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

    // Obter dados do corpo da requisição
    const webhookData = await req.json();
    console.log('Dados recebidos do webhook Asaas:', JSON.stringify(webhookData));

    // Verificar token de segurança do webhook (se configurado)
    const authHeader = req.headers.get('Authorization');
    if (ASAAS_WEBHOOK_TOKEN && (!authHeader || authHeader !== `Bearer ${ASAAS_WEBHOOK_TOKEN}`)) {
      console.error('Token de webhook inválido');
      return new Response(
        JSON.stringify({ error: 'Token de webhook inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase com a chave de serviço
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Processar diferentes tipos de eventos
    const event = webhookData.event;
    const payment = webhookData.payment;
    const subscription = webhookData.subscription;

    if (!event) {
      return new Response(
        JSON.stringify({ error: 'Evento não especificado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Processar eventos de pagamento
    if (payment) {
      await processPaymentEvent(event, payment, supabase);
    }

    // Processar eventos de assinatura
    if (subscription) {
      await processSubscriptionEvent(event, subscription, supabase);
    }

    // Encaminhar dados para o webhook do N8n (se configurado)
    if (N8N_WEBHOOK_URL) {
      try {
        await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            source: 'asaas_webhook',
            event,
            data: webhookData
          })
        });
        console.log('Dados encaminhados para o webhook do N8n');
      } catch (webhookError) {
        console.error('Erro ao encaminhar para o webhook do N8n:', webhookError);
        // Não interromper o fluxo se o webhook falhar
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Função para processar eventos de pagamento
async function processPaymentEvent(event: string, payment: any, supabase: any) {
  console.log(`Processando evento de pagamento: ${event}`);
  
  // Buscar a assinatura relacionada ao pagamento
  if (payment.subscription) {
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('asaas_subscription_id', payment.subscription)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (subscriptionError) {
      console.error('Erro ao buscar assinatura:', subscriptionError);
      return;
    }
    
    if (!subscriptionData) {
      console.error('Assinatura não encontrada para o ID:', payment.subscription);
      return;
    }
    
    // Atualizar o status do pagamento na assinatura
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: mapPaymentStatusToSubscriptionStatus(payment.status),
        latest_payment: {
          id: payment.id,
          status: payment.status,
          dueDate: payment.dueDate,
          value: payment.value,
          billingType: payment.billingType
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionData.id);
    
    if (updateError) {
      console.error('Erro ao atualizar assinatura:', updateError);
    } else {
      console.log('Assinatura atualizada com sucesso');
    }
    
    // Se o pagamento foi confirmado, atualizar o status da clínica
    if (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
      const { error: clinicUpdateError } = await supabase
        .from('clinics')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionData.clinic_id);
      
      if (clinicUpdateError) {
        console.error('Erro ao atualizar status da clínica:', clinicUpdateError);
      } else {
        console.log('Status da clínica atualizado para ativo');
      }
    }
  }
}

// Função para processar eventos de assinatura
async function processSubscriptionEvent(event: string, subscription: any, supabase: any) {
  console.log(`Processando evento de assinatura: ${event}`);
  
  // Buscar a assinatura no banco de dados
  const { data: subscriptionData, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('asaas_subscription_id', subscription.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (subscriptionError) {
    console.error('Erro ao buscar assinatura:', subscriptionError);
    return;
  }
  
  if (!subscriptionData) {
    console.error('Assinatura não encontrada para o ID:', subscription.id);
    return;
  }
  
  // Atualizar dados da assinatura
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      next_due_date: subscription.nextDueDate,
      updated_at: new Date().toISOString(),
      asaas_data: subscription
    })
    .eq('id', subscriptionData.id);
  
  if (updateError) {
    console.error('Erro ao atualizar assinatura:', updateError);
  } else {
    console.log('Assinatura atualizada com sucesso');
  }
  
  // Se a assinatura foi cancelada, atualizar o status da clínica
  if (subscription.status === 'INACTIVE' || subscription.status === 'CANCELED') {
    const { error: clinicUpdateError } = await supabase
      .from('clinics')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionData.clinic_id);
    
    if (clinicUpdateError) {
      console.error('Erro ao atualizar status da clínica:', clinicUpdateError);
    } else {
      console.log('Status da clínica atualizado para inativo');
    }
  }
}

// Função para mapear status de pagamento para status de assinatura
function mapPaymentStatusToSubscriptionStatus(paymentStatus: string): string {
  switch (paymentStatus) {
    case 'CONFIRMED':
    case 'RECEIVED':
      return 'ACTIVE';
    case 'PENDING':
      return 'PENDING';
    case 'OVERDUE':
      return 'OVERDUE';
    case 'REFUNDED':
    case 'REFUND_REQUESTED':
    case 'CHARGEBACK_REQUESTED':
    case 'CHARGEBACK_DISPUTE':
    case 'AWAITING_CHARGEBACK_REVERSAL':
      return 'INACTIVE';
    default:
      return paymentStatus;
  }
}

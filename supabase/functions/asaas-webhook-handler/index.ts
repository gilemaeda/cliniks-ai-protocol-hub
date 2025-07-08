import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface para o payload enviado ao n8n
interface N8nWebhookPayload {
  event: string;
  subscription: {
    id: string;
    asaas_id: string;
    status: string;
    plan_name: string;
    value: number;
    next_due_date: string;
    created_at: string;
  };
  clinic: {
    id: string;
    [key: string]: unknown; // Propriedades adicionais da clínica
  };
  owner: {
    id?: string;
    [key: string]: unknown; // Propriedades adicionais do proprietário
  };
  payment?: {
    id: string;
    value: number;
    status: string;
    asaas_subscription_id?: string;
  };
}

// Função para enviar dados para o webhook do n8n
async function sendToN8n(webhookUrl: string, data: N8nWebhookPayload) {
  try {
    console.log(`Enviando dados para n8n: ${webhookUrl}`);
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao enviar para n8n: ${response.status} ${errorText}`);
    }
    
    console.log('Dados enviados com sucesso para n8n');
    return true;
  } catch (error) {
    console.error('Erro ao enviar para webhook n8n:', error);
    return false;
  }
}

// Interface para o corpo do webhook do Asaas, agora mais flexível
interface AsaasWebhookPayload {
  event: string;
  payment?: { // Para eventos de pagamento
    id: string;
    subscription?: string;
    externalReference?: string;
    status: string;
    value: number;
  };
  subscription?: { // Para eventos de assinatura
    id: string;
    externalReference?: string;
    status: string;
  };
}

// Mapeia eventos do Asaas para o status interno da assinatura
const eventToStatusMap: { [key: string]: string } = {
  // Eventos de pagamento
  'PAYMENT_CONFIRMED': 'ACTIVE',
  'PAYMENT_RECEIVED': 'ACTIVE',
  'PAYMENT_RESTORED': 'ACTIVE',
  'PAYMENT_OVERDUE': 'OVERDUE', // Status específico para pagamentos atrasados
  'PAYMENT_DELETED': 'INACTIVE',
  'PAYMENT_REFUNDED': 'INACTIVE',
  'PAYMENT_CREATED': 'PENDING', // Novo pagamento criado
  'PAYMENT_UPDATED': null, // Não altera status, apenas processa webhook
  'PAYMENT_AWAITING': 'PENDING', // Pagamento aguardando
  'PAYMENT_DUNNING_RECEIVED': 'ACTIVE', // Pagamento recebido após cobrança
  'PAYMENT_ANTICIPATED': 'ACTIVE', // Pagamento antecipado
  
  // Eventos de assinatura
  'SUBSCRIPTION_CREATED': 'PENDING',
  'SUBSCRIPTION_UPDATED': null, // Não altera status, apenas processa webhook
  'SUBSCRIPTION_DELETED': 'CANCELED',
  'SUBSCRIPTION_RENEWED': 'ACTIVE',
  'SUBSCRIPTION_ACTIVATED': null, // Não ativa a assinatura aqui. A ativação depende da confirmação do pagamento.
  'SUBSCRIPTION_CANCELED': 'CANCELED'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('--- INICIANDO WEBHOOK HANDLER ---');
    const payload: AsaasWebhookPayload = await req.json();
    console.log('Payload recebido:', JSON.stringify(payload, null, 2));

    if (!payload.event) {
      console.warn('Webhook recebido sem evento. Ignorando.');
      return new Response('Payload inválido: evento ausente', { status: 400 });
    }

    const newStatus = eventToStatusMap[payload.event];

    // Se o evento não estiver mapeado ou for null (eventos que não alteram status)
    if (newStatus === undefined) {
      console.log(`Evento '${payload.event}' não mapeado. Ignorando.`);
      return new Response('Evento não processado', { status: 200 });
    }
    
    // Se o status for null, significa que queremos processar o evento mas não alterar o status
    const shouldUpdateStatus = newStatus !== null;

    const asaasSubscriptionId = payload.payment?.subscription || payload.subscription?.id;
    const externalReference = payload.payment?.externalReference || payload.subscription?.externalReference;

    if (!asaasSubscriptionId && !externalReference) {
      console.error('ID da assinatura ou referência externa não encontrados no webhook.');
      return new Response('Dados de identificação da assinatura ausentes', { status: 400 });
    }

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SERVICE_ROLE_KEY') ?? '');

    let query = supabaseAdmin.from('subscriptions');
    if (asaasSubscriptionId) {
      query = query.eq('asaas_subscription_id', asaasSubscriptionId);
    } else {
      query = query.eq('clinic_id', externalReference);
    }

    const { data: subscription, error: queryError } = await query.select('*').maybeSingle();

    if (queryError) {
      console.error('Erro ao buscar assinatura:', queryError);
      throw new Error('Falha ao consultar a assinatura no banco de dados.');
    }

    if (!subscription) {
      console.error(`Assinatura não encontrada com ID Asaas '${asaasSubscriptionId}' ou Ref Externa '${externalReference}'.`);
      return new Response('Assinatura não encontrada', { status: 404 });
    }

    // Se não precisamos atualizar o status, apenas processar o webhook
    if (!shouldUpdateStatus) {
        console.log(`Evento '${payload.event}' não requer atualização de status. Processando webhook apenas.`);
    } 
    // Se o status já está atualizado, não precisamos fazer nada
    else if (subscription.status === newStatus) {
        console.log(`Assinatura ${subscription.id} já está com o status '${newStatus}'. Ignorando.`);
        return new Response('Status já atualizado', { status: 200 });
    }
    // Caso contrário, atualizar o status
    else {
        console.log(`Atualizando status da assinatura ${subscription.id} de '${subscription.status}' para '${newStatus}'`);
        
        // Atualiza o status da assinatura no banco
        const { error: updateError } = await supabaseAdmin
            .from('subscriptions')
            .update({ status: newStatus })
            .eq('id', subscription.id);

        if (updateError) {
            console.error('Erro ao atualizar status da assinatura:', updateError);
            throw new Error('Falha ao atualizar o status da assinatura.');
        }
    }

    console.log(`Assinatura ${subscription.id} processada com sucesso!`);

    // Lista de eventos que devem disparar o webhook para o n8n
    const webhookEvents = [
        'PAYMENT_CONFIRMED', 
        'PAYMENT_RECEIVED', 
        'PAYMENT_OVERDUE',
        'PAYMENT_REFUNDED',
        'SUBSCRIPTION_CREATED',
        'SUBSCRIPTION_ACTIVATED',
        'SUBSCRIPTION_CANCELED',
        'SUBSCRIPTION_RENEWED'
    ];
    
    // Dispara o webhook para o n8n para eventos relevantes
    if (webhookEvents.includes(payload.event)) {
        try {
            // Buscar URL do webhook do n8n nas configurações do sistema
            const { data: n8nSetting, error: settingError } = await supabaseAdmin
                .from('system_settings')
                .select('value')
                .eq('key', 'n8n_webhook_url')
                .single();
            
            if (settingError) {
                console.error('Erro ao buscar URL do webhook n8n:', settingError);
            } else if (n8nSetting?.value) {
                // Buscar dados completos da clínica para enviar ao n8n
                const { data: clinicData } = await supabaseAdmin
                    .from('clinics')
                    .select('*')
                    .eq('id', subscription.clinic_id)
                    .single();
                
                // Buscar dados do proprietário da clínica
                const { data: ownerData } = await supabaseAdmin
                    .from('profiles')
                    .select('*')
                    .eq('id', clinicData?.owner_id)
                    .single();
                
                // Mapear evento do Asaas para evento do n8n
                const eventMap: { [key: string]: string } = {
                    'PAYMENT_CONFIRMED': 'payment_confirmed',
                    'PAYMENT_RECEIVED': 'payment_received',
                    'PAYMENT_OVERDUE': 'payment_overdue',
                    'PAYMENT_REFUNDED': 'payment_refunded',
                    'SUBSCRIPTION_CREATED': 'subscription_created',
                    'SUBSCRIPTION_ACTIVATED': 'subscription_activated',
                    'SUBSCRIPTION_CANCELED': 'subscription_canceled',
                    'SUBSCRIPTION_RENEWED': 'subscription_renewed'
                };
                
                // Preparar payload para o n8n com todos os dados relevantes
                const n8nPayload: N8nWebhookPayload = {
                    event: eventMap[payload.event] || 'subscription_event',
                    subscription: {
                        id: subscription.id,
                        asaas_id: subscription.asaas_subscription_id,
                        status: shouldUpdateStatus ? newStatus : subscription.status,
                        plan_name: subscription.plan_name,
                        value: subscription.value,
                        next_due_date: subscription.next_due_date,
                        created_at: subscription.created_at
                    },
                    clinic: clinicData || { id: subscription.clinic_id },
                    owner: ownerData || {}
                };
                
                // Adicionar informações específicas do pagamento, se disponível
                if (payload.payment) {
                    Object.assign(n8nPayload, {
                        payment: {
                            id: payload.payment.id,
                            value: payload.payment.value,
                            status: payload.payment.status,
                            asaas_subscription_id: payload.payment.subscription
                        }
                    });
                }
                
                // Enviar para o webhook do n8n
                const webhookUrl = n8nSetting.value;
                const sent = await sendToN8n(webhookUrl, n8nPayload);
                
                if (sent) {
                    console.log('Notificação enviada com sucesso para o n8n');
                    
                    // Registrar o envio do webhook
                    await supabaseAdmin
                        .from('webhook_logs')
                        .insert({
                            subscription_id: subscription.id,
                            destination: 'n8n',
                            payload: n8nPayload,
                            status: 'success'
                        });
                } else {
                    console.error('Falha ao enviar notificação para o n8n');
                    
                    // Registrar falha no envio do webhook
                    await supabaseAdmin
                        .from('webhook_logs')
                        .insert({
                            subscription_id: subscription.id,
                            destination: 'n8n',
                            payload: n8nPayload,
                            status: 'failed'
                        });
                }
            } else {
                console.log('URL do webhook n8n não configurada. Pulando notificação.');
            }
        } catch (webhookError) {
            console.error('Erro ao processar webhook para n8n:', webhookError);
        }
    }

    return new Response(JSON.stringify({ success: true, message: `Assinatura atualizada para ${newStatus}.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('--- ERRO GERAL NO WEBHOOK HANDLER ---', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

import { serve } from 'std/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

// Tipos para a API do Asaas
interface AsaasCustomerRequest {
  name: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  notificationDisabled?: boolean;
}

interface AsaasSubscriptionRequest {
  customer: string; // ID do cliente no Asaas
  billingType: string; // BOLETO, CREDIT_CARD, etc.
  value: number;
  nextDueDate: string; // formato: YYYY-MM-DD
  cycle: string; // MONTHLY, YEARLY, etc.
  description: string;
  externalReference?: string; // ID da clínica no nosso sistema
}

// Função principal
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    // Inicializa o cliente Supabase com a chave de serviço
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    );

    // Obtém a chave da API do Asaas do ambiente
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    const asaasBaseUrl = Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com/v3';
    
    if (!asaasApiKey) {
      throw new Error('Chave da API do Asaas não configurada.');
    }

    // Extrai os dados da requisição
    const payload = await req.json();
    console.log('--- Payload Recebido ---', JSON.stringify(payload, null, 2));

    const { clinicId, planName, billingType, value, cycle } = payload;
    
    if (!clinicId || !planName || !value) {
      return new Response(JSON.stringify({ error: 'Dados incompletos para criar assinatura.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Busca os dados da clínica
    const { data: clinicData, error: clinicError } = await supabaseAdmin
      .from('clinics')
      .select('*, profiles(full_name, email, cpf, phone)')
      .eq('id', clinicId)
      .single();

    if (clinicError || !clinicData) {
      console.error('Erro ao buscar dados da clínica:', clinicError);
      throw new Error('Falha ao buscar dados da clínica.');
    }

    const ownerProfile = clinicData.profiles;
    if (!ownerProfile) {
      throw new Error('Perfil do proprietário da clínica não encontrado.');
    }

    // Verifica se já existe uma assinatura para esta clínica
    const { data: existingSubscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('clinic_id', clinicId)
      .maybeSingle();

    if (subscriptionError) {
      console.error('Erro ao verificar assinatura existente:', subscriptionError);
      throw new Error('Falha ao verificar assinatura existente.');
    }

    // Se já existe uma assinatura ativa, retorna erro
    if (existingSubscription && existingSubscription.status === 'active') {
      return new Response(JSON.stringify({ 
        error: 'Esta clínica já possui uma assinatura ativa.',
        subscription: existingSubscription
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409,
      });
    }

    // Cria ou recupera o cliente no Asaas
    let asaasCustomerId = existingSubscription?.asaas_customer_id;

    if (!asaasCustomerId) {
      // Cria um novo cliente no Asaas
      const customerData: AsaasCustomerRequest = {
        name: ownerProfile.full_name,
        email: ownerProfile.email,
        phone: ownerProfile.phone || '',
        cpfCnpj: ownerProfile.cpf || '',
        notificationDisabled: false
      };

      const customerResponse = await fetch(`${asaasBaseUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey
        },
        body: JSON.stringify(customerData)
      });

      if (!customerResponse.ok) {
        const errorData = await customerResponse.json();
        console.error('Erro ao criar cliente no Asaas:', errorData);
        throw new Error(`Falha ao criar cliente no Asaas: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`);
      }

      const customerResult = await customerResponse.json();
      asaasCustomerId = customerResult.id;
      console.log('--- Cliente criado no Asaas ---', asaasCustomerId);
    }

    // Prepara a data do próximo vencimento (padrão: hoje + 7 dias)
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 7);
    const formattedNextDueDate = nextDueDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD

    // Cria a assinatura no Asaas
    const subscriptionData: AsaasSubscriptionRequest = {
      customer: asaasCustomerId,
      billingType: billingType || 'CREDIT_CARD',
      value: parseFloat(value),
      nextDueDate: formattedNextDueDate,
      cycle: cycle || 'MONTHLY',
      description: `Assinatura ${planName} - ${clinicData.clinic_name}`,
      externalReference: clinicId
    };

    const subscriptionResponse = await fetch(`${asaasBaseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey
      },
      body: JSON.stringify(subscriptionData)
    });

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.json();
      console.error('Erro ao criar assinatura no Asaas:', errorData);
      throw new Error(`Falha ao criar assinatura no Asaas: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`);
    }

    const subscriptionResult = await subscriptionResponse.json();
    console.log('--- Assinatura criada no Asaas ---', subscriptionResult.id);

    // Salva os dados da assinatura no banco
    const subscriptionRecord = {
      clinic_id: clinicId,
      asaas_customer_id: asaasCustomerId,
      asaas_subscription_id: subscriptionResult.id,
      asaas_payment_link: subscriptionResult.paymentLink || null,
      plan_name: planName,
      status: subscriptionResult.status || 'pending',
      billing_type: billingType || 'CREDIT_CARD',
      value: parseFloat(value),
      next_due_date: nextDueDate.toISOString(),
      cycle: cycle || 'MONTHLY'
    };

    // Insere ou atualiza o registro de assinatura
    let dbOperation;
    if (existingSubscription) {
      dbOperation = supabaseAdmin
        .from('subscriptions')
        .update(subscriptionRecord)
        .eq('id', existingSubscription.id)
        .select()
        .single();
    } else {
      dbOperation = supabaseAdmin
        .from('subscriptions')
        .insert(subscriptionRecord)
        .select()
        .single();
    }

    const { data: savedSubscription, error: dbError } = await dbOperation;

    if (dbError) {
      console.error('Erro ao salvar assinatura no banco:', dbError);
      throw new Error('Falha ao salvar os dados da assinatura.');
    }

    console.log('--- Assinatura salva com sucesso! ---');
    return new Response(JSON.stringify(savedSubscription), {
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

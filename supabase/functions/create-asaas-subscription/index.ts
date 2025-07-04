import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Definição de CORS headers já que o arquivo compartilhado pode não estar disponível
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    console.log('--- INICIANDO FUNÇÃO ---');
    console.log('Verificando variáveis de ambiente...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    const asaasBaseUrl = Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com/v3';
    
    console.log('SUPABASE_URL disponível:', !!supabaseUrl);
    console.log('SERVICE_ROLE_KEY disponível:', !!serviceRoleKey);
    console.log('ASAAS_API_KEY disponível:', !!asaasApiKey);
    console.log('ASAAS_API_URL:', asaasBaseUrl);
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas corretamente.');
    }
    
    if (!asaasApiKey) {
      throw new Error('Chave da API do Asaas não configurada.');
    }
    
    // Inicializa o cliente Supabase com a chave de serviço
    console.log('Inicializando cliente Supabase...');
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    // Já verificamos as variáveis de ambiente acima

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

    // Interface para dados da clínica
    interface ClinicData {
      id: string;
      name: string;
      cnpj?: string;
      owner_id: string;
    }
    
    // Declarar a variável clinicData em um escopo mais amplo
    let clinicData: ClinicData;
    
    // Busca os dados da clínica
    console.log('Buscando dados da clínica com ID:', clinicId);
    try {
      const { data, error: clinicError } = await supabaseAdmin
        .from('clinics')
        .select('id, name, cnpj, owner_id')
        .eq('id', clinicId)
        .single();
      
      // Atribuir o valor à variável clinicData declarada no escopo mais amplo
      clinicData = data;
        
      console.log('Resposta da consulta da clínica:');
      console.log('- Dados:', clinicData ? 'Dados encontrados' : 'Nenhum dado');
      console.log('- Erro:', clinicError ? JSON.stringify(clinicError) : 'Nenhum erro');
      
      if (clinicData) {
        console.log('Dados da clínica:', JSON.stringify(clinicData, null, 2));
      }
      
      if (clinicError || !clinicData) {
        console.error('Erro ao buscar dados da clínica:', clinicError);
        throw new Error('Falha ao buscar dados da clínica.');
      }
    } catch (error) {
      console.error('Erro ao buscar dados da clínica (exceção):', error);
      throw new Error(`Erro ao buscar dados da clínica: ${error.message}`);
    }
    
    // Interface para dados do proprietário
    interface OwnerProfile {
      id: string;
      full_name: string;
      email: string;
      cpf?: string;
      phone?: string;
    }
    
    // Declarar a variável ownerProfile em um escopo mais amplo
    let ownerProfile: OwnerProfile;
    
    // Buscar dados do proprietário da clínica diretamente da tabela profiles
    console.log('Buscando dados do proprietário com ID:', clinicData.owner_id);
    try {
      const { data, error: ownerError } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email, cpf, phone')
        .eq('id', clinicData.owner_id)
        .single();
      
      // Atribuir o valor à variável ownerProfile declarada no escopo mais amplo
      ownerProfile = data;
        
      console.log('Resposta da consulta do proprietário:');
      console.log('- Dados:', ownerProfile ? 'Dados encontrados' : 'Nenhum dado');
      console.log('- Erro:', ownerError ? JSON.stringify(ownerError) : 'Nenhum erro');
      
      if (ownerProfile) {
        console.log('Dados do proprietário:', JSON.stringify(ownerProfile, null, 2));
      }
      
      if (ownerError || !ownerProfile) {
        console.error('Erro ao buscar dados do proprietário:', ownerError);
        throw new Error('Perfil do proprietário da clínica não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao buscar dados do proprietário (exceção):', error);
      throw new Error(`Erro ao buscar dados do proprietário: ${error.message}`);
    }
    
    // Validações mais detalhadas dos dados do proprietário
    console.log('Validando dados do proprietário e da clínica...');
    
    const validationErrors = [];
    
    if (!ownerProfile.full_name) {
      console.error('Nome do proprietário não encontrado');
      validationErrors.push('Nome do proprietário não encontrado. Atualize o perfil.');
    }
    
    if (!ownerProfile.email) {
      console.error('Email do proprietário não encontrado');
      validationErrors.push('Email do proprietário não encontrado. Atualize o perfil.');
    }
    
    if (!ownerProfile.cpf) {
      console.error('CPF do proprietário não encontrado');
      validationErrors.push('CPF do proprietário não encontrado. Atualize o perfil.');
    }
    
    // Validação do CNPJ da clínica
    if (!clinicData.cnpj) {
      console.error('CNPJ da clínica não encontrado');
      validationErrors.push('CNPJ da clínica não encontrado. Atualize as configurações da clínica.');
    }
    
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.join(' ');
      console.error('Erros de validação encontrados:', errorMessage);
      throw new Error(errorMessage);
    }
    
    console.log('Validação concluída com sucesso.');
    console.log('Dados validados:');
    if (!ownerProfile.full_name || ownerProfile.full_name.trim() === '') {
      validationErrors.push('O nome do proprietário da clínica não está preenchido');
    }
    
    if (!ownerProfile.email || ownerProfile.email.trim() === '') {
      validationErrors.push('O email do proprietário não está preenchido');
    }
    
    if (!ownerProfile.cpf || ownerProfile.cpf.trim() === '') {
      validationErrors.push('O CPF do proprietário não está preenchido');
    }
    
    if (!clinicData.cnpj || clinicData.cnpj.trim() === '') {
      validationErrors.push('O CNPJ da clínica não está preenchido');
    }
    
    if (validationErrors.length > 0) {
      console.error('Validação falhou:', validationErrors);
      throw new Error(`Dados incompletos: ${validationErrors.join(', ')}. Por favor, complete seu perfil e os dados da clínica.`);
    }

    console.log('Validação concluída com sucesso.');
    console.log('Dados validados:');
    console.log('- Nome:', ownerProfile.full_name);
    console.log('- Email:', ownerProfile.email);
    console.log('- CPF:', ownerProfile.cpf ? '(presente)' : '(ausente)');
    console.log('- CNPJ:', clinicData.cnpj ? '(presente)' : '(ausente)');
    console.log('- Telefone:', ownerProfile.phone || '(não informado)');

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

    // Escolher entre CNPJ da clínica ou CPF do proprietário para o cliente Asaas
    let cpfCnpj = '';
    let documentType = '';
    
    // Log detalhado dos dados antes da validação
    console.log('CNPJ da clínica (bruto):', clinicData.cnpj);
    console.log('CPF do proprietário (bruto):', ownerProfile.cpf);
    
    if (clinicData.cnpj && clinicData.cnpj.trim() !== '') {
      // Remover caracteres não numéricos do CNPJ
      cpfCnpj = clinicData.cnpj.replace(/[^0-9]/g, '');
      documentType = 'CNPJ';
      
      // Validar tamanho do CNPJ (deve ter 14 dígitos)
      console.log(`CNPJ após limpeza: ${cpfCnpj} (${cpfCnpj.length} dígitos)`);
      
      if (cpfCnpj.length !== 14) {
        console.warn(`CNPJ inválido: ${cpfCnpj} (${cpfCnpj.length} dígitos). Tentando usar CPF do proprietário como fallback.`);
        
        // Tentar usar CPF do proprietário como fallback
        if (ownerProfile.cpf && ownerProfile.cpf.trim() !== '') {
          cpfCnpj = ownerProfile.cpf.replace(/[^0-9]/g, '');
          documentType = 'CPF';
          
          // Validar tamanho do CPF (deve ter 11 dígitos)
          console.log(`CPF após limpeza: ${cpfCnpj} (${cpfCnpj.length} dígitos)`);
          
          if (cpfCnpj.length !== 11) {
            throw new Error(`CPF inválido: ${cpfCnpj.length} dígitos (deve ter 11 dígitos). Por favor, corrija o CPF do proprietário na página de configuração.`);
          }
        } else {
          throw new Error('Não foi possível criar o cliente: CNPJ da clínica inválido e CPF do proprietário não informado. Por favor, preencha corretamente os dados na página de configuração da clínica.');
        }
      }
    } else if (ownerProfile.cpf && ownerProfile.cpf.trim() !== '') {
      // Usar CPF do proprietário
      cpfCnpj = ownerProfile.cpf.replace(/[^0-9]/g, '');
      documentType = 'CPF';
      
      // Validar tamanho do CPF (deve ter 11 dígitos)
      console.log(`CPF após limpeza: ${cpfCnpj} (${cpfCnpj.length} dígitos)`);
      
      if (cpfCnpj.length !== 11) {
        throw new Error(`CPF inválido: ${cpfCnpj.length} dígitos (deve ter 11 dígitos). Por favor, corrija o CPF do proprietário na página de configuração.`);
      }
    } else {
      throw new Error('Não foi possível criar o cliente: CNPJ da clínica e CPF do proprietário não informados. Por favor, preencha os dados na página de configuração da clínica.');
    }
    
    console.log(`Documento selecionado para o cliente Asaas: ${documentType} ${cpfCnpj} (${cpfCnpj.length} dígitos)`);

    // Cria ou recupera o cliente no Asaas
    let asaasCustomerId = existingSubscription?.asaas_customer_id;
    if (!asaasCustomerId) {
      // Cria um novo cliente no Asaas
      interface AsaasCustomerRequest {
        name: string;
        email: string;
        phone?: string;
        cpfCnpj: string;
        notificationDisabled: boolean;
      }

      const customerData: AsaasCustomerRequest = {
        name: ownerProfile.full_name.trim(),
        email: ownerProfile.email.trim(),
        phone: ownerProfile.phone ? ownerProfile.phone.replace(/[^0-9]/g, '') : undefined,
        cpfCnpj: cpfCnpj,
        notificationDisabled: false
      };

      // Validação adicional dos dados do cliente antes de enviar para o Asaas
      if (!customerData.name || customerData.name.length < 3) {
        throw new Error(`Nome inválido para criação do cliente: '${customerData.name}'. O nome deve ter pelo menos 3 caracteres.`);
      }
      
      if (!customerData.email || !customerData.email.includes('@')) {
        throw new Error(`Email inválido para criação do cliente: '${customerData.email}'. Verifique o formato do email.`);
      }

      console.log('--- Criando cliente no Asaas ---', JSON.stringify(customerData, null, 2));
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
        const errorMessage = errorData.errors?.[0]?.description || 'Erro desconhecido ao criar cliente no Asaas.';
        console.error(`Erro ao criar cliente no Asaas: ${JSON.stringify(errorData, null, 2)}`);
        // Lança o erro específico para ser pego pelo catch principal e enviado ao front-end
        throw new Error(errorMessage);
      }

      const customerResult = await customerResponse.json();
      asaasCustomerId = customerResult.id;
      console.log('--- Cliente criado no Asaas ---', asaasCustomerId);
    }

    // Prepara a data do próximo vencimento (30 dias para ciclo mensal)
    const nextDueDate = new Date();
    if (cycle === 'MONTHLY') {
      // Para ciclo mensal, próximo vencimento em 30 dias
      nextDueDate.setDate(nextDueDate.getDate() + 30);
    } else {
      // Para outros ciclos, mantém o padrão de 7 dias
      nextDueDate.setDate(nextDueDate.getDate() + 7);
    }
    const formattedNextDueDate = nextDueDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    console.log(`Próximo vencimento definido para: ${formattedNextDueDate} (ciclo: ${cycle})`)

    // Cria a assinatura no Asaas
    console.log('--- Preparando criação da assinatura no Asaas ---');
    const subscriptionData: AsaasSubscriptionRequest = {
      customer: asaasCustomerId,
      billingType: billingType || 'CREDIT_CARD',
      value: parseFloat(value.toString()),
      nextDueDate: formattedNextDueDate,
      cycle: cycle || 'MONTHLY',
      description: `Assinatura ${planName} - ${clinicData.name || 'Clínica'}`,
      externalReference: clinicId
    };
    
    console.log('Dados da assinatura a serem enviados:', JSON.stringify(subscriptionData, null, 2));
    console.log('URL da API Asaas:', `${asaasBaseUrl}/subscriptions`);
    console.log('Método:', 'POST');
    console.log('Headers:', JSON.stringify({
      'Content-Type': 'application/json',
      'access_token': asaasApiKey ? 'PRESENTE (não exibido por segurança)' : 'AUSENTE'
    }, null, 2));

    // Declarar a variável no escopo mais amplo, antes do try
    let subscriptionResponse;

    try {
      console.log('Enviando requisição para criar assinatura...');
      subscriptionResponse = await fetch(`${asaasBaseUrl}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey
        },
        body: JSON.stringify(subscriptionData)
      });
      
      console.log('Resposta recebida do Asaas:');
      console.log('- Status:', subscriptionResponse.status);
      console.log('- Status Text:', subscriptionResponse.statusText);
      console.log('- OK:', subscriptionResponse.ok);

      if (!subscriptionResponse.ok) {
        const errorData = await subscriptionResponse.json();
        console.error('Erro ao criar assinatura no Asaas:', JSON.stringify(errorData, null, 2));
        console.error('Detalhes do erro:');
        if (errorData.errors && errorData.errors.length > 0) {
          errorData.errors.forEach((err: { code?: string; description?: string }, index: number) => {
            console.error(`Erro ${index + 1}:`, JSON.stringify(err, null, 2));
          });
        }
        throw new Error(`Falha ao criar assinatura no Asaas: ${errorData.errors?.[0]?.description || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Exceção ao criar assinatura no Asaas:', error);
      throw new Error(`Erro ao criar assinatura: ${error.message}`);
    }

    const subscriptionResult = await subscriptionResponse.json();
    console.log('--- Assinatura criada no Asaas ---', subscriptionResult.id);

    // Salva os dados da assinatura no banco
    // Garantir que o status inicial seja sempre 'pending' independente do retorno do Asaas
    // Isso garante que o acesso só será liberado após confirmação do pagamento via webhook
    const subscriptionRecord = {
      clinic_id: clinicId,
      asaas_customer_id: asaasCustomerId,
      asaas_subscription_id: subscriptionResult.id,
      asaas_payment_link: subscriptionResult.paymentLink || null,
      plan_name: planName,
      status: 'pending', // Forçar status inicial como pending
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
    console.log('Payment Link:', subscriptionResult.paymentLink);
    
    // Garantir que o paymentLink esteja explicitamente na resposta
    return new Response(JSON.stringify({
      ...savedSubscription,
      paymentLink: subscriptionResult.paymentLink // Incluir explicitamente o link de pagamento
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('--- ERRO INESPERADO NO CATCH ---');
    console.error('Error Object:', error);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    // Retorna a mensagem de erro específica para o frontend, que espera um objeto com a chave 'error'
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

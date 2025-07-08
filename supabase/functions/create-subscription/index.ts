// Edge Function para criar assinaturas e gerar links de pagamento
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, User } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Headers de CORS para permitir requisições de qualquer origem
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Interfaces para tipagem dos dados
interface RequestBody {
  clinic_id: string;
  plan_name: string;
  value: number;
  cycle: string;
  billing_type: string;
  description: string;
}

interface SubscriptionData {
  subscription_id: string;
  status: string;
  payment_url: string;
  next_due_date: string;
}

interface AsaasSubscriptionData {
  customer: string;
  billingType: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  description: string;
  externalReference: string;
  walletId?: string;
}

console.log("Edge Function 'create-subscription' v2 inicializada."); // v2 com mais logs

serve(async (req: Request) => {
  // Responde imediatamente a requisições OPTIONS (pre-flight)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. AUTENTICAÇÃO
    console.log("Iniciando processo de autenticação...");
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader) {
      console.error("Authorization header ausente.");
      return new Response(JSON.stringify({ error: "Token de autorização não fornecido." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log(`Authorization header recebido: ${authHeader.substring(0, 30)}...`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    console.log("Cliente Supabase para autenticação criado (método explícito de token).");

    // Extrai o token do header 'Authorization: Bearer <token>'
    const token = authHeader.replace("Bearer ", "");
    if (!token || authHeader === token) { // Verifica se o 'Bearer ' foi removido
      console.error("Token não encontrado ou mal formatado no header Authorization.");
      return new Response(JSON.stringify({ error: "Token mal formatado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log("Token extraído, tentando autenticar com supabase.auth.getUser(token)...");

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Erro de autenticação do Supabase:", authError?.message || "Usuário não pôde ser obtido.");
      if (authError) {
        console.error("Detalhes do erro de autenticação:", JSON.stringify(authError));
      }
      return new Response(JSON.stringify({ error: "Usuário não autenticado", details: authError?.message || "Token inválido ou expirado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log(`Usuário autenticado com sucesso: ${user.id}, email: ${user.email}`);

    // 2. PROCESSAMENTO DA REQUISIÇÃO
    const { clinic_id, plan_name, value, cycle, billing_type, description } = await req.json() as RequestBody;
    if (!clinic_id || !plan_name || !value || !cycle || !billing_type) {
      throw new Error("Dados da requisição incompletos");
    }

    // 3. OPERAÇÕES COM SUPABASE ADMIN
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: clinic, error: clinicError } = await supabaseAdmin.from("clinics").select("name").eq("id", clinic_id).single();
    if (clinicError) throw new Error("Clínica não encontrada");

    const { data: userData, error: userDataError } = await supabaseAdmin.from("profiles").select("full_name, cpf, phone").eq("id", user.id).single();
    console.log(`Dados do perfil obtidos do banco de dados para o usuário ${user.id}:`, userData);

    if (userDataError) {
      console.error(`Erro ao buscar perfil para o id: ${user.id}. Detalhes do erro:`, JSON.stringify(userDataError));
      throw new Error(`Erro ao consultar o perfil do usuário: ${userDataError.message}`);
    }

    if (!userData) {
      console.error(`Nenhum perfil encontrado na tabela 'profiles' para o id: ${user.id}`);
      throw new Error("Dados do usuário não encontrados na base de dados.");
    }

    // 4. CRIAÇÃO DA ASSINATURA NO ASAAS
    const subscriptionData = await createPaymentSubscription({
      clinicId: clinic_id,
      clinicName: clinic.name,
      userName: userData.full_name || user.email?.split("@")[0] || "Cliente",
      userEmail: user.email || "",
      userDocument: userData.cpf || "",
      userPhone: userData.phone || "",
      planName: plan_name,
      planValue: value,
      planCycle: cycle,
      billingType: billing_type,
      description: description || `Plano ${plan_name} - Cliniks AI Protocol Hub`,
    });

    // 5. SALVAR ASSINATURA NO BANCO DE DADOS
    const { error: insertError } = await supabaseAdmin.from("subscriptions").insert({

      clinic_id: clinic_id,
      asaas_subscription_id: subscriptionData.subscription_id,
      status: 'PENDING', // Definitivo: Força o status inicial para PENDING, aguardando confirmação do webhook.
      plan_name: plan_name,
      value: value,
      cycle: cycle,
      billing_type: billing_type,
      next_due_date: subscriptionData.next_due_date,
      payment_url: subscriptionData.payment_url,
    });

    if (insertError) {
      console.error("Erro ao salvar assinatura no DB:", insertError);
      throw new Error("Erro ao salvar dados da assinatura");
    }

    // 6. RETORNO DE SUCESSO
    return new Response(JSON.stringify({ success: true, data: subscriptionData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro na Edge Function 'create-subscription':", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Função auxiliar para interagir com a API do Asaas
async function createPaymentSubscription(params: {
  clinicId: string;
  clinicName: string;
  userName: string;
  userEmail: string;
  userDocument: string;
  userPhone: string;
  planName: string;
  planValue: number;
  planCycle: string;
  billingType: string;
  description: string;
}): Promise<SubscriptionData> {
  const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
  const asaasBaseUrl = Deno.env.get('ASAAS_API_URL');

  if (!asaasApiKey) {
    console.error("Variável de ambiente ASAAS_API_KEY não está configurada.");
    throw new Error('ASAAS_API_KEY não configurada');
  }
  if (!asaasBaseUrl) {
    console.error("Variável de ambiente ASAAS_API_URL não está configurada.");
    throw new Error('ASAAS_API_URL não configurada');
  }

  // 1. ENCONTRAR OU CRIAR CLIENTE NO ASAAS
  const customerResponse = await fetch(`${asaasBaseUrl}/customers?email=${params.userEmail}`, {
    headers: { 'access_token': asaasApiKey },
  });
  const customersText = await customerResponse.text();
  console.log(`Resposta bruta (busca de cliente) do Asaas: Status ${customerResponse.status}, Corpo: ${customersText}`);
  if (!customerResponse.ok) throw new Error(`Erro ao buscar cliente no Asaas: ${customersText}`);
  const customers = JSON.parse(customersText);
  let customerId: string;

  if (customers.data && customers.data.length > 0) {
    customerId = customers.data[0].id;
  } else {
    const customerPayload = {
      name: params.userName,
      email: params.userEmail,
      cpfCnpj: params.userDocument,
      phone: params.userPhone,
      externalReference: params.clinicId,
    };
    console.log('Enviando payload para criar cliente no Asaas:', customerPayload);

    const newCustomerResponse = await fetch(`${asaasBaseUrl}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
      body: JSON.stringify(customerPayload),
    });
    const newCustomerText = await newCustomerResponse.text();
    console.log(`Resposta bruta (criação de cliente) do Asaas: Status ${newCustomerResponse.status}, Corpo: ${newCustomerText}`);
    if (!newCustomerResponse.ok) throw new Error(`Erro ao criar cliente no Asaas: ${newCustomerText}`);
    const newCustomer = JSON.parse(newCustomerText);
    if (newCustomer.errors) throw new Error(`Erro ao criar cliente no Asaas: ${JSON.stringify(newCustomer.errors)}`);
    customerId = newCustomer.id;
  }

  // 2. CRIAR A ASSINATURA
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + 7); // Data de vencimento para 7 dias

  const subscriptionPayload: AsaasSubscriptionData = {
    customer: customerId,
    billingType: params.billingType.toUpperCase(),
    value: params.planValue,
    nextDueDate: nextDueDate.toISOString().split('T')[0],
    cycle: params.planCycle.toUpperCase(),
    description: params.description,
    externalReference: `clinic_${params.clinicId}_plan_${params.planName}`,
  };
  
  const walletId = Deno.env.get('ASAAS_WALLET_ID');
  if (walletId) {
    subscriptionPayload.walletId = walletId;
  }

  const subscriptionResponse = await fetch(`${asaasBaseUrl}/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
    body: JSON.stringify(subscriptionPayload),
  });

  const subscriptionResultText = await subscriptionResponse.text();
  console.log(`Resposta bruta (criação de assinatura) do Asaas: Status ${subscriptionResponse.status}, Corpo: ${subscriptionResultText}`);
  if (!subscriptionResponse.ok) throw new Error(`Erro ao criar assinatura no Asaas: ${subscriptionResultText}`);
  const subscriptionResult = JSON.parse(subscriptionResultText);

  if (subscriptionResult.errors) {
    console.error('Erro ao criar assinatura no Asaas:', subscriptionResult.errors);
    throw new Error(`Erro ao criar assinatura no Asaas: ${JSON.stringify(subscriptionResult.errors)}`);
  }

  return {
    subscription_id: subscriptionResult.id,
    status: 'PENDING', // Forçar o status inicial como pendente, aguardando confirmação do webhook
    payment_url: subscriptionResult.invoiceUrl || subscriptionResult.bankSlipUrl,
    next_due_date: subscriptionResult.nextDueDate,
  };
}

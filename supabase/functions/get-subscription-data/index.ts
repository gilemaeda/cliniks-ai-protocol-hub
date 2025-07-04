import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as base64 from 'https://deno.land/std@0.168.0/encoding/base64.ts';

// Definição de CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para decodificar o token JWT
function decodeJWT(token: string) {
  try {
    const [, payload] = token.split('.');
    const decodedPayload = new TextDecoder().decode(
      base64.decode(payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(payload.length + (4 - payload.length % 4) % 4, '='))
    );
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Erro ao decodificar JWT:', error);
    return null;
  }
}

// Função principal
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    const asaasBaseUrl = Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com/v3';

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !asaasApiKey) {
      throw new Error('Variáveis de ambiente não configuradas corretamente.');
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const url = new URL(req.url);
    const clinicId = url.searchParams.get('clinic_id');
    
    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'ID da clínica não fornecido' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    try {
      const decodedToken = decodeJWT(token);
      if (!decodedToken || !decodedToken.sub) {
        return new Response(JSON.stringify({ error: 'Token inválido ou expirado' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
      }
      
      const userId = decodedToken.sub;
      
      const { data: userClinicData, error: rpcError } = await supabaseAdmin
        .rpc('get_user_clinic_data', { user_uuid: userId });

      if (rpcError) {
        throw new Error(`Erro na RPC get_user_clinic_data: ${rpcError.message}`);
      }

      const hasAccess = userClinicData.some((data: { clinic_id: string }) => data.clinic_id === clinicId);
      if (!hasAccess) {
        return new Response(JSON.stringify({ error: 'Acesso negado à clínica especificada' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 });
      }
    } catch (error) {
      console.error('Erro ao processar token:', error);
      return new Response(JSON.stringify({ error: `Erro ao processar autenticação: ${error.message}` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      console.error('Erro ao buscar assinatura:', subscriptionError);
      return new Response(JSON.stringify({ 
        error: 'Falha ao buscar dados da assinatura no banco de dados.',
        details: subscriptionError.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!subscriptionData) {
      // Verificar se a clínica está em período de trial
      const { data: clinicData, error: clinicError } = await supabaseAdmin
        .from('clinics')
        .select('created_at')
        .eq('id', clinicId)
        .single();
      
      if (clinicError) {
        console.error('Erro ao buscar dados da clínica para verificar trial:', clinicError);
        return new Response(JSON.stringify({ data: null }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
      
      // Verificar se está dentro do período de trial (15 dias)
      const clinicCreatedAt = new Date(clinicData.created_at);
      const now = new Date();
      const trialPeriodDays = 15;
      const trialEndDate = new Date(clinicCreatedAt);
      trialEndDate.setDate(trialEndDate.getDate() + trialPeriodDays);
      
      if (now <= trialEndDate) {
        // Ainda está no período de trial
        const daysLeft = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`Clínica ${clinicId} está em período de trial com ${daysLeft} dias restantes`);
        
        return new Response(JSON.stringify({ 
          data: {
            status: 'TRIAL',
            trial_end_date: trialEndDate.toISOString(),
            days_left: daysLeft
          }
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
      
      // Se não está em trial e não tem assinatura, retorna null
      return new Response(JSON.stringify({ data: null }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    if (subscriptionData.asaas_subscription_id) {
      try {
        console.log('Verificando status da assinatura no Asaas:', subscriptionData.asaas_subscription_id);
        const asaasResponse = await fetch(`${asaasBaseUrl}/subscriptions/${subscriptionData.asaas_subscription_id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey }
        });

        if (asaasResponse.ok) {
          const asaasData = await asaasResponse.json();
          console.log('Status no Asaas:', asaasData.status, 'Status no banco:', subscriptionData.status);
          
          // Verificar se o status no Asaas é diferente do status no banco
          if (asaasData.status !== subscriptionData.status) {
            console.log(`Atualizando status da assinatura ${subscriptionData.id} de ${subscriptionData.status} para ${asaasData.status}`);
            
            // Verificar se o status é válido para atualização
            // Manter o status 'pending' se a assinatura foi criada mas ainda não foi confirmada
            let newStatus = asaasData.status;
            
            // Se o status atual é 'pending' e o novo status não é 'ACTIVE', manter como 'pending'
            // Isso garante que o acesso só será liberado quando o pagamento for confirmado
            if (subscriptionData.status === 'pending' && asaasData.status !== 'ACTIVE') {
              console.log('Mantendo status como pending até confirmação de pagamento');
              newStatus = 'pending';
            }
            
            // Atualizar o status no banco de dados
            const { error: updateError } = await supabaseAdmin
              .from('subscriptions')
              .update({ 
                status: newStatus,
                next_due_date: asaasData.nextDueDate || subscriptionData.next_due_date
              })
              .eq('id', subscriptionData.id);
              
            if (updateError) {
              console.error('Erro ao atualizar status da assinatura:', updateError);
            } else {
              // Atualizar o objeto que será retornado
              subscriptionData.status = newStatus;
              subscriptionData.next_due_date = asaasData.nextDueDate || subscriptionData.next_due_date;
              console.log('Status atualizado com sucesso para:', newStatus);
            }
          }
          
          // Adicionar informações adicionais da assinatura do Asaas
          subscriptionData.asaas_data = {
            cycle: asaasData.cycle,
            nextDueDate: asaasData.nextDueDate,
            value: asaasData.value,
            description: asaasData.description,
            billingType: asaasData.billingType
          };
          
          // Verificar se há pagamentos pendentes ou atrasados
          try {
            const paymentsResponse = await fetch(`${asaasBaseUrl}/payments?subscription=${subscriptionData.asaas_subscription_id}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey }
            });
            
            if (paymentsResponse.ok) {
              const paymentsData = await paymentsResponse.json();
              
              // Adicionar informações de pagamento ao objeto de retorno
              if (paymentsData.data && paymentsData.data.length > 0) {
                const latestPayment = paymentsData.data[0];
                subscriptionData.latest_payment = {
                  id: latestPayment.id,
                  status: latestPayment.status,
                  dueDate: latestPayment.dueDate,
                  value: latestPayment.value,
                  billingType: latestPayment.billingType
                };
                
                // Se o status da assinatura é 'ACTIVE' mas o pagamento está atrasado, marcar como 'OVERDUE'
                if (subscriptionData.status === 'ACTIVE' && latestPayment.status === 'OVERDUE') {
                  console.log('Pagamento atrasado detectado, atualizando status para OVERDUE');
                  
                  const { error: overdueError } = await supabaseAdmin
                    .from('subscriptions')
                    .update({ status: 'OVERDUE' })
                    .eq('id', subscriptionData.id);
                    
                  if (!overdueError) {
                    subscriptionData.status = 'OVERDUE';
                  }
                }
              }
            }
          } catch (paymentError) {
            console.error('Erro ao buscar pagamentos da assinatura:', paymentError);
          }
        } else {
          console.error('Erro ao buscar dados do Asaas:', await asaasResponse.text());
        }
      } catch (error) {
        console.error('Erro ao buscar dados atualizados do Asaas:', error);
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

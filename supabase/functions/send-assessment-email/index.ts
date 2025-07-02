import { serve } from 'std/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

// Função para enviar email com o PDF da avaliação
serve(async (req) => {
  // Configuração CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extrai os dados da requisição
    const requestData = await req.json();
    const { assessmentId, recipientEmail, pdfBase64 } = requestData;
    
    // Log para debug
    console.log('Dados recebidos:', JSON.stringify({ 
      assessmentId, 
      recipientEmail,
      pdfSize: pdfBase64 ? `${Math.round(pdfBase64.length / 1024)} KB` : 'não fornecido'
    }));
    
    // Validação básica de campos obrigatórios
    if (!assessmentId || !recipientEmail || !pdfBase64) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios faltando', status: 400 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }
    
    // Configuração do cliente Supabase com chave de serviço
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Buscar detalhes da avaliação para incluir no email
    const { data: assessment, error: assessmentError } = await supabaseAdmin
      .from('assessments')
      .select(`
        id,
        patient_name,
        assessment_type,
        created_at,
        professionals (
          profiles (
            full_name,
            email
          )
        )
      `)
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      console.error('Erro ao buscar detalhes da avaliação:', assessmentError);
      return new Response(
        JSON.stringify({ 
          error: `Erro ao buscar detalhes da avaliação: ${assessmentError?.message || 'Avaliação não encontrada'}`, 
          status: 404 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // Configurar serviço de email (usando Resend, SendGrid, ou outro serviço)
    // Aqui você precisará configurar a API de email que deseja usar
    // Este é um exemplo usando fetch para uma API de email genérica
    
    const emailApiKey = Deno.env.get('EMAIL_API_KEY') || '';
    const emailSender = Deno.env.get('EMAIL_SENDER') || 'noreply@cliniks.com.br';
    
    if (!emailApiKey) {
      console.error('Chave de API de email não configurada');
      return new Response(
        JSON.stringify({ 
          error: 'Serviço de email não configurado', 
          status: 500 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Formatar a data da avaliação
    const assessmentDate = new Date(assessment.created_at).toLocaleDateString('pt-BR');
    
    // Preparar o tipo de avaliação para exibição
    let assessmentType = 'Avaliação';
    switch (assessment.assessment_type) {
      case 'facial':
        assessmentType = 'Avaliação Facial';
        break;
      case 'corporal':
        assessmentType = 'Avaliação Corporal';
        break;
      case 'capilar':
        assessmentType = 'Avaliação Capilar';
        break;
    }

    // Preparar o conteúdo do email
    const emailSubject = `${assessmentType} - ${assessment.patient_name}`;
    const emailContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 2px solid #dee2e6; }
            .content { padding: 20px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${assessmentType}</h2>
              <p>Paciente: ${assessment.patient_name}</p>
            </div>
            <div class="content">
              <p>Olá,</p>
              <p>Segue em anexo a avaliação realizada em ${assessmentDate}.</p>
              <p>Para mais detalhes, acesse o portal da Cliniks.</p>
            </div>
            <div class="footer">
              <p>Esta é uma mensagem automática, por favor não responda este email.</p>
              <p>© ${new Date().getFullYear()} Cliniks - Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Enviar o email usando uma API de email
    // Este é um exemplo genérico - você precisará adaptar para o serviço específico que usar
    try {
      // Exemplo usando Resend.com (você precisará configurar sua conta)
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${emailApiKey}`
        },
        body: JSON.stringify({
          from: emailSender,
          to: recipientEmail,
          subject: emailSubject,
          html: emailContent,
          attachments: [
            {
              filename: `avaliacao-${assessment.patient_name.replace(/\s+/g, '-').toLowerCase()}-${assessmentDate.replace(/\//g, '-')}.pdf`,
              content: pdfBase64,
              encoding: 'base64'
            }
          ]
        })
      });

      const emailResult = await response.json();
      
      if (!response.ok) {
        throw new Error(`Erro ao enviar email: ${JSON.stringify(emailResult)}`);
      }

      // Registrar o envio do email no banco de dados (opcional)
      const { error: logError } = await supabaseAdmin
        .from('email_logs')
        .insert({
          assessment_id: assessmentId,
          recipient: recipientEmail,
          sent_at: new Date().toISOString(),
          status: 'sent'
        });

      if (logError) {
        console.warn('Erro ao registrar log de email:', logError);
      }

      // Retornar sucesso
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Email enviado com sucesso',
          emailId: emailResult.id || null
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
      
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      return new Response(
        JSON.stringify({ 
          error: emailError instanceof Error ? emailError.message : 'Erro ao enviar email', 
          status: 500 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

  } catch (error) {
    console.error('ERRO FATAL:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        status: 500
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

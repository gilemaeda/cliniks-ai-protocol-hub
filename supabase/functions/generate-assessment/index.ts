
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { 
      assessment_type,
      patient_name, 
      patient_age, 
      main_complaint,
      treatment_objective, 
      observations,
      specific_data,
      clinic_resources
    } = await req.json();

    console.log('Generating assessment for:', { patient_name, assessment_type });

    // Buscar configurações de IA
    const { data: aiSettings } = await supabase
      .from('ai_settings')
      .select('*')
      .limit(1)
      .single();

    let systemPrompt = `Você é um especialista em estética clínica. Gere um protocolo de tratamento detalhado baseado nas informações do paciente.`;
    
    if (aiSettings?.prompt_text) {
      systemPrompt = aiSettings.prompt_text;
    }

    // Preparar informações dos recursos da clínica se disponíveis
    let resourcesInfo = '';
    if (clinic_resources && clinic_resources.length > 0) {
      resourcesInfo = `\n\nRECURSOS DISPONÍVEIS NA CLÍNICA:\n`;
      clinic_resources.forEach((resource: any) => {
        resourcesInfo += `- ${resource.name} (${resource.resource_type}): ${resource.purpose || 'Sem descrição'}\n`;
      });
      resourcesInfo += `\nConsidere estes recursos ao elaborar o protocolo.`;
    }

    // Preparar informações específicas por tipo
    let specificInfo = '';
    if (specific_data) {
      if (assessment_type === 'facial') {
        specificInfo = `\nTIPO DE PELE: ${specific_data.skin_type || 'Não informado'}\nPREOCUPAÇÕES: ${specific_data.skin_concerns || 'Não informado'}`;
      } else if (assessment_type === 'corporal') {
        specificInfo = `\nÁREA CORPORAL: ${specific_data.body_area || 'Não informado'}\nRESULTADOS DESEJADOS: ${specific_data.desired_results || 'Não informado'}`;
      } else if (assessment_type === 'capilar') {
        specificInfo = `\nTIPO DE COURO CABELUDO: ${specific_data.scalp_type || 'Não informado'}\nPREOCUPAÇÕES CAPILARES: ${specific_data.hair_concerns || 'Não informado'}`;
      }
    }

    const userPrompt = `
DADOS DO PACIENTE:
- Nome: ${patient_name}
- Idade: ${patient_age} anos
- Tipo de Avaliação: ${assessment_type}
- Queixa Principal: ${main_complaint}
- Objetivo do Tratamento: ${treatment_objective}
- Observações: ${observations || 'Nenhuma observação adicional'}${specificInfo}${resourcesInfo}

Por favor, gere um protocolo de tratamento detalhado e profissional para este paciente.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiSettings?.ai_model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedProtocol = data.choices[0].message.content;

    console.log('Assessment protocol generated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      protocol: generatedProtocol 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-assessment function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

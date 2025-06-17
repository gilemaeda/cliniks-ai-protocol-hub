import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from 'https://deno.land/x/openai@v4.24.1/mod.ts';
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
    return new Response('ok', { headers: corsHeaders })
  }

    try {

    const { 
      protocolName, 
      description, 
      targetAudience, 
      duration, 
      area, 
      objectives, 
      procedures, 
      materials, 
      observations 
    } = await req.json();


    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Fetch the prompt using its designated name for reliability
    const { data: promptData, error: promptError } = await supabase
      .from('ai_settings')
      .select('prompt_content')
      .eq('prompt_name', 'protocolo_manual') // Using a stable name instead of a magic ID
      .single()

    if (promptError) {
      throw new Error(`Database error: ${promptError.message}`)
    }


    if (!promptData || !promptData.prompt_content) {
      throw new Error('AI prompt configuration for manual protocols not found or is empty.');
    }

    const systemPrompt = promptData.prompt_content;

    const userPrompt = `
      Por favor, gere um protocolo de tratamento estético com base nos seguintes detalhes:
      - Ideia para o nome do protocolo (crie um nome comercial e criativo a partir desta ideia): ${protocolName || 'Não especificado'}
      - Descrição: ${description || 'Não especificado'}
      - Público-Alvo: ${targetAudience || 'Não especificado'}
      - Duração do Tratamento: ${duration || 'Não especificado'}
      - Área de Aplicação: ${area || 'Não especificado'}
      - Objetivos: ${objectives || 'Não especificado'}
      - Procedimentos Sugeridos: ${procedures || 'Não especificado'}
      - Materiais Necessários: ${materials || 'Não especificado'}
      - Observações: ${observations || 'Não especificado'}

      O resultado deve ser um texto contínuo e bem formatado em markdown, sem repetir as instruções do prompt.
    `;

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });


    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'gpt-4-turbo',
    });

    const generatedContent = chatCompletion.choices[0].message.content;


    return new Response(JSON.stringify({ generatedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('CRITICAL_ERROR: Unhandled exception in generate-protocol.', error);
    return new Response(JSON.stringify({ error: `Erro crítico no servidor: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});


import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== CHAT IA FUNCTION ===');
    
    const { message, context, customPrompt, aiModel } = await req.json();
    console.log('Dados recebidos:', { message, context, customPrompt, aiModel });

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // Definir prompt base ou usar o customizado do admin
    let systemPrompt = `Você é uma assistente especializada em estética clínica. 
Responda sempre em português brasileiro de forma clara, técnica e profissional.
Foque em tratamentos estéticos, protocolos clínicos, indicações e contraindicações.
Seja específica e forneça informações baseadas em evidências científicas.`;

    // Se há um prompt customizado do admin, usar ele
    if (customPrompt && customPrompt.trim()) {
      systemPrompt = customPrompt;
      console.log('Usando prompt customizado do admin');
    } else {
      console.log('Usando prompt padrão');
    }

    // Usar modelo especificado ou padrão
    const modelToUse = aiModel || 'gpt-4o-mini';
    console.log('Modelo de IA:', modelToUse);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro da OpenAI:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('Resposta gerada com sucesso');

    return new Response(JSON.stringify({ 
      success: true,
      response: aiResponse,
      model: modelToUse 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no chat IA:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

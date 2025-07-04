import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Função test-webhook iniciada");

serve(async (req) => {
  // Lidar com requisições OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { webhookUrl } = await req.json();

    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "URL do webhook não fornecida" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Preparar dados de teste
    const testPayload = {
      event: "TEST_WEBHOOK",
      timestamp: new Date().toISOString(),
      source: "Cliniks AI Protocol Hub",
      data: {
        message: "Este é um teste do webhook configurado no sistema.",
        system_info: {
          app_version: "1.0.0",
          test_id: crypto.randomUUID()
        }
      }
    };

    // Enviar requisição para o webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    // Ler o corpo da resposta como texto
    const responseText = await response.text();
    let responseBody;
    
    try {
      // Tentar fazer parse do corpo como JSON
      responseBody = JSON.parse(responseText);
    } catch (e) {
      // Se não for JSON, usar o texto bruto
      responseBody = { rawText: responseText };
    }

    // Retornar resultado do teste
    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        message: response.ok 
          ? `Teste realizado com sucesso! Status: ${response.status} ${response.statusText}` 
          : `Erro ao testar webhook. Status: ${response.status} ${response.statusText}`,
        response: responseBody
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Erro ao testar webhook:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Erro ao conectar: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

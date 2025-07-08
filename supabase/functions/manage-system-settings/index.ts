import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Função manage-system-settings iniciada");

serve(async (req) => {
  // Lidar com requisições OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase com a service_role key para contornar RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { action, key, value, settings } = await req.json();

    // Verificar se o usuário é um admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Cabeçalho de autorização ausente");
      return new Response(
        JSON.stringify({ success: false, message: "Não autorizado - cabeçalho de autorização ausente" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Cabeçalho de autorização recebido:", authHeader.substring(0, 15) + "...");
    const token = authHeader.replace("Bearer ", "");
    
    // Verificar se o usuário é um admin
    let user;
    try {
      const { data, error: authError } = await supabaseClient.auth.getUser(token);

      if (authError) {
        console.error("Erro na autenticação:", authError);
        return new Response(
          JSON.stringify({ success: false, message: "Não autorizado - erro na validação do token", error: authError }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!data.user) {
        console.error("Usuário não encontrado para o token fornecido");
        return new Response(
          JSON.stringify({ success: false, message: "Não autorizado - usuário não encontrado" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      user = data.user;
      console.log("Usuário autenticado com sucesso:", user.email);
    } catch (authError) {
      console.error("Exceção na autenticação:", authError);
      return new Response(
        JSON.stringify({ success: false, message: "Não autorizado - erro na autenticação", error: String(authError) }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Usuário já foi validado no bloco anterior
    
    console.log("Verificando se o usuário é admin:", user.email);
    
    // Verificar se o email é gilemaeda@gmail.com (admin master)
    if (user.email === "gilemaeda@gmail.com") {
      console.log("Usuário é admin master, permitindo acesso");
      // Admin master, permitir acesso direto
    } else {
      // Para outros usuários, verificar na tabela admin_users
      const { data: adminData, error: adminError } = await supabaseClient
        .from("admin_users")
        .select("*")
        .eq("email", user.email)
        .single();

      console.log("Resultado da consulta admin_users:", { adminData, adminError });

      if (adminError || !adminData) {
        return new Response(
          JSON.stringify({ success: false, message: "Usuário não é um administrador" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Log adicional para diagnóstico
    console.log("Usuário validado como admin, processando ação:", action, "para chave:", key);

    // Processar a ação solicitada
    if (action === "get") {
      // Buscar configuração
      console.log("Buscando configuração para chave:", key);
      const { data, error } = await supabaseClient
        .from("system_settings")
        .select("*")
        .eq("key", key)
        .single();

      if (error) {
        // Se o erro for "não encontrado", retornar sucesso com dados vazios
        if (error.code === "PGRST116") {
          console.log("Configuração não encontrada para chave:", key);
          return new Response(
            JSON.stringify({ success: true, data: null }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        console.error("Erro ao buscar configuração:", error);
        return new Response(
          JSON.stringify({ success: false, message: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "set") {
      console.log("Salvando configuração para chave:", key, "com valor:", value);
      
      // Verificar se a configuração já existe
      const { data: existingData, error: checkError } = await supabaseClient
        .from("system_settings")
        .select("id")
        .eq("key", key)
        .maybeSingle();

      let result;
      
      if (existingData) {
        // Atualizar configuração existente
        result = await supabaseClient
          .from("system_settings")
          .update({ value })
          .eq("key", key);
      } else {
        // Criar nova configuração
        result = await supabaseClient
          .from("system_settings")
          .insert({
            key,
            value,
            description: `Configuração para ${key}`
          });
      }

      if (result.error) {
        console.error("Erro ao salvar configuração:", result.error);
        return new Response(
          JSON.stringify({ success: false, message: result.error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log("Configuração salva com sucesso para chave:", key);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Configuração salva com sucesso",
          data: { key, value }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "set-batch") {
      console.log("Salvando configurações em lote:", settings);

      if (!Array.isArray(settings) || settings.length === 0) {
        return new Response(
          JSON.stringify({ success: false, message: "Nenhuma configuração fornecida para salvar em lote." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabaseClient
        .from("system_settings")
        .upsert(settings, { onConflict: 'key' });

      if (error) {
        console.error("Erro ao salvar configurações em lote:", error);
        return new Response(
          JSON.stringify({ success: false, message: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Configurações em lote salvas com sucesso.");
      return new Response(
        JSON.stringify({ success: true, message: "Configurações salvas com sucesso" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, message: "Ação inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erro não tratado na Edge Function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : "Erro desconhecido",
        error: String(error)
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

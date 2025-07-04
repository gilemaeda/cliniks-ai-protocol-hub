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

    const { action, key, value } = await req.json();

    // Verificar se o usuário é um admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se o usuário é um admin
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

    // Processar a ação solicitada
    if (action === "get") {
      // Buscar configuração
      const { data, error } = await supabaseClient
        .from("system_settings")
        .select("*")
        .eq("key", key)
        .single();

      if (error) {
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
        return new Response(
          JSON.stringify({ success: false, message: result.error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Configuração salva com sucesso" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, message: "Ação inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erro:", error);
    
    return new Response(
      JSON.stringify({ success: false, message: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

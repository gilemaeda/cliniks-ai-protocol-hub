import { supabase } from '@/integrations/supabase/client';

/**
 * Verifica se um e-mail já existe no sistema de autenticação do Supabase.
 * @param email O e-mail a ser verificado.
 * @returns true se o e-mail existir, false caso contrário.
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  if (!email) return false;
  
  try {
    console.log('Verificando se o e-mail já existe:', email);
    
    // Método 1: Usa a função RPC personalizada para verificar se o e-mail existe
    try {
      const { data, error } = await supabase
        .rpc('check_email_exists', { email_to_check: email });
      
      if (!error) {
        console.log('Resultado da verificação de e-mail via RPC:', data);
        // Se data for true, o e-mail já existe
        if (data === true) return true;
      } else {
        console.error('Erro ao chamar RPC check_email_exists:', error);
      }
    } catch (rpcError) {
      console.error('Erro ao executar RPC:', rpcError);
    }
    
    // Método 2: Verifica na tabela de perfis
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email);
      
      if (profileData && profileData.length > 0) {
        console.log('E-mail encontrado na tabela de perfis');
        return true;
      }
    } catch (profileErr) {
      console.error('Erro ao verificar perfis:', profileErr);
    }
    
    // Se chegou até aqui, o e-mail não foi encontrado em nenhuma verificação
    return false;
  } catch (error) {
    console.error('Erro não tratado ao verificar e-mail:', error);
    // Em caso de erro não tratado, assume que não existe para não bloquear o usuário
    return false;
  }
};

/**
 * Verifica se um CNPJ já existe na tabela de clínicas.
 * @param cnpj O CNPJ a ser verificado.
 * @returns true se o CNPJ existir, false caso contrário.
 */
export const checkCnpjExists = async (cnpj: string): Promise<boolean> => {
  try {
    // Remover formatação do CNPJ para garantir consistência
    const cleanCnpj = cnpj.replace(/[^0-9]/g, '');
    
    console.log('Verificando se o CNPJ já existe:', cleanCnpj);
    
    // Usar o método .select().eq() em vez de .single() para evitar erro 406
    const { data, error } = await supabase
      .from('clinics')
      .select('cnpj')
      .eq('cnpj', cleanCnpj);

    if (error) {
      console.error('Erro ao verificar CNPJ:', error);
      return false; // Em caso de erro, assume que não existe
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Erro não tratado ao verificar CNPJ:', error);
    return false;
  }
};

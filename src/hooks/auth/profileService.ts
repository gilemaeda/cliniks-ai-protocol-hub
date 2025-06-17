
import { supabase } from '@/integrations/supabase/client';
import { Profile } from './types';

export const profileService = {
  fetchProfile: async (userId: string): Promise<Profile | null> => {
    try {
      console.log('profileService - Fetching profile for user:', userId);
      if (!userId) {
        console.log('profileService - No userId provided');
        return null;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle() para retornar null em vez de erro se não encontrado

      if (profileError) {
        // Log o erro. PGRST116 (single row not found) não será um erro com maybeSingle.
        console.error('profileService - Error fetching profile:', profileError);
        return null; // Retorna null em caso de erro real de consulta
      }

      if (profileData) {
        console.log('profileService - Profile found:', profileData);
        return profileData;
      } else {
        // profileData é null e não houve erro, significa que o perfil não existe
        console.log('profileService - No profile found, creating one');
        return await profileService.createProfile(userId);
      }
    } catch (error) { // Captura erros inesperados na lógica do try
      console.error('profileService - Error in fetchProfile catch block:', error);
      return null;
    }
  },

  createProfile: async (userId: string): Promise<Profile | null> => {
    try {
      console.log('profileService - Creating profile for user:', userId);
      
      if (!userId) {
        console.log('profileService - No userId provided for profile creation');
        return null;
      }
      
      const { data: userData } = await supabase.auth.getUser();
      const userMetadata = userData.user?.user_metadata || {};
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: userMetadata.full_name || userData.user?.email?.split('@')[0] || 'Usuário',
          role: 'clinic_owner'
        })
        .select()
        .maybeSingle();
      
      if (createError) {
        console.error('profileService - Error creating profile:', createError);
        return null;
      }
      
      if (newProfile) {
        console.log('profileService - Profile created successfully:', newProfile);
        return newProfile;
      }
      
      return null;
    } catch (error) {
      console.error('profileService - Error creating user profile:', error);
      return null;
    }
  }
};

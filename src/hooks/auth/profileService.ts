import { supabase } from '@/integrations/supabase/client';
import { Profile } from './types';

const TIMEOUT_DURATION = 20000;

const withTimeout = <T,>(
  promise: Promise<T>,
  ms: number
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Promise timed out after ${ms}ms`));
    }, ms);

    promise.then(
      (res) => {
        clearTimeout(timeoutId);
        resolve(res);
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(err);
      }
    );
  });
};

export const profileService = {
  fetchProfile: async (userId: string): Promise<Profile | null> => {
    try {
      console.log('profileService - Fetching profile for user:', userId);
      if (!userId) {
        console.log('profileService - No userId provided');
        return null;
      }

      const query = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data: profileData, error: profileError } = await withTimeout(query, 20000);

      if (profileError) {
        console.error('profileService - Error fetching profile:', profileError);
        return null;
      }

      if (profileData) {
        console.log('profileService - Profile found:', profileData);
        return profileData;
      } else {
        console.log('profileService - No profile found, creating one');
        return await profileService.createProfile(userId);
      }
    } catch (error) {
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
      const userEmail = userData.user?.email;

      console.log('profileService - User data for profile creation:', { 
        userId, 
        email: userEmail, 
        metadata: userMetadata 
      });

      // Garantir que temos dados essenciais
      if (!userEmail) {
        console.error('profileService - Missing email for profile creation');
        return null;
      }

      const insertQuery = supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: userMetadata.full_name || userEmail.split('@')[0] || 'Usuário',
          email: userEmail, // Garantir que o email seja salvo explicitamente
          role: userMetadata.role || 'clinic_owner',
          cpf: userMetadata.cpf,
          phone: userMetadata.phone
        })
        .select()
        .maybeSingle();

      const { data: newProfile, error: createError } = await withTimeout(
        insertQuery,
        20000
      );

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
  },
};

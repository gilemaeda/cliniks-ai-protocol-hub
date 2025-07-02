
import { supabase } from '@/integrations/supabase/client';
import { profileService } from './profileService';

export const clinicService = {
  fixUserRecords: async (userId: string) => {
    try {
      console.log('clinicService - Fixing records for user:', userId);
      
      // Verificar se o usuário tem uma clínica
      const { data: clinics, error: clinicError } = await supabase
        .from('clinics')
        .select('id')
        .eq('owner_id', userId)
        .limit(1);
      
      if (clinicError) {
        console.error('clinicService - Error checking clinic:', clinicError);
        return false;
      }
      
      if (!clinics || clinics.length === 0) {
        console.log('clinicService - No clinic found for user');
        return false;
      }
      
      const clinicId = clinics[0].id;
      console.log('clinicService - Found clinic:', clinicId);
      
      // Verificar e atualizar o perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.error('clinicService - Error checking profile:', profileError);
        return false;
      }
      
      if (!profile) {
        console.log('clinicService - No profile found, creating one');
        // Obter dados do usuário
        const { data: userData } = await supabase.auth.getUser();
        const userMetadata = userData.user?.user_metadata || {};
        
        // Criar perfil
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: userMetadata.full_name || userData.user?.email?.split('@')[0] || 'Usuário',
            role: 'clinic_owner',
            clinic_id: clinicId
          });
          
        if (createProfileError) {
          console.error('clinicService - Error creating profile:', createProfileError);
          return false;
        }
        
        console.log('clinicService - Profile created successfully');
      } else if (!profile.clinic_id) {
        // Atualizar o perfil com o clinic_id
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update({ clinic_id: clinicId })
          .eq('id', userId);
          
        if (updateProfileError) {
          console.error('clinicService - Error updating profile:', updateProfileError);
          return false;
        }
        
        console.log('clinicService - Profile updated with clinic_id');
      }
      
      // Verificar e criar registro de profissional
      const { data: professional, error: professionalError } = await supabase
        .from('professionals')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();
      
      if (professionalError) {
        console.error('clinicService - Error checking professional:', professionalError);
        return false;
      }
      
      if (!professional) {
        console.log('clinicService - No professional record found, creating one');
        
        const { error: createProfessionalError } = await supabase
          .from('professionals')
          .insert({
            user_id: userId,
            clinic_id: clinicId,
            is_active: true
          });
          
        if (createProfessionalError) {
          console.error('clinicService - Error creating professional record:', createProfessionalError);
          return false;
        }
        
        console.log('clinicService - Professional record created successfully');
      }
      
      return true;
    } catch (error) {
      console.error('clinicService - Error fixing user records:', error);
      return false;
    }
  },
  ensureClinicExists: async (userId: string, fullName: string) => {
    try {
      console.log('clinicService - Checking if clinic exists for user:', userId);
      
      // Limitando a consulta para retornar apenas o primeiro resultado
      const { data: clinics, error } = await supabase
        .from('clinics')
        .select('id')
        .eq('owner_id', userId)
        .limit(1);
        
      const existingClinic = clinics && clinics.length > 0 ? clinics[0] : null;

      if (error && error.code !== '42P17') {
        console.error('clinicService - Error checking clinic:', error);
        return;
      }

      if (!existingClinic) {
        console.log('clinicService - Clinic not found, creating one');
        await clinicService.createClinic(userId, fullName);
      } else {
        console.log('clinicService - Clinic already exists:', existingClinic.id);
      }
    } catch (error) {
      console.error('clinicService - Error in ensureClinicExists:', error);
    }
  },

  createClinic: async (userId: string, fullName: string) => {
    try {
      console.log('clinicService - Creating clinic for owner:', fullName);
      const defaultName = `Clínica de ${fullName}`;

      // Define a data de término do período de teste (7 dias a partir de agora)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      // Criar a clínica com o período de teste e obter o ID
      const { data: clinicData, error } = await supabase
        .from('clinics')
        .insert({
          owner_id: userId,
          name: defaultName,
          trial_ends_at: trialEndsAt.toISOString(), // Adiciona o campo do período de teste
          // O campo 'plan' foi removido, pois o sistema de planos foi simplificado
        })
        .select('id')
        .single();

      if (error) {
        console.error('clinicService - Error creating clinic:', error);
        // Informar sobre possível coluna faltando
        if (error.message.includes('column "trial_ends_at" of relation "clinics" does not exist')) {
          console.error('--> Lembrete: A coluna `trial_ends_at` precisa ser adicionada à tabela `clinics` no Supabase.');
        }
        return null;
      }

      console.log('clinicService - Clinic created successfully with trial period:', clinicData);
      const clinicId = clinicData.id;

      // Atualizar o perfil do usuário com o clinic_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ clinic_id: clinicId })
        .eq('id', userId);

      if (profileError) {
        console.error('clinicService - Error updating profile with clinic_id:', profileError);
      } else {
        console.log('clinicService - Profile updated with clinic_id:', clinicId);
      }

      // Verificar se já existe um registro de profissional para o proprietário
      const { data: existingProfessional } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .single();

      // Criar um registro na tabela professionals para o proprietário apenas se não existir
      if (!existingProfessional) {
        const { error: professionalError } = await supabase
          .from('professionals')
          .insert({
            user_id: userId,
            clinic_id: clinicId,
            is_active: true,
          });

        if (professionalError) {
          console.error('clinicService - Error creating professional record:', professionalError);
        } else {
          console.log('clinicService - Professional record created for clinic owner');
        }
      } else {
        console.log('clinicService - Professional record already exists for clinic owner');
      }



      return clinicId;
    } catch (error) {
      console.error('clinicService - Error in createClinic:', error);
      return null;
    }
  }
};

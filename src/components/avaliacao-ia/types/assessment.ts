export interface Assessment {
  id: string;
  professional_id: string;
  clinic_id: string;
  assessment_type: 'facial' | 'corporal' | 'capilar';
  main_complaint: string;
  observations: string;
  ai_protocol: string;
  patient_name: string;
  patient_age: number;
  treatment_objective: string;
  created_at: string;
  updated_at: string;
  is_manual_patient?: boolean;
  resource_usage_mode?: string;
  selected_resource_ids?: string[];
  manual_resources_text?: string;
  ai_generated_text?: string;
  ai_model?: string;
  professionals?: {
    id: string;
    user_id: string;
    profiles?: {
      full_name: string;
      email: string;
    };
  };
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_statistics: {
        Row: {
          clinic_id: string | null
          created_at: string
          id: string
          metric_name: string
          metric_value: Json
          updated_at: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          id?: string
          metric_name: string
          metric_value?: Json
          updated_at?: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          id?: string
          metric_name?: string
          metric_value?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_statistics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          is_master: boolean
          password_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          is_master?: boolean
          password_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          is_master?: boolean
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          ai_model: string | null
          api_key: string | null
          created_at: string
          id: string
          prompt_content: string | null
          prompt_file_url: string | null
          prompt_name: string | null
          prompt_text: string | null
          protocol_chat_prompt_text: string | null
          updated_at: string
        }
        Insert: {
          ai_model?: string | null
          api_key?: string | null
          created_at?: string
          id?: string
          prompt_content?: string | null
          prompt_file_url?: string | null
          prompt_name?: string | null
          prompt_text?: string | null
          protocol_chat_prompt_text?: string | null
          updated_at?: string
        }
        Update: {
          ai_model?: string | null
          api_key?: string | null
          created_at?: string
          id?: string
          prompt_content?: string | null
          prompt_file_url?: string | null
          prompt_name?: string | null
          prompt_text?: string | null
          protocol_chat_prompt_text?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      anamnesis_data: {
        Row: {
          anamnesis_type: string
          body_assessment: Json | null
          body_measurements: Json | null
          clinic_id: string
          created_at: string
          created_by: string | null
          data: Json
          facial_assessment: Json | null
          general_health: Json | null
          hair_assessment: Json | null
          id: string
          lifestyle: Json | null
          patient_id: string
          professional_id: string | null
          updated_at: string
        }
        Insert: {
          anamnesis_type: string
          body_assessment?: Json | null
          body_measurements?: Json | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          data?: Json
          facial_assessment?: Json | null
          general_health?: Json | null
          hair_assessment?: Json | null
          id?: string
          lifestyle?: Json | null
          patient_id: string
          professional_id?: string | null
          updated_at?: string
        }
        Update: {
          anamnesis_type?: string
          body_assessment?: Json | null
          body_measurements?: Json | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          data?: Json
          facial_assessment?: Json | null
          general_health?: Json | null
          hair_assessment?: Json | null
          id?: string
          lifestyle?: Json | null
          patient_id?: string
          professional_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_data_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_data_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_data_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_data_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnesis_templates: {
        Row: {
          anamnesis_type: string
          clinic_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          questions: Json
          updated_at: string
        }
        Insert: {
          anamnesis_type: string
          clinic_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          questions?: Json
          updated_at?: string
        }
        Update: {
          anamnesis_type?: string
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          questions?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_templates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_photos: {
        Row: {
          assessment_id: string | null
          created_at: string
          description: string | null
          id: string
          photo_type: string
          photo_url: string
          session_date: string | null
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          photo_type: string
          photo_url: string
          session_date?: string | null
        }
        Update: {
          assessment_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          photo_type?: string
          photo_url?: string
          session_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_photos_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          ai_generated_text: string | null
          ai_model: string | null
          ai_protocol: string | null
          assessment_type: string
          clinic_id: string | null
          created_at: string
          id: string
          is_manual_patient: boolean | null
          main_complaint: string
          manual_resources_text: string | null
          observations: string | null
          patient_age: number
          patient_name: string
          professional_id: string | null
          resource_usage_mode: string | null
          selected_resource_ids: string[] | null
          treatment_objective: string
          updated_at: string
        }
        Insert: {
          ai_generated_text?: string | null
          ai_model?: string | null
          ai_protocol?: string | null
          assessment_type: string
          clinic_id?: string | null
          created_at?: string
          id?: string
          is_manual_patient?: boolean | null
          main_complaint: string
          manual_resources_text?: string | null
          observations?: string | null
          patient_age: number
          patient_name: string
          professional_id?: string | null
          resource_usage_mode?: string | null
          selected_resource_ids?: string[] | null
          treatment_objective: string
          updated_at?: string
        }
        Update: {
          ai_generated_text?: string | null
          ai_model?: string | null
          ai_protocol?: string | null
          assessment_type?: string
          clinic_id?: string | null
          created_at?: string
          id?: string
          is_manual_patient?: boolean | null
          main_complaint?: string
          manual_resources_text?: string | null
          observations?: string | null
          patient_age?: number
          patient_name?: string
          professional_id?: string | null
          resource_usage_mode?: string | null
          selected_resource_ids?: string[] | null
          treatment_objective?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_carousel_images: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          image_url: string
          sort_order: number | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_carousel_images_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_custom_categories: {
        Row: {
          category_name: string
          clinic_id: string
          created_at: string
          id: string
          resource_type: string
          updated_at: string
        }
        Insert: {
          category_name: string
          clinic_id: string
          created_at?: string
          id?: string
          resource_type: string
          updated_at?: string
        }
        Update: {
          category_name?: string
          clinic_id?: string
          created_at?: string
          id?: string
          resource_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_custom_categories_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_resources: {
        Row: {
          availability: string | null
          brand_model: string | null
          category: string | null
          clinic_id: string
          contraindications: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          main_actives: string | null
          name: string
          observations: string | null
          price_high: number | null
          price_low: number | null
          price_medium: number | null
          purpose: string | null
          resource_type: string
          updated_at: string
          usage_areas: string[] | null
          usage_type: string | null
        }
        Insert: {
          availability?: string | null
          brand_model?: string | null
          category?: string | null
          clinic_id: string
          contraindications?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          main_actives?: string | null
          name: string
          observations?: string | null
          price_high?: number | null
          price_low?: number | null
          price_medium?: number | null
          purpose?: string | null
          resource_type: string
          updated_at?: string
          usage_areas?: string[] | null
          usage_type?: string | null
        }
        Update: {
          availability?: string | null
          brand_model?: string | null
          category?: string | null
          clinic_id?: string
          contraindications?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          main_actives?: string | null
          name?: string
          observations?: string | null
          price_high?: number | null
          price_low?: number | null
          price_medium?: number | null
          purpose?: string | null
          resource_type?: string
          updated_at?: string
          usage_areas?: string[] | null
          usage_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_resources_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          banner_url: string | null
          brand_colors: Json | null
          cnpj: string | null
          created_at: string
          employee_count: number | null
          id: string
          logo_url: string | null
          n8n_webhook_url: string | null
          name: string
          notification_settings: Json | null
          owner_id: string
          phone: string | null
          plan: string
          plan_expires_at: string | null
          subscription_expires_at: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          banner_url?: string | null
          brand_colors?: Json | null
          cnpj?: string | null
          created_at?: string
          employee_count?: number | null
          id?: string
          logo_url?: string | null
          n8n_webhook_url?: string | null
          name: string
          notification_settings?: Json | null
          owner_id: string
          phone?: string | null
          plan?: string
          plan_expires_at?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          banner_url?: string | null
          brand_colors?: Json | null
          cnpj?: string | null
          created_at?: string
          employee_count?: number | null
          id?: string
          logo_url?: string | null
          n8n_webhook_url?: string | null
          name?: string
          notification_settings?: Json | null
          owner_id?: string
          phone?: string | null
          plan?: string
          plan_expires_at?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      custom_protocols: {
        Row: {
          area: string | null
          clinic_id: string
          content: Json
          created_at: string
          created_by: string | null
          description: string | null
          duration_weeks: number | null
          equipment_used: string[] | null
          id: string
          name: string
          protocol_theme: string | null
          start_date: string | null
          substances_used: string[] | null
          target_audience: string | null
          therapeutic_objective: string | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          clinic_id: string
          content?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_weeks?: number | null
          equipment_used?: string[] | null
          id?: string
          name: string
          protocol_theme?: string | null
          start_date?: string | null
          substances_used?: string[] | null
          target_audience?: string | null
          therapeutic_objective?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          clinic_id?: string
          content?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_weeks?: number | null
          equipment_used?: string[] | null
          id?: string
          name?: string
          protocol_theme?: string | null
          start_date?: string | null
          substances_used?: string[] | null
          target_audience?: string | null
          therapeutic_objective?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_protocols_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_card_images: {
        Row: {
          card_id: string
          card_type: string
          clinic_id: string
          created_at: string | null
          id: string
          image_url: string
          updated_at: string | null
        }
        Insert: {
          card_id: string
          card_type: string
          clinic_id: string
          created_at?: string | null
          id?: string
          image_url: string
          updated_at?: string | null
        }
        Update: {
          card_id?: string
          card_type?: string
          clinic_id?: string
          created_at?: string | null
          id?: string
          image_url?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_card_images_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_anamnesis: {
        Row: {
          answers: Json
          clinic_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          patient_id: string
          professional_id: string | null
          template_id: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          clinic_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id: string
          professional_id?: string | null
          template_id: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          clinic_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id?: string
          professional_id?: string | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_anamnesis_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_anamnesis_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_anamnesis_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_anamnesis_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_anamnesis_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_photos: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          patient_id: string
          photo_type: string
          photo_url: string
          professional_id: string | null
          session_date: string | null
          treatment_area: string | null
          uploaded_by: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          patient_id: string
          photo_type: string
          photo_url: string
          professional_id?: string | null
          session_date?: string | null
          treatment_area?: string | null
          uploaded_by?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          patient_id?: string
          photo_type?: string
          photo_url?: string
          professional_id?: string | null
          session_date?: string | null
          treatment_area?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_photos_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_photos_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_photos_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_photos_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          age: number | null
          anamnesis: Json | null
          birth_date: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          profession: string | null
          professional_id: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          age?: number | null
          anamnesis?: Json | null
          birth_date?: string | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          profession?: string | null
          professional_id?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          age?: number | null
          anamnesis?: Json | null
          birth_date?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          profession?: string | null
          professional_id?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          enabled: boolean
          feature_name: string
          id: string
          plan_name: string
        }
        Insert: {
          enabled?: boolean
          feature_name: string
          id?: string
          plan_name: string
        }
        Update: {
          enabled?: boolean
          feature_name?: string
          id?: string
          plan_name?: string
        }
        Relationships: []
      }
      professionals: {
        Row: {
          birth_date: string | null
          clinic_id: string
          council_number: string | null
          cpf: string | null
          created_at: string
          deleted_at: string | null
          education: string | null
          equipment_list: string[] | null
          formation: string | null
          id: string
          is_active: boolean
          is_owner: boolean | null
          name: string | null
          phone: string | null
          preferences: Json | null
          profile_photo_url: string | null
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          clinic_id: string
          council_number?: string | null
          cpf?: string | null
          created_at?: string
          deleted_at?: string | null
          education?: string | null
          equipment_list?: string[] | null
          formation?: string | null
          id?: string
          is_active?: boolean
          is_owner?: boolean | null
          name?: string | null
          phone?: string | null
          preferences?: Json | null
          profile_photo_url?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          clinic_id?: string
          council_number?: string | null
          cpf?: string | null
          created_at?: string
          deleted_at?: string | null
          education?: string | null
          equipment_list?: string[] | null
          formation?: string | null
          id?: string
          is_active?: boolean
          is_owner?: boolean | null
          name?: string | null
          phone?: string | null
          preferences?: Json | null
          profile_photo_url?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professionals_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          clinic_id: string | null
          clinic_name: string | null
          cnpj: string | null
          cpf: string | null
          created_at: string
          education: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          clinic_id?: string | null
          clinic_name?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          clinic_id?: string | null
          clinic_name?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          asaas_customer_id: string | null
          asaas_payment_link: string | null
          asaas_subscription_id: string | null
          billing_type: string
          clinic_id: string
          created_at: string | null
          cycle: string
          id: string
          next_due_date: string | null
          plan_name: string
          status: string
          updated_at: string | null
          value: number
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_payment_link?: string | null
          asaas_subscription_id?: string | null
          billing_type?: string
          clinic_id: string
          created_at?: string | null
          cycle?: string
          id?: string
          next_due_date?: string | null
          plan_name: string
          status?: string
          updated_at?: string | null
          value: number
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_payment_link?: string | null
          asaas_subscription_id?: string | null
          billing_type?: string
          clinic_id?: string
          created_at?: string | null
          cycle?: string
          id?: string
          next_due_date?: string | null
          plan_name?: string
          status?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      professional_profiles: {
        Row: {
          birth_date: string | null
          clinic_id: string | null
          clinic_name: string | null
          council_number: string | null
          cpf: string | null
          created_at: string | null
          education: string | null
          email: string | null
          formation: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          phone: string | null
          profile_photo_url: string | null
          specialty: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_professional: {
        Args: { professional_user_id: string; professional_clinic_id: string }
        Returns: boolean
      }
      check_email_exists: {
        Args: { email_to_check: string }
        Returns: boolean
      }
      disable_triggers: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      enable_triggers: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_clinic_patients: {
        Args: { clinic_uuid: string }
        Returns: {
          id: string
          clinic_id: string
          full_name: string
          email: string
          phone: string
          anamnesis: Json
          created_at: string
          updated_at: string
          deleted_at: string
        }[]
      }
      get_clinic_statistics: {
        Args: Record<PropertyKey, never> | { p_clinic_id: string }
        Returns: Json
      }
      get_current_user_clinic_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_detailed_clinic_stats: {
        Args: { p_clinic_id: string }
        Returns: Json
      }
      get_my_claim: {
        Args: { claim: string }
        Returns: string
      }
      get_patients_with_creator: {
        Args:
          | { p_clinic_id: string }
          | { p_clinic_id: string; p_professional_id?: string }
        Returns: {
          id: string
          created_at: string
          name: string
          birth_date: string
          phone: string
          email: string
          address: string
          clinic_id: string
          created_by: string
          cpf: string
          gender: string
          main_complaint: string
          history_of_main_complaint: string
          creator_name: string
        }[]
      }
      get_protocols_for_clinic: {
        Args: { p_clinic_id: string }
        Returns: {
          id: string
          name: string
          description: string
          content: Json
          therapeutic_objective: string
          target_audience: string
          duration_weeks: number
          equipment_used: string[]
          substances_used: string[]
          created_at: string
          clinic_id: string
          created_by: string
          updated_at: string
          profiles: Json
        }[]
      }
      get_user_clinic_data: {
        Args: { user_uuid: string }
        Returns: {
          clinic_id: string
          clinic_name: string
          professional_id: string
        }[]
      }
      get_user_clinic_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_professional_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          clinic_id: string
          professional_id: string
        }[]
      }
      is_clinic_owner: {
        Args: { target_clinic_id: string }
        Returns: boolean
      }
      is_clinic_owner_of_assessment: {
        Args: { assessment_clinic_id: string }
        Returns: boolean
      }
      is_clinic_professional: {
        Args: { target_clinic_id: string }
        Returns: boolean
      }
      is_member_of_clinic: {
        Args: { target_clinic_id: string }
        Returns: boolean
      }
      is_professional_of_clinic: {
        Args: { clinic_id: string }
        Returns: boolean
      }
      is_professional_of_specific_clinic: {
        Args: { target_clinic_id: string }
        Returns: boolean
      }
      list_clinic_professionals: {
        Args: { "": string }
        Returns: {
          id: string
          user_id: string
          clinic_id: string
          full_name: string
          specialty: string
          council_number: string
          is_active: boolean
          created_at: string
          email: string
          cpf: string
          phone: string
          formation: string
          education: string
        }[]
      }
    }
    Enums: {
      user_role: "clinic_owner" | "professional" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["clinic_owner", "professional", "admin"],
    },
  },
} as const


export interface Patient {
  id: string;
  clinic_id: string;
  professional_id?: string;
  full_name: string;
  birth_date?: string;
  age?: number;
  profession?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface PatientFormData {
  full_name: string;
  birth_date?: string;
  age?: number;
  profession?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
}

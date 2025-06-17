
export interface AnamnesisQuestion {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'number';
  question: string;
  options?: string[];
  required: boolean;
}

export interface AnamnesisTemplate {
  id: string;
  clinic_id: string;
  name: string;
  description: string | null;
  anamnesis_type: 'facial' | 'corporal' | 'capilar' | 'geral';
  questions: AnamnesisQuestion[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientAnamnesisData {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string | null;
  anamnesis_type: 'facial' | 'corporal' | 'capilar' | 'geral';
  data: Record<string, any>;
  general_health: Record<string, any>;
  lifestyle: Record<string, any>;
  facial_assessment: Record<string, any>;
  body_assessment: Record<string, any>;
  body_measurements: Record<string, any>;
  hair_assessment: Record<string, any>;
  pdf_url?: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    full_name: string;
  };
  professional?: {
    id: string;
    user_id: string;
  };
}

export interface AnamnesisFormData {
  patient_id: string;
  anamnesis_type: 'facial' | 'corporal' | 'capilar' | 'geral';
  data: Record<string, any>;
  pdf_file?: File;
}

export interface Patient {
  id: string;
  full_name: string;
}

export interface AnamnesisFilters {
  patient_id?: string;
  anamnesis_type?: string;
  professional_id?: string;
  date_from?: string;
  date_to?: string;
}

// Interfaces específicas para os formulários estruturados
export interface HistoricoSaudeGeral {
  alergia: boolean;
  alergia_especificar?: string;
  medicamentos_continuos: boolean;
  medicamentos_especificar?: string;
  doencas_preexistentes: boolean;
  doencas_especificar?: string;
  procedimentos_esteticos: boolean;
  procedimentos_especificar?: string;
  gestante_amamentando: boolean;
  doenca_autoimune: boolean;
  queloides_cicatrizacao: boolean;
  cirurgias: boolean;
  cirurgias_especificar?: string;
  problema_circulatorio: boolean;
  problema_hormonal: boolean;
  retencao_liquido: boolean;
  constipacao_intestinal: boolean;
}

export interface EstiloVida {
  dorme_bem: boolean;
  boa_alimentacao: boolean;
  atividade_fisica: boolean;
  atividade_frequencia?: string;
  consome_alcool: boolean;
  alcool_frequencia?: string;
  fuma: boolean;
  fuma_quantidade?: string;
  estresse_ansiedade_depressao: boolean;
  hidratacao_diaria: number;
  refeicoes_por_dia: number;
}

export interface AvaliacaoFacial {
  tercos_faciais: string[];
  proporcoes_faciais: 'simetricas' | 'assimetricas';
  flacidez: boolean;
  perda_volume: boolean;
  sulcos: boolean;
  linhas_estaticas: boolean;
  assimetrias: boolean;
  papada: boolean;
  linhas_expressao: boolean;
  manchas: boolean;
  observacoes_adicionais?: string;
}

export interface AvaliacaoCorporal {
  areas_incomodam?: string;
  biotipo: 'androide' | 'ginoide' | 'misto';
  celulite: boolean;
  flacidez: boolean;
  gordura_localizada: boolean;
  estrias: boolean;
  retencao_liquidos: boolean;
  fibroses: boolean;
  varizes_vasinhos: boolean;
  areas_queixa?: string;
  grau_celulite: 'leve' | 'moderada' | 'severa';
  grau_flacidez: 'leve' | 'moderada' | 'severa';
  observacoes_adicionais?: string;
}

export interface MedidasCorporais {
  altura: number;
  peso: number;
  imc: number;
  circunferencias: {
    abdomen: number;
    cintura: number;
    quadril: number;
    coxa_direita: number;
    coxa_esquerda: number;
    braco_direito: number;
    braco_esquerdo: number;
  };
}

export interface AvaliacaoCapilar {
  queixa_principal: {
    quando_comecou: string;
    queda_continua_fases: 'continua' | 'fases';
    falhas_ou_afinamento: 'falhas' | 'afinamento' | 'ambos';
    fios_caem_por_dia: number;
    quebra_ou_raiz: 'quebra' | 'raiz';
    historico_familiar: boolean;
  };
  historia_doenca_atual: {
    inicio_subito_progressivo: 'subito' | 'progressivo';
    dor_ardencia_coceira: boolean;
    secrecoes_descamacao: boolean;
    cabelo_cresce_novamente: boolean;
    miniaturizacao: boolean;
    observacoes?: string;
  };
}

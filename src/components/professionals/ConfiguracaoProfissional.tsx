
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Save, User, FileText, IdCard, Phone, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ConfiguracaoProfissional = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Definindo interface para o tipo Clinic
  interface Clinic {
    clinic_id: string;
    clinic_name: string;
    logo_url?: string;
    banner_url?: string;
    professional_id?: string;
    // Propriedades específicas conhecidas
    [key: string]: string | number | boolean | null | undefined; // Para propriedades adicionais tipadas
  }

  const [clinic, setClinic] = useState<Clinic | null>(null);

  // Definindo interface para o tipo Professional
  interface Professional {
    id: string;
    user_id: string;
    clinic_id: string;
    specialty?: string | null;
    council_number?: string | null;
    is_active: boolean;
    created_at: string;
    profile_photo_url?: string;
    birth_date?: string | null;
    equipment_list?: string[];
    preferences?: Record<string, unknown>;
    cpf?: string;
    formation?: string;
    phone?: string;
    // Para outras propriedades que possam existir
    [key: string]: string | number | boolean | null | undefined | string[] | Record<string, unknown>;
  }

  const [professional, setProfessional] = useState<Professional | null>(null);

  const [formData, setFormData] = useState({
    specialty: '',
    birth_date: '',
    equipment_list: [] as string[],
    preferences: {},
    cpf: '',
    formation: '',
    council_number: '',
    phone: ''
  });

  const [errors, setErrors] = useState({
    cpf: '',
    phone: '',
    formation: '',
    specialty: ''
  });

  // Definindo fetchProfessionalData antes de usar no useEffect
  const fetchProfessionalData = useCallback(async () => {
    if (!user) return;

    try {
      // Buscar dados da clínica e do profissional
      const { data: clinicData, error: rpcError } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: user.id });

      if (rpcError) throw rpcError;

      if (clinicData && clinicData.length > 0) {
        const clinicInfo = clinicData[0];
        setClinic(clinicInfo);

        if (clinicInfo.professional_id) {
          const { data: professionalData, error } = await supabase
            .from('professionals')
            .select('*')
            .eq('id', clinicInfo.professional_id)
            .single();

          if (error) throw error;

          if (professionalData) {
            setProfessional(professionalData);
            setFormData({
              specialty: professionalData.specialty || '',
              birth_date: professionalData.birth_date || '',
              equipment_list: professionalData.equipment_list || [],
              preferences: professionalData.preferences || {},
              cpf: professionalData.cpf || '',
              formation: professionalData.formation || '',
              council_number: professionalData.council_number || '',
              phone: professionalData.phone || ''
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do profissional:', error);
      toast({
        title: "Erro ao buscar dados",
        description: "Não foi possível carregar os dados do profissional",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  // Usando fetchProfessionalData no useEffect depois de defini-la
  useEffect(() => {
    if (user) {
      fetchProfessionalData();
    }
  }, [user, fetchProfessionalData]);

  const validateForm = () => {
    const newErrors = {
      cpf: '',
      phone: '',
      formation: '',
      specialty: ''
    };
    
    let isValid = true;
    
    // Validar CPF (formato básico)
    if (!formData.cpf) {
      newErrors.cpf = 'CPF é obrigatório';
      isValid = false;
    } else if (!/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(formData.cpf.replace(/[^0-9]/g, ''))) {
      newErrors.cpf = 'Formato de CPF inválido';
      isValid = false;
    }
    
    // Validar telefone (formato básico)
    if (!formData.phone) {
      newErrors.phone = 'Telefone é obrigatório';
      isValid = false;
    }
    
    // Validar formação
    if (!formData.formation) {
      newErrors.formation = 'Formação é obrigatória';
      isValid = false;
    }
    
    // Validar especialidade
    if (!formData.specialty) {
      newErrors.specialty = 'Especialidade é obrigatória';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!clinic?.clinic_id || !user) return;
    
    if (!validateForm()) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos obrigatórios corretamente.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (professional) {
        // Atualizar profissional existente
        const { error } = await supabase
          .from('professionals')
          .update({
            specialty: formData.specialty,
            birth_date: formData.birth_date,
            equipment_list: formData.equipment_list,
            preferences: formData.preferences,
            cpf: formData.cpf,
            formation: formData.formation,
            council_number: formData.council_number,
            phone: formData.phone
          })
          .eq('id', professional.id);

        if (error) throw error;
        
        // Atualizar também o perfil se necessário
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            cpf: formData.cpf,
            phone: formData.phone
          })
          .eq('id', user.id);

        if (profileError) throw profileError;
        toast({ title: "Dados atualizados!", description: "Seus dados foram salvos com sucesso." });
      } else {
        // Criar novo perfil profissional
        const { error } = await supabase
          .from('professionals')
          .insert({
            user_id: user.id,
            clinic_id: clinic.clinic_id,
            specialty: formData.specialty,
            birth_date: formData.birth_date,
            equipment_list: formData.equipment_list,
            preferences: formData.preferences,
            cpf: formData.cpf,
            formation: formData.formation,
            council_number: formData.council_number,
            phone: formData.phone
          });

        if (error) throw error;
      }

      toast({
        title: "Configurações salvas!",
        description: "Suas configurações profissionais foram atualizadas com sucesso.",
        variant: "default"
      });

      // Recarregar dados
      await fetchProfessionalData();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {clinic?.banner_url && (
        <div className="w-full h-48 bg-gray-200">
          <img src={clinic.banner_url && clinic.banner_url.startsWith('http') ? clinic.banner_url : `https://rpfrmclsraiidjlfeonj.supabase.co/storage/v1/object/public/clinic-assets/${clinic.banner_url}`} alt="Banner da Clínica" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between">
            <div className="flex items-end space-x-4">
              {clinic?.logo_url && (
                <img 
                  src={clinic.logo_url && clinic.logo_url.startsWith('http') ? clinic.logo_url : `https://rpfrmclsraiidjlfeonj.supabase.co/storage/v1/object/public/clinic-assets/${clinic.logo_url}`}
                  alt="Logo da Clínica" 
                  className="h-24 w-24 rounded-full object-cover border-4 border-white dark:border-gray-800 -mt-12" 
                />
              )}
              <div className="pb-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {clinic ? clinic.clinic_name : 'Carregando Clínica...'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  Configuração do Perfil Profissional
                </p>
              </div>
            </div>
            <Button onClick={() => navigate(-1)} variant="outline" className="mt-4 md:mt-0 self-start md:self-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Clínica Vinculada */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Home className="h-5 w-5" />
                <span>Clínica Vinculada</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clinic ? (
                <div className="flex items-center space-x-4">
                  {clinic.logo_url && (
                    <img src={clinic.logo_url && clinic.logo_url.startsWith('http') ? clinic.logo_url : `https://rpfrmclsraiidjlfeonj.supabase.co/storage/v1/object/public/clinic-assets/${clinic.logo_url}`} alt={`Logo da ${clinic.clinic_name}`} className="h-16 w-16 rounded-full object-cover" />
                  )}
                  <div>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{clinic.clinic_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Você está vinculado a esta clínica.</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Carregando dados da clínica...</p>
              )}
            </CardContent>
          </Card>

          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Dados Pessoais</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload/alteração de foto de perfil */}
              <div className="flex items-center space-x-4 mb-4">
                {professional?.profile_photo_url && (
                  <img
                    src={professional.profile_photo_url}
                    alt="Foto de Perfil"
                    className="h-20 w-20 rounded-full object-cover border-2 border-gray-300"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  id="profile_photo"
                  onChange={async (e) => {
                    if (!e.target.files || !e.target.files[0]) return;
                    const file = e.target.files[0];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${professional?.id || user?.id}_profile.${fileExt}`;
                    const { error: uploadError } = await supabase.storage
                      .from('clinic-assets')
                      .upload(`professionals/${fileName}`, file, { upsert: true });
                    if (uploadError) {
                      toast({ title: "Erro ao fazer upload", description: uploadError.message, variant: "destructive" });
                      return;
                    }
                    const photoUrl = `https://rpfrmclsraiidjlfeonj.supabase.co/storage/v1/object/public/clinic-assets/professionals/${fileName}`;
                    const { error: updateError } = await supabase
                      .from('professionals')
                      .update({ profile_photo_url: photoUrl })
                      .eq('id', professional?.id);
                    if (updateError) {
                      toast({ title: "Erro ao salvar foto", description: updateError.message, variant: "destructive" });
                    } else {
                      toast({ title: "Foto atualizada!", description: "Sua foto de perfil foi alterada." });
                      setProfessional((prev) => prev ? { ...prev, profile_photo_url: photoUrl } : null);
                    }
                  }}
                />
              </div>
              {/* Alteração de senha */}
              <div className="mb-4">
                <Label htmlFor="new_password">Alterar Senha</Label>
                <Input
                  id="new_password"
                  type="password"
                  placeholder="Nova senha"
                  onBlur={async (e) => {
                    const newPassword = e.target.value;
                    if (newPassword && newPassword.length >= 6) {
                      const { error } = await supabase.auth.updateUser({ password: newPassword });
                      if (error) {
                        toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
                      } else {
                        toast({ title: "Senha alterada!", description: "Sua senha foi atualizada." });
                      }
                    }
                  }}
                />
                <p className="text-xs text-gray-400 mt-1">A senha deve ter pelo menos 6 caracteres.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <div className="flex items-center space-x-2">
                    <IdCard className="h-4 w-4 text-gray-400" />
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      placeholder="000.000.000-00"
                      className={errors.cpf ? 'border-red-500' : ''}
                    />
                    {errors.cpf && <p className="text-xs text-red-500 mt-1">{errors.cpf}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => handleInputChange('birth_date', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(00) 00000-0000"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados Profissionais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Dados Profissionais</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="formation">Formação</Label>
                  <Input
                    id="formation"
                    value={formData.formation}
                    onChange={(e) => handleInputChange('formation', e.target.value)}
                    placeholder="Ex: Fisioterapia, Biomedicina"
                    className={errors.formation ? 'border-red-500' : ''}
                  />
                  {errors.formation && <p className="text-xs text-red-500 mt-1">{errors.formation}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="council_number">Número do Conselho</Label>
                  <Input
                    id="council_number"
                    value={formData.council_number}
                    onChange={(e) => handleInputChange('council_number', e.target.value)}
                    placeholder="Ex: CREFITO 123456"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidade</Label>
                  <Input
                    id="specialty"
                    value={formData.specialty}
                    onChange={(e) => handleInputChange('specialty', e.target.value)}
                    placeholder="Ex: Dermatologista, Esteticista"
                    className={errors.specialty ? 'border-red-500' : ''}
                  />
                  {errors.specialty && <p className="text-xs text-red-500 mt-1">{errors.specialty}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment_list">Lista de Equipamentos (separados por vírgula)</Label>
                <Textarea
                  id="equipment_list"
                  value={formData.equipment_list.join(', ')}
                  onChange={(e) => handleInputChange('equipment_list', e.target.value.split(',').map(item => item.trim()).filter(Boolean))}
                  placeholder="Ex: Radiofrequência, Microagulhamento, Laser"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracaoProfissional;


import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/authContext';
import { PatientFormData, Patient } from '@/types/patient';
import { ArrowLeft, Save, User } from 'lucide-react';

interface PatientFormProps {
  patient?: Patient;
  onSuccess: () => void;
  onCancel: () => void;
}

const PatientForm = ({ patient, onSuccess, onCancel }: PatientFormProps) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<PatientFormData>({
    full_name: patient?.full_name || '',
    birth_date: patient?.birth_date || '',
    age: patient?.age || undefined,
    profession: patient?.profession || '',
    phone: patient?.phone || '',
    whatsapp: patient?.whatsapp || '',
    email: patient?.email || ''
  });

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleBirthDateChange = (date: string) => {
    setFormData(prev => ({
      ...prev,
      birth_date: date,
      age: date ? calculateAge(date) : undefined
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Usar a função do banco para buscar dados da clínica/profissional
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_clinic_data', { user_uuid: user.id });

      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError);
        throw new Error('Erro ao buscar dados da clínica/profissional');
      }

      if (!userData || userData.length === 0) {
        throw new Error('Nenhuma clínica associada encontrada');
      }

      const userDataRecord = userData[0];
      const clinic_id = userDataRecord.clinic_id;
      const professional_id = userDataRecord.professional_id;

      if (!clinic_id) {
        throw new Error('Nenhuma clínica associada encontrada');
      }

      const patientData = {
        ...formData,
        clinic_id,
        professional_id,
        created_by: user.id
      };

      let result;
      if (patient) {
        // Atualizar paciente existente
        result = await supabase
          .from('patients')
          .update(patientData)
          .eq('id', patient.id)
          .select()
          .single();
      } else {
        // Criar novo paciente
        result = await supabase
          .from('patients')
          .insert(patientData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: patient ? "Paciente atualizado!" : "Paciente cadastrado!",
        description: patient ? "Os dados foram atualizados com sucesso" : "Novo paciente foi adicionado à sua lista"
      });

      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar paciente:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os dados do paciente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>
              {patient ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
                placeholder="Nome completo do paciente"
              />
            </div>

            <div>
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleBirthDateChange(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="age">Idade</Label>
              <Input
                id="age"
                type="number"
                value={formData.age || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value ? parseInt(e.target.value) : undefined }))}
                placeholder="Idade do paciente"
                min="0"
                max="120"
              />
            </div>

            <div>
              <Label htmlFor="profession">Profissão</Label>
              <Input
                id="profession"
                type="text"
                value={formData.profession}
                onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                placeholder="Profissão do paciente"
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(00) 0000-0000"
              />
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {patient ? 'Atualizar' : 'Cadastrar'} Paciente
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PatientForm;

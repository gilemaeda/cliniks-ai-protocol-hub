import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, Save, Loader2, Building, ShieldCheck } from 'lucide-react';
import { useClinic } from '@/hooks/useClinic';
import { Badge } from '@/components/ui/badge';

interface ProfileData {
  full_name?: string;
  cpf?: string;
  phone?: string;
}

const ConfiguracaoPerfil = () => {
  const { user, profile, authLoading } = useAuth();
  const { toast } = useToast();
  const { clinic, planStatus, trialDaysRemaining } = useClinic();
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, cpf, phone')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        if (data) setProfileData(data);

      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do seu perfil.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, toast]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Seu perfil foi atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as alterações. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{profile?.role === 'clinic_owner' ? 'Perfil do Proprietário' : 'Meu Perfil'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>{profile?.role === 'clinic_owner' ? 'Perfil do Proprietário' : 'Meu Perfil'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile?.role === 'professional' && clinic && (
          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-zinc-800 space-y-2 mb-6">
            <h3 className="font-semibold text-lg flex items-center"><Building className="mr-2 h-5 w-5 text-gray-600 dark:text-gray-400" />Clínica Vinculada</h3>
            <p><span className="font-medium text-gray-600 dark:text-gray-400">Nome:</span> {clinic.name}</p>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-600 dark:text-gray-400">Status do Plano:</span>
              <Badge variant={planStatus === 'Ativo' ? 'success' : planStatus === 'Em Teste' ? 'warning' : 'destructive'}>
                <ShieldCheck className="h-3 w-3 mr-1" />
                {planStatus}
              </Badge>
            </div>
            {planStatus === 'Em Teste' && (
              <p className="text-sm">
                <span className="font-medium text-gray-600 dark:text-gray-400">Dias restantes:</span> {trialDaysRemaining}
              </p>
            )}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="full_name">Nome Completo</Label>
          <Input
            id="full_name"
            value={profileData.full_name || ''}
            onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
            placeholder="Seu nome completo"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            value={profileData.cpf || ''}
            onChange={(e) => setProfileData({ ...profileData, cpf: e.target.value })}
            placeholder="000.000.000-00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={profileData.phone || ''}
            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
            placeholder="(00) 90000-0000"
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? 'Salvando...' : 'Salvar Perfil'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfiguracaoPerfil;

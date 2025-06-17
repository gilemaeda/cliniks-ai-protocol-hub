import { useState, useEffect, useRef } from 'react';
import { processImage } from '@/lib/imageProcessor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useClinic } from '@/contexts/ClinicContext';
import { Upload, Building, Palette, Bell, Save, Loader2 } from 'lucide-react';

const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('Falha ao ler o arquivo de imagem.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const ConfiguracaoClinica = () => {
  const { user } = useAuth();
  const { clinic: clinicData, loading: clinicLoading, refetchClinic } = useClinic();
  const { toast } = useToast();
  const [localLoading, setLocalLoading] = useState(false);
  const [isUploading, setIsUploading] = useState<'logo' | 'banner' | null>(null);
  const [clinic, setClinic] = useState(clinicData);

  useEffect(() => {
    setClinic(clinicData);
  }, [clinicData]);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File, type: 'logo' | 'banner') => {
    // Definições de tamanho e qualidade
    const imageConfig = {
      logo: { maxWidthOrHeight: 256, maxSizeMB: 1, minWidth: 128, minHeight: 128 },
      banner: { maxWidthOrHeight: 1280, maxSizeMB: 2, minWidth: 800, minHeight: 400 },
    };

    const config = imageConfig[type];

    try {
      const { width, height } = await getImageDimensions(file);
      if (width < config.minWidth || height < config.minHeight) {
        toast({
          title: 'Qualidade da Imagem',
          description: `A imagem selecionada é pequena (${width}x${height}). Para garantir a melhor qualidade, recomendamos uma imagem de pelo menos ${config.minWidth}x${config.minHeight} pixels. A imagem pode parecer pixelada.`,
          variant: 'default',
          duration: 8000,
        });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível ler as dimensões da imagem.', variant: 'destructive' });
      return;
    }
    if (!user || !clinic.id) {
      toast({
        title: 'Ação necessária',
        description: 'Salve as configurações básicas da clínica antes de fazer o upload de imagens.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(type);
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}-${Date.now()}.${fileExt}`;
    const filePath = `${clinic.id}/${fileName}`;
    const originalUrl = clinic[`${type}_url` as 'logo_url' | 'banner_url'];

    try {
      const processedFile = await processImage(file, {
        maxWidthOrHeight: config.maxWidthOrHeight,
        maxSizeMB: config.maxSizeMB,
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('clinic-assets')
        .upload(filePath, processedFile, { upsert: true });

      if (uploadError) throw uploadError;
      if (!uploadData) throw new Error("Falha no upload, nenhum dado retornado.");

      const { error: dbError } = await supabase
        .from('clinics')
        .update({ [`${type}_url`]: uploadData.path })
        .eq('id', clinic.id);

      if (dbError) throw dbError;

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('clinic-assets')
        .createSignedUrl(uploadData.path, 3600);

      if (signedUrlError) throw signedUrlError;
      
      refetchClinic();
      toast({
        title: 'Sucesso!',
        description: `O ${type} da clínica foi atualizado com sucesso.`,
      });

    } catch (error) {
      console.error(`Erro ao fazer upload do ${type}:`, error);
      toast({
        title: 'Erro no Upload',
        description: `Não foi possível atualizar o ${type}. Tente novamente.`,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(null);
    }

  };

  const handleSave = async () => {
    if (!user) return;

    setLocalLoading(true);
    try {
      const clinicPayload = {
        name: clinic.name,
        cnpj: clinic.cnpj,
        plan: clinic.plan,
        employee_count: clinic.employee_count,
        brand_colors: clinic.brand_colors,
        notification_settings: clinic.notification_settings,
      };

      let clinicId = clinic.id;

      if (clinicId) {
        const { error } = await supabase
          .from('clinics')
          .update(clinicPayload)
          .eq('id', clinicId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('clinics')
          .insert([{ ...clinicPayload, owner_id: user.id }])
          .select('id')
          .single();

        if (error) throw error;
        if (data) {
          clinicId = data.id;
          setClinic(prev => ({ ...prev, id: clinicId }));
        }
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações da clínica foram atualizadas com sucesso."
      });

      if (clinicId) {
        refetchClinic();
      }

    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      const errorMessage = error instanceof Error ? error.message : "Não foi possível salvar as configurações.";
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Informações Básicas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Clínica</Label>
              <Input
                id="name"
                value={clinic.name}
                onChange={(e) => setClinic({ ...clinic, name: e.target.value })}
                placeholder="Digite o nome da clínica"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={clinic.cnpj}
                onChange={(e) => setClinic({ ...clinic, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_count">Número de Funcionários</Label>
              <Input
                id="employee_count"
                type="number"
                value={clinic.employee_count}
                onChange={(e) => setClinic({ ...clinic, employee_count: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plano</Label>
              <Select value={clinic.plan} onValueChange={(value) => setClinic({ ...clinic, plan: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="prata">Prata</SelectItem>
                  <SelectItem value="ouro">Ouro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Imagens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Imagens</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['logo', 'banner'].map((type) => (
              <div key={type} className="space-y-2">
                <Label>{type === 'logo' ? 'Logo da Clínica' : 'Banner da Clínica'}</Label>
                <div
                  className={`w-full h-40 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800 transition-colors ${
                    isUploading ? 'cursor-wait bg-gray-100' : 'cursor-pointer hover:border-blue-500'
                  }`}
                  onClick={() => {
                    if (isUploading) return;
                    if (type === 'logo') logoInputRef.current?.click();
                    else bannerInputRef.current?.click();
                  }}
                >
                  {isUploading === type ? (
                    <div className="text-center text-gray-500">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                      <p>Enviando...</p>
                    </div>
                  ) : clinic[`${type}_url` as 'logo_url' | 'banner_url'] ? (
                    <img
                      src={clinic[`${type}_url` as 'logo_url' | 'banner_url']}
                      alt={type}
                      className="max-h-full max-w-full object-contain p-2"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <Upload className="mx-auto h-8 w-8" />
                      <p>Clique para enviar</p>
                    </div>
                  )}
                </div>
                <input
                  ref={type === 'logo' ? logoInputRef : bannerInputRef}
                  type="file"
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageUpload(e.target.files[0], type as 'logo' | 'banner');
                    }
                  }}
                  disabled={isUploading !== null}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Cores da Marca */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Cores da Marca</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Cor Primária</Label>
              <div className="flex space-x-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={clinic.brand_colors?.primary || '#3B82F6'}
                  onChange={(e) => setClinic({
                    ...clinic,
                    brand_colors: { ...clinic.brand_colors, primary: e.target.value }
                  })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={clinic.brand_colors?.primary || '#3B82F6'}
                  onChange={(e) => setClinic({
                    ...clinic,
                    brand_colors: { ...clinic.brand_colors, primary: e.target.value }
                  })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_color">Cor Secundária</Label>
              <div className="flex space-x-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={clinic.brand_colors?.secondary || '#8B5CF6'}
                  onChange={(e) => setClinic({
                    ...clinic,
                    brand_colors: { ...clinic.brand_colors, secondary: e.target.value }
                  })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={clinic.brand_colors?.secondary || '#8B5CF6'}
                  onChange={(e) => setClinic({
                    ...clinic,
                    brand_colors: { ...clinic.brand_colors, secondary: e.target.value }
                  })}
                  placeholder="#8B5CF6"
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Configurações de Notificação</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações por E-mail</Label>
                <p className="text-sm text-gray-500">Receber notificações importantes por e-mail</p>
              </div>
              <Switch
                checked={clinic.notification_settings?.email_notifications || false}
                onCheckedChange={(checked) => setClinic({
                  ...clinic,
                  notification_settings: { ...clinic.notification_settings, email_notifications: checked }
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações por SMS</Label>
                <p className="text-sm text-gray-500">Receber alertas importantes por SMS</p>
              </div>
              <Switch
                checked={clinic.notification_settings?.sms_notifications || false}
                onCheckedChange={(checked) => setClinic({
                  ...clinic,
                  notification_settings: { ...clinic.notification_settings, sms_notifications: checked }
                })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading || isUploading !== null} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
};

export default ConfiguracaoClinica;

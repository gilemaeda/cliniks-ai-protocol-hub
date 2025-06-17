
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image, Link, X, FileImage } from 'lucide-react';

interface ClinicLogoUploadProps {
  logoUrl?: string;
  bannerUrl?: string;
  onLogoChange: (url: string) => void;
  onBannerChange: (url: string) => void;
}

const ClinicLogoUpload = ({ 
  logoUrl, 
  bannerUrl, 
  onLogoChange, 
  onBannerChange 
}: ClinicLogoUploadProps) => {
  const { toast } = useToast();
  const [logoInputUrl, setLogoInputUrl] = useState(logoUrl || '');
  const [bannerInputUrl, setBannerInputUrl] = useState(bannerUrl || '');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('file');
  const [uploading, setUploading] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  const handleLogoUrlSubmit = () => {
    if (logoInputUrl.trim()) {
      onLogoChange(logoInputUrl.trim());
      toast({
        title: "Logo atualizado!",
        description: "O URL do logo foi salvo com sucesso."
      });
    }
  };

  const handleBannerUrlSubmit = () => {
    if (bannerInputUrl.trim()) {
      onBannerChange(bannerInputUrl.trim());
      toast({
        title: "Banner atualizado!",
        description: "O URL do banner foi salvo com sucesso."
      });
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'banner') => {
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione apenas arquivos de imagem (PNG, JPG, JPEG, SVG).",
        variant: "destructive"
      });
      return;
    }

    // Validar tamanho (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Converter arquivo para base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === 'logo') {
          onLogoChange(result);
          setLogoInputUrl(result);
          toast({
            title: "Logo carregado!",
            description: "O logo foi carregado com sucesso."
          });
        } else {
          onBannerChange(result);
          setBannerInputUrl(result);
          toast({
            title: "Banner carregado!",
            description: "O banner foi carregado com sucesso."
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload do arquivo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const clearLogo = () => {
    setLogoInputUrl('');
    onLogoChange('');
    if (logoFileRef.current) {
      logoFileRef.current.value = '';
    }
  };

  const clearBanner = () => {
    setBannerInputUrl('');
    onBannerChange('');
    if (bannerFileRef.current) {
      bannerFileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Image className="h-5 w-5" />
            <span>Imagens da Marca</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-6">
            <Button
              variant={uploadMethod === 'file' ? 'default' : 'outline'}
              onClick={() => setUploadMethod('file')}
              className="flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>Upload de Arquivo</span>
            </Button>
            <Button
              variant={uploadMethod === 'url' ? 'default' : 'outline'}
              onClick={() => setUploadMethod('url')}
              className="flex items-center space-x-2"
            >
              <Link className="h-4 w-4" />
              <span>Por URL</span>
            </Button>
          </div>

          {uploadMethod === 'file' ? (
            <div className="space-y-6">
              {/* Upload de Logo */}
              <div className="space-y-3">
                <Label>Logo da Clínica</Label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                  <div className="text-center">
                    <FileImage className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Arraste e solte seu logo aqui ou clique para selecionar
                    </p>
                    <input
                      ref={logoFileRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'logo');
                      }}
                      className="hidden"
                      id="logo-upload"
                      disabled={uploading}
                    />
                    <div className="flex items-center justify-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => logoFileRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? 'Carregando...' : 'Selecionar Logo'}
                      </Button>
                      {logoUrl && (
                        <Button onClick={clearLogo} variant="outline" size="sm">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG, JPEG ou SVG até 5MB
                    </p>
                  </div>
                  {logoUrl && (
                    <div className="mt-4 flex justify-center">
                      <img 
                        src={logoUrl} 
                        alt="Logo da clínica" 
                        className="h-16 w-auto object-contain border rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Upload de Banner */}
              <div className="space-y-3">
                <Label>Banner da Clínica</Label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                  <div className="text-center">
                    <FileImage className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Arraste e solte seu banner aqui ou clique para selecionar
                    </p>
                    <input
                      ref={bannerFileRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'banner');
                      }}
                      className="hidden"
                      id="banner-upload"
                      disabled={uploading}
                    />
                    <div className="flex items-center justify-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => bannerFileRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? 'Carregando...' : 'Selecionar Banner'}
                      </Button>
                      {bannerUrl && (
                        <Button onClick={clearBanner} variant="outline" size="sm">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG ou JPEG até 5MB (recomendado: 1200x400px)
                    </p>
                  </div>
                  {bannerUrl && (
                    <div className="mt-4 flex justify-center">
                      <img 
                        src={bannerUrl} 
                        alt="Banner da clínica" 
                        className="h-32 w-full max-w-md object-cover border rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Logo por URL */}
              <div className="space-y-3">
                <Label htmlFor="logo-url">URL do Logo</Label>
                <div className="flex space-x-2">
                  <Input
                    id="logo-url"
                    value={logoInputUrl}
                    onChange={(e) => setLogoInputUrl(e.target.value)}
                    placeholder="https://exemplo.com/logo.png"
                    className="flex-1"
                  />
                  <Button onClick={handleLogoUrlSubmit} size="sm">
                    Salvar
                  </Button>
                  {logoUrl && (
                    <Button onClick={clearLogo} variant="outline" size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {logoUrl && (
                  <div className="mt-2">
                    <img 
                      src={logoUrl} 
                      alt="Logo da clínica" 
                      className="h-16 w-auto object-contain border rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Banner por URL */}
              <div className="space-y-3">
                <Label htmlFor="banner-url">URL do Banner</Label>
                <div className="flex space-x-2">
                  <Input
                    id="banner-url"
                    value={bannerInputUrl}
                    onChange={(e) => setBannerInputUrl(e.target.value)}
                    placeholder="https://exemplo.com/banner.png"
                    className="flex-1"
                  />
                  <Button onClick={handleBannerUrlSubmit} size="sm">
                    Salvar
                  </Button>
                  {bannerUrl && (
                    <Button onClick={clearBanner} variant="outline" size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {bannerUrl && (
                  <div className="mt-2">
                    <img 
                      src={bannerUrl} 
                      alt="Banner da clínica" 
                      className="h-32 w-full object-cover border rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClinicLogoUpload;

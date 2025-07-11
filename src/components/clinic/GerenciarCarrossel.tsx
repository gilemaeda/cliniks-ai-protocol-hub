import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/authContext';
import { useToast } from '@/hooks/use-toast';

interface CarouselImage {
  id: string;
  image_url: string;
  sort_order: number;
}

const GerenciarCarrossel = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.clinic_id) {
      loadCarouselImages();
    }
  }, [profile?.clinic_id]);

  const loadCarouselImages = async () => {
    if (!profile?.clinic_id) return;

    try {
      const { data, error } = await supabase
        .from('clinic_carousel_images')
        .select('*')
        .eq('clinic_id', profile.clinic_id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Erro ao carregar imagens:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as imagens do carrossel',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.clinic_id) return;

    setUploading(true);

    try {
      // Upload para o storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.clinic_id}/carousel/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('clinic-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('clinic-assets')
        .getPublicUrl(fileName);

      // Salvar no banco
      const newSortOrder = Math.max(0, ...images.map(img => img.sort_order)) + 1;

      const { error: dbError } = await supabase
        .from('clinic_carousel_images')
        .insert({
          clinic_id: profile.clinic_id,
          image_url: publicUrl,
          sort_order: newSortOrder,
        });

      if (dbError) throw dbError;

      toast({
        title: 'Sucesso',
        description: 'Imagem adicionada ao carrossel',
      });

      loadCarouselImages();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer upload da imagem',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageId: string, imageUrl: string) => {
    try {
      // Deletar do banco
      const { error: dbError } = await supabase
        .from('clinic_carousel_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      // Deletar do storage (extrair caminho da URL)
      const urlParts = imageUrl.split('/');
      const fileName = urlParts.slice(-3).join('/'); // clinic_id/carousel/filename

      await supabase.storage
        .from('clinic-assets')
        .remove([fileName]);

      toast({
        title: 'Sucesso',
        description: 'Imagem removida do carrossel',
      });

      loadCarouselImages();
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a imagem',
        variant: 'destructive',
      });
    }
  };

  const moveImage = async (imageId: string, direction: 'up' | 'down') => {
    const imageIndex = images.findIndex(img => img.id === imageId);
    if (imageIndex === -1) return;

    const newIndex = direction === 'up' ? imageIndex - 1 : imageIndex + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    const updatedImages = [...images];
    [updatedImages[imageIndex], updatedImages[newIndex]] = [updatedImages[newIndex], updatedImages[imageIndex]];

    // Atualizar sort_order no banco
    try {
      const updates = updatedImages.map((img, index) => ({
        id: img.id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('clinic_carousel_images')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      toast({
        title: 'Sucesso',
        description: 'Ordem das imagens atualizada',
      });

      loadCarouselImages();
    } catch (error) {
      console.error('Erro ao reordenar imagens:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível reordenar as imagens',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Carrossel de Imagens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="upload">Adicionar Nova Imagem</Label>
            <div className="mt-2">
              <Input
                id="upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </div>
            {uploading && (
              <p className="text-sm text-muted-foreground mt-1">
                Fazendo upload...
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <Card key={image.id} className="overflow-hidden">
                <div className="relative">
                  <img
                    src={image.image_url}
                    alt={`Imagem ${index + 1} do carrossel`}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => moveImage(image.id, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => moveImage(image.id, 'down')}
                      disabled={index === images.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => deleteImage(image.id, image.image_url)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm text-muted-foreground">
                    Posição: {index + 1}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {images.length === 0 && (
            <div className="text-center py-8">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhuma imagem no carrossel. Adicione uma para começar.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GerenciarCarrossel;
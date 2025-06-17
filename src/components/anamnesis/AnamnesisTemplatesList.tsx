
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AnamnesisTemplate } from '@/types/anamnesis';
import { FileText, Play, User2, Heart, Scissors } from 'lucide-react';

interface AnamnesisTemplatesListProps {
  onStartAnamnesis: (template: AnamnesisTemplate) => void;
}

const AnamnesisTemplatesList = ({ onStartAnamnesis }: AnamnesisTemplatesListProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<AnamnesisTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('anamnesis_templates')
        .select('*')
        .eq('is_active', true)
        .order('anamnesis_type', { ascending: true });

      if (error) throw error;

      // Converter os dados do Supabase para nosso tipo
      const convertedTemplates: AnamnesisTemplate[] = (data || []).map(item => ({
        ...item,
        anamnesis_type: item.anamnesis_type as 'facial' | 'corporal' | 'capilar' | 'geral',
        questions: Array.isArray(item.questions) ? item.questions.map((q: any) => ({
          id: q?.id || '',
          type: q?.type || 'text',
          question: q?.question || '',
          options: q?.options || [],
          required: q?.required || false
        })) : []
      }));

      setTemplates(convertedTemplates);
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
      toast({
        title: "Erro ao carregar templates",
        description: "Não foi possível carregar os templates de anamnese",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'facial':
        return <User2 className="h-5 w-5" />;
      case 'corporal':
        return <Heart className="h-5 w-5" />;
      case 'capilar':
        return <Scissors className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'facial':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'corporal':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'capilar':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatTypeName = (type: string) => {
    switch (type) {
      case 'facial':
        return 'Facial';
      case 'corporal':
        return 'Corporal';
      case 'capilar':
        return 'Capilar';
      default:
        return 'Geral';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Nenhum template encontrado
          </h3>
          <p className="text-gray-500 text-center">
            Entre em contato com o administrador para configurar os templates de anamnese
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Templates de Anamneses
        </h2>
        <Badge variant="outline">
          {templates.length} template{templates.length !== 1 ? 's' : ''} disponível{templates.length !== 1 ? 'is' : ''}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(template.anamnesis_type)}`}>
                    {getTypeIcon(template.anamnesis_type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {formatTypeName(template.anamnesis_type)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {template.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{template.questions.length} pergunta{template.questions.length !== 1 ? 's' : ''}</span>
                <span>Atualizado em {new Date(template.updated_at).toLocaleDateString('pt-BR')}</span>
              </div>

              <Button 
                onClick={() => onStartAnamnesis(template)}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Anamnese
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AnamnesisTemplatesList;

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Search, Edit, Copy, Download, Calendar, Trash2, User } from 'lucide-react';
import { Protocol } from '@/hooks/useProtocolosQuery';
import jsPDF from 'jspdf';

interface HistoricoProtocolosProps {
  protocols: Protocol[];
  isLoading: boolean;
  error: Error | null;
  onEditProtocol: (protocol: Protocol) => void;
  refetchProtocols: () => void;
}

const HistoricoProtocolos = ({ onEditProtocol, protocols, isLoading, error, refetchProtocols }: HistoricoProtocolosProps) => {
  const createSummary = (content: Protocol['content'], length = 100) => {
    const text = typeof content === 'string' ? content : content?.generated_protocol || '';
    if (!text) return 'Sem conteúdo para exibir.';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  };

  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (error) {
      toast({
        title: 'Erro ao carregar protocolos',
        description: `Não foi possível buscar o histórico de protocolos. Detalhe: ${error.message}`,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleDuplicate = async (protocol: Protocol) => {
    try {
      const contentText = typeof protocol.content === 'string'
        ? protocol.content
        : protocol.content?.generated_protocol || '';

      const newProtocolData = {
        name: `${protocol.name} (Cópia)`,
        description: protocol.description,
        content: contentText,
        therapeutic_objective: protocol.therapeutic_objective,
        target_audience: protocol.target_audience,
        duration_weeks: protocol.duration_weeks,
        equipment_used: protocol.equipment_used,
        substances_used: protocol.substances_used,
        clinic_id: protocol.clinic_id,
        created_by: user?.id,
      };

      const { error: insertError } = await supabase
        .from('custom_protocols')
        .insert(newProtocolData);

      if (insertError) throw insertError;

      toast({
        title: "Protocolo duplicado!",
        description: "Uma cópia do protocolo foi criada com sucesso."
      });

      refetchProtocols();
    } catch (e) {
      const err = e as Error;
      console.error('Erro ao duplicar protocolo:', err);
      toast({
        title: "Erro ao duplicar",
        description: `Não foi possível criar uma cópia do protocolo. ${err.message}`,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (protocolId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('custom_protocols')
        .delete()
        .match({ id: protocolId });

      if (deleteError) throw deleteError;

      toast({
        title: "Protocolo excluído!",
        description: "O protocolo foi removido com sucesso.",
      });

      refetchProtocols();
    } catch (e) {
      const err = e as Error;
      console.error('Erro ao excluir protocolo:', err);
      toast({
        title: "Erro ao excluir",
        description: `Não foi possível remover o protocolo. ${err.message}`,
        variant: "destructive"
      });
    }
  };

  const handleExportPDF = (protocol: Protocol) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 30;

    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Protocolo Personalizado', margin, yPosition);
    yPosition += 20;
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(protocol.name, margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');

    if (protocol.description) {
      const descLines = pdf.splitTextToSize(protocol.description, pageWidth - 2 * margin);
      pdf.text(descLines, margin, yPosition);
      yPosition += descLines.length * 6 + 10;
    }

    const contentText = typeof protocol.content === 'string'
      ? protocol.content
      : protocol.content?.generated_protocol || '';

    if (contentText) {
      const contentLines = pdf.splitTextToSize(contentText, pageWidth - 2 * margin);
      
      contentLines.forEach(line => {
        if (yPosition > pdf.internal.pageSize.getHeight() - 30) {
          pdf.addPage();
          yPosition = 30;
        }
        pdf.text(line, margin, yPosition);
        yPosition += 6;
      });
    }

    pdf.save(`${protocol.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'protocolo'}.pdf`);

    toast({
      title: "PDF exportado!",
      description: "O protocolo foi exportado com sucesso"
    });
  };

  const filteredProtocols = protocols.filter(p => {
    const contentText = typeof p.content === 'string' ? p.content : p.content?.generated_protocol || '';
    const searchTermLower = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(searchTermLower) ||
      p.description?.toLowerCase().includes(searchTermLower) ||
      contentText.toLowerCase().includes(searchTermLower) ||
      p.therapeutic_objective?.toLowerCase().includes(searchTermLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Seus Protocolos Personalizados</CardTitle>
          <div className="flex items-center space-x-2 pt-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, descrição ou objetivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredProtocols.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Nenhum protocolo encontrado' : 'Nenhum protocolo criado ainda'}
              </p>
              <p className="text-sm text-gray-400">
                {searchTerm ? 'Tente ajustar sua busca' : 'Crie seu primeiro protocolo na aba "Protocolo Manual"'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProtocols.map((protocol) => (
                <Card key={protocol.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold tracking-tight">{protocol.name}</CardTitle>
                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1 pt-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{new Date(protocol.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>Criado por: <span className="font-medium">{protocol.profiles?.full_name || 'Desconhecido'}</span></span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {createSummary(protocol.content, 120)}
                    </p>
                    {protocol.duration_weeks && (
                      <Badge variant="secondary">{protocol.duration_weeks} semanas</Badge>
                    )}
                  </CardContent>
                  <div className="flex items-center justify-end p-4 space-x-1 border-t border-gray-200 dark:border-gray-700">
                    <Button 
                      title="Editar" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        const protocolForEditor = {
                          ...protocol,
                          content: typeof protocol.content === 'string'
                            ? protocol.content
                            : protocol.content?.generated_protocol || ''
                        };
                        onEditProtocol(protocolForEditor);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button title="Duplicar" variant="ghost" size="icon" onClick={() => handleDuplicate(protocol)}><Copy className="h-4 w-4" /></Button>
                    <Button title="Exportar PDF" variant="ghost" size="icon" onClick={() => handleExportPDF(protocol)}><Download className="h-4 w-4" /></Button>
                    <Button title="Excluir" variant="destructive" size="icon" onClick={() => handleDelete(protocol.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoricoProtocolos;

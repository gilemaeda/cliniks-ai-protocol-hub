import { useState, useEffect, useRef } from 'react';
import type { Content } from 'pdfmake/interfaces';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { supabase } from '@/integrations/supabase/client';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import htmlToPdfmake from 'html-to-pdfmake';
import { Protocol } from '@/hooks/useProtocolosQuery';

(pdfMake as any).addVirtualFileSystem(pdfFonts);

type ProtocolUpsertPayload = {
  name: string;
  content: string;
  description: string;
  therapeutic_objective: string;
  clinic_id: string;
  updated_at: string;
  id?: string;
  created_by?: string;
};

interface ProtocoloEditorProps {
  protocol: Partial<Protocol> | null;
  onSave: (protocol: Protocol) => void;
  onBack: () => void;
}

interface ClinicBranding {
  clinic_id: string;
  name?: string;
  logo_url?: string;
  banner_url?: string;
}

const ProtocoloEditor: React.FC<ProtocoloEditorProps> = ({ protocol, onSave, onBack }) => {
  const [localName, setLocalName] = useState('');
  const [localContent, setLocalContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [clinicBranding, setClinicBranding] = useState<ClinicBranding | null>(null);
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchClinicBranding = async () => {
      if (protocol?.clinic_id) {
        try {
          const { data: brandingData, error: brandingError } = await supabase
            .from('clinics')
            .select('name, logo_url, banner_url')
            .eq('id', protocol.clinic_id)
            .single();

          if (brandingError) throw brandingError;
          
          if (brandingData) {
            setClinicBranding({
              clinic_id: protocol.clinic_id,
              name: brandingData.name,
              logo_url: brandingData.logo_url,
              banner_url: brandingData.banner_url,
            });
          }
        } catch (error) {
          console.error("Erro ao buscar branding da clínica:", error);
        }
      }
    };

    if (protocol) {
      setLocalName(protocol.name || '');
      setLocalContent(protocol.content || '');
      fetchClinicBranding();
    }
  }, [protocol]);

  const getImageAsBase64 = (path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous'; // Tenta resolver problemas de CORS
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } else {
          reject(new Error('Não foi possível obter o contexto do canvas.'));
        }
      };
      img.onerror = (error) => {
        // Tenta buscar a imagem via proxy para contornar CORS, se aplicável
        console.error(`Erro ao carregar imagem de ${path}:`, error);
        reject(new Error(`Não foi possível carregar a imagem de ${path}. Verifique as permissões de CORS.`));
      };
      img.src = path;
    });
  };

  const handleSaveChanges = async () => {
    if (!protocol) return;

    if (!protocol.clinic_id) {
      toast({
        title: "Erro Crítico",
        description: "A ID da clínica não foi encontrada. Não é possível salvar o protocolo.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const upsertPayload: ProtocolUpsertPayload = {
      name: localName,
      content: localContent,
      description: protocol.description || '',
      therapeutic_objective: protocol.therapeutic_objective || '',
      clinic_id: protocol.clinic_id,
      updated_at: new Date().toISOString(),
    };

    if (protocol.id) {
      upsertPayload.id = protocol.id;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        upsertPayload.created_by = user.id;
      } else {
        toast({
          title: "Erro de Autenticação",
          description: "Usuário não autenticado. Não é possível salvar.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
    }

    try {
      const { data, error } = await supabase
        .from('custom_protocols')
        .upsert(upsertPayload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        toast({
          title: "Protocolo Salvo",
          description: "O protocolo foi salvo com sucesso.",
        });
        onSave(data as Protocol);
      }
    } catch (e: unknown) {
      console.error("Erro ao salvar protocolo:", e);

      let description = "Não foi possível salvar o protocolo. Tente novamente.";
      const error = e as { code?: string; message?: string };

      if (error?.code === '23505') {
        description = "Já existe um protocolo com este nome. Por favor, escolha outro nome.";
      } else if (error?.message) {
        description = error.message;
      }
      
      toast({
        title: "Erro ao Salvar",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const buildPdfDocDefinition = async (
    protocolName: string, 
    htmlContent: string, 
    brandingData: ClinicBranding | null
  ) => {
    const headerStack: Content[] = [];

    if (brandingData) {
      try {
        if (brandingData.banner_url) {
          const bannerBase64 = await getImageAsBase64(brandingData.banner_url);
          headerStack.push({ image: bannerBase64, width: 515, alignment: 'center', margin: [0, 0, 0, 10] });
        }

        const logoAndNameStack: Content[] = [];
        if (brandingData.logo_url) {
          const logoBase64 = await getImageAsBase64(brandingData.logo_url);
          logoAndNameStack.push({ image: logoBase64, width: 80, alignment: 'right' });
        }
        if (brandingData.name) {
          logoAndNameStack.push({ text: brandingData.name, style: 'clinicName', alignment: 'right' });
        }

        if (logoAndNameStack.length > 0) {
          headerStack.push({
            columns: [
              { text: '', width: '*' }, // Espaçador para empurrar para a direita
              { stack: logoAndNameStack, width: 'auto' }
            ]
          });
        }
      } catch (error) {
        console.error("Erro ao processar imagens para o PDF:", error);
        toast({ title: 'Erro de Imagem', description: (error as Error).message, variant: 'destructive' });
      }
    }

    const docDefinition = {
      header: headerStack.length > 0 ? { stack: headerStack, margin: [40, 20, 40, 0] } : undefined,
      pageMargins: [40, 150, 40, 60], // Margens: [esquerda, topo, direita, baixo]
      content: [
        { text: protocolName, style: 'header', alignment: 'center', margin: [0, 0, 0, 20] },
        htmlToPdfmake(htmlContent)
      ],
      styles: {
        header: {
          fontSize: 22,
          bold: true,
        },
        clinicName: {
          fontSize: 12,
          bold: true,
          margin: [0, 5, 0, 0]
        }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };

    return docDefinition;
  };

  const handleExportPDF = async () => {
    if (!contentRef.current) return;

    setIsSaving(true);
    try {
      const docDefinition = await buildPdfDocDefinition(localName, contentRef.current.innerHTML, clinicBranding);
      pdfMake.createPdf(docDefinition as any).download(`${localName.replace(/\s+/g, '_').toLowerCase()}_protocolo.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({ title: 'Erro ao Exportar', description: 'Não foi possível gerar o PDF.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!protocol) {
    return <div className="p-4">Nenhum protocolo selecionado.</div>;
  }

  return (
    <div className="p-6 bg-gray-800 text-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-300">Editor de Protocolo</h2>
        <div>
          <Button onClick={onBack} variant="secondary" className="mr-2 bg-gray-600 hover:bg-gray-500">Voltar</Button>
          <Button onClick={() => setIsEditing(!isEditing)} variant="secondary" className="mr-2 bg-gray-600 hover:bg-gray-500">
            {isEditing ? 'Cancelar' : 'Editar'}
          </Button>
          {!isEditing && (
            <Button onClick={handleSaveChanges} disabled={isSaving} className="mr-2 bg-green-600 hover:bg-green-500 text-white">
              {isSaving ? 'Salvando...' : 'Salvar Protocolo'}
            </Button>
          )}
          <Button onClick={handleExportPDF} disabled={isSaving} className="bg-blue-600 hover:bg-blue-500 text-white">
            {isSaving ? 'Exportando...' : 'Exportar para PDF'}
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="protocol-name" className="block text-sm font-medium mb-1 text-blue-200">Nome do Protocolo</label>
            <Input
              id="protocol-name"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              className="bg-gray-700 border-gray-500 text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div>
            <label htmlFor="protocol-content" className="block text-sm font-medium mb-1 text-blue-200">Conteúdo do Protocolo</label>
            <Textarea
              id="protocol-content"
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              rows={20}
              className="bg-gray-700 border-gray-500 text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <Button onClick={handleSaveChanges} disabled={isSaving} className="bg-green-600 hover:bg-green-500 text-white">
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      ) : (
        <div className="bg-gray-700 p-6 rounded-lg border border-gray-600">
          {clinicBranding?.banner_url && (
            <div className="mb-6">
              <img src={clinicBranding.banner_url} alt="Banner da clínica" className="w-full h-auto rounded-md object-cover" />
            </div>
          )}
          
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-2xl font-bold text-blue-300 flex-grow">{localName}</h3>
            {clinicBranding && (
              <div className="text-right flex-shrink-0 ml-4">
                {clinicBranding.logo_url && (
                  <img src={clinicBranding.logo_url} alt="Logo da clínica" className="w-24 h-auto ml-auto mb-2" />
                )}
                {clinicBranding.name && (
                  <p className="text-sm font-semibold text-blue-200">{clinicBranding.name}</p>
                )}
              </div>
            )}
          </div>

          <div ref={contentRef} className="prose prose-lg max-w-none 
            prose-headings:text-blue-300 
            prose-h1:text-2xl prose-h1:font-bold 
            prose-h2:text-xl prose-h2:font-bold 
            prose-h3:text-lg prose-h3:font-bold 
            prose-p:text-gray-100 
            prose-strong:text-white prose-strong:font-bold 
            prose-em:text-blue-200 
            prose-li:text-gray-100
            prose-a:text-blue-400 prose-a:underline
            prose-hr:border-gray-600">
            <ReactMarkdown
              rehypePlugins={[rehypeRaw]}
            >
              {localContent}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtocoloEditor;

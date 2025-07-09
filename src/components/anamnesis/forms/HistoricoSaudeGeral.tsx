
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

interface HistoricoSaudeGeralProps {
  data: any;
  onChange: (data: any) => void;
  obrigatorio?: boolean;
}

const HistoricoSaudeGeral = ({ data, onChange }: HistoricoSaudeGeralProps) => {
  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const booleanFields = [
    { 
      key: 'alergia', 
      label: 'Possui alguma alergia?', 
      hasSpec: true, 
      specKey: 'alergia_especificar',
      specLabel: 'Especificar qual alergia:'
    },
    { 
      key: 'medicamentos_continuos', 
      label: 'Faz uso de medicamentos contínuos?', 
      hasSpec: true, 
      specKey: 'medicamentos_especificar',
      specLabel: 'Especificar quais medicamentos:'
    },
    { 
      key: 'doencas_preexistentes', 
      label: 'Possui doenças pré-existentes?', 
      hasSpec: true, 
      specKey: 'doencas_especificar',
      specLabel: 'Especificar quais doenças:'
    },
    { 
      key: 'procedimentos_esteticos', 
      label: 'Já realizou procedimentos estéticos anteriormente?', 
      hasSpec: true, 
      specKey: 'procedimentos_especificar',
      specLabel: 'Especificar quais procedimentos:'
    },
    { 
      key: 'gestante_amamentando', 
      label: 'Gestante ou amamentando?', 
      hasSpec: false 
    },
    { 
      key: 'doenca_autoimune', 
      label: 'Possui alguma doença autoimune?', 
      hasSpec: false 
    },
    { 
      key: 'queloides_cicatrizacao', 
      label: 'Histórico de queloides ou cicatrização ruim?', 
      hasSpec: false 
    },
    { 
      key: 'cirurgias', 
      label: 'Realizou cirurgias?', 
      hasSpec: true, 
      specKey: 'cirurgias_especificar',
      specLabel: 'Especificar quais cirurgias:'
    },
    { 
      key: 'problema_circulatorio', 
      label: 'Possui problema circulatório?', 
      hasSpec: false 
    },
    { 
      key: 'problema_hormonal', 
      label: 'Possui problema hormonal?', 
      hasSpec: false 
    },
    { 
      key: 'retencao_liquido', 
      label: 'Retenção de líquido?', 
      hasSpec: false 
    },
    { 
      key: 'constipacao_intestinal', 
      label: 'Constipação intestinal?', 
      hasSpec: false 
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          📋 Histórico de Saúde Geral
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Informações sobre condições de saúde e histórico médico do paciente
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {booleanFields.map((field, index) => (
          <div key={field.key}>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <Label htmlFor={field.key} className="text-sm font-medium text-gray-900 dark:text-white">
                {field.label}
              </Label>
              <Switch
                id={field.key}
                checked={data[field.key] || false}
                onCheckedChange={(checked) => updateField(field.key, checked)}
              />
            </div>
            
            {field.hasSpec && data[field.key] && (
              <div className="mt-3 ml-4 space-y-2">
                <Label htmlFor={field.specKey} className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {field.specLabel}
                </Label>
                <Textarea
                  id={field.specKey}
                  value={data[field.specKey] || ''}
                  onChange={(e) => updateField(field.specKey, e.target.value)}
                  placeholder="Descreva detalhadamente..."
                  rows={3}
                  className="w-full resize-none"
                />
              </div>
            )}
            
            {index < booleanFields.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default HistoricoSaudeGeral;

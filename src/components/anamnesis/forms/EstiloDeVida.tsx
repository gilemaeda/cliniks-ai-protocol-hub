
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface EstiloDeVidaProps {
  data: any;
  onChange: (data: any) => void;
  obrigatorio?: boolean;
}

const EstiloDeVida = ({ data, onChange }: EstiloDeVidaProps) => {
  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const booleanFields = [
    { key: 'dorme_bem', label: 'Dorme bem?' },
    { key: 'boa_alimentacao', label: 'Tem boa alimentação?' },
    { 
      key: 'atividade_fisica', 
      label: 'Pratica atividade física?', 
      hasSpec: true, 
      specKey: 'atividade_frequencia',
      specLabel: 'Frequência da atividade física:',
      placeholder: 'Ex: 3x por semana, caminhada'
    },
    { 
      key: 'consome_alcool', 
      label: 'Consome álcool?', 
      hasSpec: true, 
      specKey: 'alcool_frequencia',
      specLabel: 'Frequência do consumo de álcool:',
      placeholder: 'Ex: Fins de semana, socialmente'
    },
    { 
      key: 'fuma', 
      label: 'Fuma?', 
      hasSpec: true, 
      specKey: 'fuma_quantidade',
      specLabel: 'Quantidade de cigarros por dia:',
      placeholder: 'Ex: 10 cigarros/dia'
    },
    { key: 'estresse_ansiedade_depressao', label: 'Histórico de estresse, ansiedade ou depressão?' }
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          🏃‍♀️ Estilo de Vida
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Informações sobre hábitos de vida e rotina do paciente
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Campos Sim/Não */}
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
                <Input
                  id={field.specKey}
                  value={data[field.specKey] || ''}
                  onChange={(e) => updateField(field.specKey, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full"
                />
              </div>
            )}
            
            {index < booleanFields.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}

        <Separator />

        {/* Campos Numéricos */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            💧 Hábitos Alimentares
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="hidratacao_diaria" className="text-sm font-medium">
                Hidratação diária (litros/dia)
              </Label>
              <Input
                id="hidratacao_diaria"
                type="number"
                min="0"
                step="0.5"
                value={data.hidratacao_diaria || ''}
                onChange={(e) => updateField('hidratacao_diaria', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 2.0"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="refeicoes_por_dia" className="text-sm font-medium">
                Quantidade de refeições por dia
              </Label>
              <Input
                id="refeicoes_por_dia"
                type="number"
                min="1"
                max="10"
                value={data.refeicoes_por_dia || ''}
                onChange={(e) => updateField('refeicoes_por_dia', parseInt(e.target.value) || 0)}
                placeholder="Ex: 5"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EstiloDeVida;

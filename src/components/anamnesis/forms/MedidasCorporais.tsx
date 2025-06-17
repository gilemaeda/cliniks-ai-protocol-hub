
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface MedidasCorporaisProps {
  data: any;
  onChange: (data: any) => void;
}

const MedidasCorporais = ({ data, onChange }: MedidasCorporaisProps) => {
  const handleInputChange = (field: string, value: any) => {
    const newData = {
      ...data,
      [field]: value
    };
    
    // Calcular IMC automaticamente quando altura e peso são fornecidos
    if (field === 'altura' || field === 'peso') {
      const altura = field === 'altura' ? parseFloat(value) : parseFloat(newData.altura || '0');
      const peso = field === 'peso' ? parseFloat(value) : parseFloat(newData.peso || '0');
      
      if (altura > 0 && peso > 0) {
        const alturaMetros = altura / 100; // Converter cm para metros
        const imc = peso / (alturaMetros * alturaMetros);
        newData.imc = imc.toFixed(2);
      }
    }
    
    onChange(newData);
  };

  const circunferenciasFields = [
    { key: 'abdomen', label: 'Abdômen' },
    { key: 'cintura', label: 'Cintura' },
    { key: 'quadril', label: 'Quadril' },
    { key: 'coxa_direita', label: 'Coxa direita' },
    { key: 'coxa_esquerda', label: 'Coxa esquerda' },
    { key: 'braco_direito', label: 'Braço direito' },
    { key: 'braco_esquerdo', label: 'Braço esquerdo' }
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          📏 Medidas Corporais
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Registro das medidas antropométricas do paciente
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dados básicos */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            ⚖️ Dados básicos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="altura" className="text-sm font-medium">
                Altura (cm) *
              </Label>
              <Input
                id="altura"
                type="number"
                value={data.altura || ''}
                onChange={(e) => handleInputChange('altura', e.target.value)}
                placeholder="Ex: 170"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="peso" className="text-sm font-medium">
                Peso (kg) *
              </Label>
              <Input
                id="peso"
                type="number"
                step="0.1"
                value={data.peso || ''}
                onChange={(e) => handleInputChange('peso', e.target.value)}
                placeholder="Ex: 65.5"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imc" className="text-sm font-medium">
                IMC (calculado automaticamente)
              </Label>
              <Input
                id="imc"
                value={data.imc || ''}
                readOnly
                className="bg-gray-100 dark:bg-gray-700 font-semibold"
                placeholder="Será calculado"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Circunferências */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            📐 Circunferências (cm)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {circunferenciasFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key} className="text-sm font-medium">
                  {field.label}
                </Label>
                <Input
                  id={field.key}
                  type="number"
                  step="0.1"
                  value={data[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder="cm"
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Informações do IMC */}
        {data.imc && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Classificação do IMC
            </h4>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p>IMC atual: <span className="font-semibold">{data.imc}</span></p>
              <p className="mt-1">
                Classificação: {
                  parseFloat(data.imc) < 18.5 ? 'Abaixo do peso' :
                  parseFloat(data.imc) < 25 ? 'Peso normal' :
                  parseFloat(data.imc) < 30 ? 'Sobrepeso' :
                  'Obesidade'
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MedidasCorporais;

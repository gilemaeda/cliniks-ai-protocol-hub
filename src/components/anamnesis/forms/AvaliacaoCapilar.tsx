
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

interface AvaliacaoCapilarProps {
  data: any;
  onChange: (data: any) => void;
  obrigatorio?: boolean;
}

const AvaliacaoCapilar = ({ data, onChange }: AvaliacaoCapilarProps) => {
  const handleInputChange = (field: string, value: any) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          💇‍♀️ Avaliação Capilar
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Análise detalhada das condições capilares e do couro cabeludo
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Queixa Principal */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🗣️ Queixa Principal
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Quando começou a perceber a queda?
              </Label>
              <Input
                value={data.queda_inicio || ''}
                onChange={(e) => handleInputChange('queda_inicio', e.target.value)}
                placeholder="Ex: Há 6 meses, após o parto..."
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                A queda é contínua ou em fases?
              </Label>
              <RadioGroup
                value={data.tipo_queda || ''}
                onValueChange={(value) => handleInputChange('tipo_queda', value)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <RadioGroupItem value="continua" id="continua" />
                  <Label htmlFor="continua" className="font-medium">Contínua</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <RadioGroupItem value="fases" id="fases" />
                  <Label htmlFor="fases" className="font-medium">Em fases</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Percebe falhas (áreas sem cabelo) ou afinamento generalizado?
              </Label>
              <RadioGroup
                value={data.tipo_perda || ''}
                onValueChange={(value) => handleInputChange('tipo_perda', value)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <RadioGroupItem value="falhas" id="falhas" />
                  <Label htmlFor="falhas" className="font-medium">Falhas (áreas sem cabelo)</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <RadioGroupItem value="afinamento" id="afinamento" />
                  <Label htmlFor="afinamento" className="font-medium">Afinamento generalizado</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Quantos fios caem, em média, por dia?
              </Label>
              <Input
                type="number"
                value={data.fios_por_dia || ''}
                onChange={(e) => handleInputChange('fios_por_dia', e.target.value)}
                placeholder="Número de fios"
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                O cabelo quebra ou cai desde a raiz?
              </Label>
              <RadioGroup
                value={data.tipo_fall || ''}
                onValueChange={(value) => handleInputChange('tipo_fall', value)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <RadioGroupItem value="quebra" id="quebra" />
                  <Label htmlFor="quebra" className="font-medium">Quebra</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <RadioGroupItem value="raiz" id="raiz" />
                  <Label htmlFor="raiz" className="font-medium">Cai desde a raiz</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Alguém na família tem ou teve queda de cabelo, calvície ou afinamento capilar?
              </Label>
              <RadioGroup
                value={data.historico_familiar || ''}
                onValueChange={(value) => handleInputChange('historico_familiar', value)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <RadioGroupItem value="sim" id="hist_sim" />
                  <Label htmlFor="hist_sim" className="font-medium">Sim</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <RadioGroupItem value="nao" id="hist_nao" />
                  <Label htmlFor="hist_nao" className="font-medium">Não</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        <Separator />

        {/* História da Doença Atual */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            📋 História da Doença Atual
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                A queda teve início súbito ou progressivo?
              </Label>
              <RadioGroup
                value={data.inicio_tipo || ''}
                onValueChange={(value) => handleInputChange('inicio_tipo', value)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <RadioGroupItem value="subito" id="subito" />
                  <Label htmlFor="subito" className="font-medium">Súbito</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <RadioGroupItem value="progressivo" id="progressivo" />
                  <Label htmlFor="progressivo" className="font-medium">Progressivo</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Existe dor, ardência, coceira, sensibilidade ou inflamação no couro cabeludo?
              </Label>
              <RadioGroup
                value={data.sintomas_couro || ''}
                onValueChange={(value) => handleInputChange('sintomas_couro', value)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <RadioGroupItem value="sim" id="sint_sim" />
                  <Label htmlFor="sint_sim" className="font-medium">Sim</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <RadioGroupItem value="nao" id="sint_nao" />
                  <Label htmlFor="sint_nao" className="font-medium">Não</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Observa secreções, descamação, caspa, feridas ou crostas?
              </Label>
              <RadioGroup
                value={data.alteracoes_couro || ''}
                onValueChange={(value) => handleInputChange('alteracoes_couro', value)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <RadioGroupItem value="sim" id="alt_sim" />
                  <Label htmlFor="alt_sim" className="font-medium">Sim</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <RadioGroupItem value="nao" id="alt_nao" />
                  <Label htmlFor="alt_nao" className="font-medium">Não</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                O cabelo cresce novamente após cair?
              </Label>
              <RadioGroup
                value={data.regrowth || ''}
                onValueChange={(value) => handleInputChange('regrowth', value)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <RadioGroupItem value="sim" id="reg_sim" />
                  <Label htmlFor="reg_sim" className="font-medium">Sim</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <RadioGroupItem value="nao" id="reg_nao" />
                  <Label htmlFor="reg_nao" className="font-medium">Não</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Nota miniaturização (afinamento dos fios)?
              </Label>
              <RadioGroup
                value={data.miniaturizacao || ''}
                onValueChange={(value) => handleInputChange('miniaturizacao', value)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <RadioGroupItem value="sim" id="mini_sim" />
                  <Label htmlFor="mini_sim" className="font-medium">Sim</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <RadioGroupItem value="nao" id="mini_nao" />
                  <Label htmlFor="mini_nao" className="font-medium">Não</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        <Separator />

        {/* Observações */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🔬 Observações técnicas
          </h3>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Observações (análises com tricoscópio, tração, etc.)
            </Label>
            <Textarea
              value={data.observacoes || ''}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Ex: tricoscopia mostra miniaturização em região frontal, teste de tração positivo em vértex..."
              rows={4}
              className="w-full resize-none"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvaliacaoCapilar;

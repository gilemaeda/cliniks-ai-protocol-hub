
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import ModernRadioGroup from '@/components/ui/modern-radio-group';

interface AvaliacaoCorporalProps {
  data: any;
  onChange: (data: any) => void;
  obrigatorio?: boolean;
}

const AvaliacaoCorporal = ({ data, onChange }: AvaliacaoCorporalProps) => {
  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Áreas que Incomodam */}
      <Card>
        <CardHeader>
          <CardTitle>Áreas do Corpo que Incomodam</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Descreva as áreas do corpo que mais incomodam a paciente..."
            value={data.areasIncomodam || ''}
            onChange={(e) => updateField('areasIncomodam', e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Biotipo */}
      <Card>
        <CardHeader>
          <CardTitle>Biotipo Corporal</CardTitle>
        </CardHeader>
        <CardContent>
          <ModernRadioGroup
            value={data.biotipo || ''}
            onValueChange={(value) => updateField('biotipo', value)}
            options={[
              { value: 'androide', label: 'Androide (Maçã)' },
              { value: 'ginoide', label: 'Ginoide (Pêra)' },
              { value: 'misto', label: 'Misto' }
            ]}
            name="biotipo"
            className="flex-col"
          />
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Androide:</strong> Formato maçã - acúmulo na região central</p>
            <p><strong>Ginoide:</strong> Formato pêra - acúmulo em quadris e coxas</p>
          </div>
        </CardContent>
      </Card>

      {/* 14 Áreas Específicas do Corpo */}
      <Card>
        <CardHeader>
          <CardTitle>14 Áreas Específicas do Corpo para Avaliação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            'Abdômen Superior', 'Abdômen Inferior', 'Flancos', 'Culote', 
            'Glúteos', 'Coxa Anterior', 'Coxa Posterior', 'Coxa Interna',
            'Joelhos', 'Panturrilha', 'Braços', 'Axilas', 'Costas', 'Pescoço'
          ].map((area) => (
            <div key={area} className="space-y-3">
              <Label className="font-semibold text-base">{area}</Label>
              <ModernRadioGroup
                value={data[`area${area.replace(/\s+/g, '')}`] || ''}
                onValueChange={(value) => updateField(`area${area.replace(/\s+/g, '')}`, value)}
                options={[
                  { value: 'normal', label: 'Normal', color: 'green' },
                  { value: 'leve', label: 'Leve', color: 'blue' },
                  { value: 'moderado', label: 'Moderado' },
                  { value: 'severo', label: 'Severo', color: 'red' }
                ]}
                name={`area-${area.toLowerCase().replace(/\s+/g, '-')}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Presença de Alterações */}
      <Card>
        <CardHeader>
          <CardTitle>Presença de Alterações (14 Características Diferentes)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: 'celulite', label: 'Celulite', hasGrade: true },
              { key: 'flacidez', label: 'Flacidez', hasGrade: true },
              { key: 'gorduraLocalizada', label: 'Gordura Localizada' },
              { key: 'estrias', label: 'Estrias' },
              { key: 'retencaoLiquidos', label: 'Retenção de Líquidos' },
              { key: 'fibroses', label: 'Fibroses' },
              { key: 'varizesVasinhos', label: 'Varizes/Vasinhos' },
              { key: 'cicatrizes', label: 'Cicatrizes' },
              { key: 'queloides', label: 'Queloides' },
              { key: 'manchas', label: 'Manchas' },
              { key: 'foliculite', label: 'Foliculite' },
              { key: 'pelosEncravados', label: 'Pelos Encravados' },
              { key: 'ressecamento', label: 'Ressecamento' },
              { key: 'descamacao', label: 'Descamação' }
            ].map((item) => (
              <div key={item.key} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={item.key}
                    checked={data[item.key] || false}
                    onCheckedChange={(checked) => updateField(item.key, checked)}
                  />
                  <Label htmlFor={item.key} className="font-medium">{item.label}</Label>
                </div>
                
                {data[item.key] && item.hasGrade && (
                  <div className="ml-6">
                    <Label className="text-sm mb-2 block">Grau:</Label>
                    <ModernRadioGroup
                      value={data[`grau${item.key.charAt(0).toUpperCase() + item.key.slice(1)}`] || ''}
                      onValueChange={(value) => updateField(`grau${item.key.charAt(0).toUpperCase() + item.key.slice(1)}`, value)}
                      options={[
                        { value: 'leve', label: 'Leve', color: 'green' },
                        { value: 'moderada', label: 'Moderada', color: 'blue' },
                        { value: 'severa', label: 'Severa', color: 'red' }
                      ]}
                      name={`grau-${item.key}`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Áreas com Queixa */}
      <Card>
        <CardHeader>
          <CardTitle>Áreas que Apresentam Queixa</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Descreva especificamente as áreas que apresentam as principais queixas..."
            value={data.areasQueixa || ''}
            onChange={(e) => updateField('areasQueixa', e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Classificação Detalhada de Graus */}
      <Card>
        <CardHeader>
          <CardTitle>Classificação Detalhada de Graus (I a IV)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-3 block font-semibold">Grau da Celulite</Label>
            <RadioGroup 
              value={data.grauCeluliteDetalhado || ''} 
              onValueChange={(value) => updateField('grauCeluliteDetalhado', value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="I" id="celulite-I" />
                <Label htmlFor="celulite-I">Grau I - Visível apenas com compressão</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="II" id="celulite-II" />
                <Label htmlFor="celulite-II">Grau II - Visível em pé</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="III" id="celulite-III" />
                <Label htmlFor="celulite-III">Grau III - Visível deitada</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="IV" id="celulite-IV" />
                <Label htmlFor="celulite-IV">Grau IV - Nódulos palpáveis dolorosos</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-3 block font-semibold">Grau da Flacidez</Label>
            <RadioGroup 
              value={data.grauFlacidezDetalhado || ''} 
              onValueChange={(value) => updateField('grauFlacidezDetalhado', value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="I" id="flacidez-I" />
                <Label htmlFor="flacidez-I">Grau I - Flacidez muscular leve</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="II" id="flacidez-II" />
                <Label htmlFor="flacidez-II">Grau II - Flacidez cutânea moderada</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="III" id="flacidez-III" />
                <Label htmlFor="flacidez-III">Grau III - Flacidez cutâneo-muscular</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="IV" id="flacidez-IV" />
                <Label htmlFor="flacidez-IV">Grau IV - Flacidez severa mista</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Características da Pele Corporal */}
      <Card>
        <CardHeader>
          <CardTitle>Características da Pele Corporal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="mb-3 block">Elasticidade</Label>
              <ModernRadioGroup
                value={data.elasticidadeCorporal || ''}
                onValueChange={(value) => updateField('elasticidadeCorporal', value)}
                options={[
                  { value: 'boa', label: 'Boa', color: 'green' },
                  { value: 'moderada', label: 'Moderada', color: 'blue' },
                  { value: 'ruim', label: 'Ruim', color: 'red' }
                ]}
                name="elasticidade-corporal"
                className="flex-col"
              />
            </div>

            <div>
              <Label className="mb-3 block">Hidratação</Label>
              <ModernRadioGroup
                value={data.hidratacaoCorporal || ''}
                onValueChange={(value) => updateField('hidratacaoCorporal', value)}
                options={[
                  { value: 'boa', label: 'Boa', color: 'green' },
                  { value: 'moderada', label: 'Moderada', color: 'blue' },
                  { value: 'ruim', label: 'Ruim', color: 'red' }
                ]}
                name="hidratacao-corporal"
                className="flex-col"
              />
            </div>

            <div>
              <Label className="mb-3 block">Sensibilidade</Label>
              <ModernRadioGroup
                value={data.sensibilidadeCorporal || ''}
                onValueChange={(value) => updateField('sensibilidadeCorporal', value)}
                options={[
                  { value: 'baixa', label: 'Baixa', color: 'green' },
                  { value: 'media', label: 'Média', color: 'blue' },
                  { value: 'alta', label: 'Alta', color: 'red' }
                ]}
                name="sensibilidade-corporal"
                className="flex-col"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hábitos Posturais e Atividade Física */}
      <Card>
        <CardHeader>
          <CardTitle>Hábitos Posturais e Atividade Física</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-3 block">Postura predominante no trabalho</Label>
            <ModernRadioGroup
              value={data.posturaTrabalho || ''}
              onValueChange={(value) => updateField('posturaTrabalho', value)}
              options={[
                { value: 'sentada', label: 'Sentada' },
                { value: 'em-pe', label: 'Em pé' },
                { value: 'caminhando', label: 'Caminhando' },
                { value: 'variada', label: 'Variada' }
              ]}
              name="postura-trabalho"
            />
          </div>

          <div>
            <Label className="mb-3 block">Frequência de atividade física</Label>
            <ModernRadioGroup
              value={data.frequenciaAtividade || ''}
              onValueChange={(value) => updateField('frequenciaAtividade', value)}
              options={[
                { value: 'sedentaria', label: 'Sedentária', color: 'red' },
                { value: '1-2x-semana', label: '1-2x/semana' },
                { value: '3-4x-semana', label: '3-4x/semana', color: 'blue' },
                { value: '5x-ou-mais', label: '5x+/semana', color: 'green' }
              ]}
              name="frequencia-atividade"
            />
          </div>
        </CardContent>
      </Card>

      {/* Biotipo Corporal Detalhado */}
      <Card>
        <CardHeader>
          <CardTitle>Biotipo Corporal Detalhado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="mb-3 block">Formato corporal específico</Label>
              <ModernRadioGroup
                value={data.formatoCorporal || ''}
                onValueChange={(value) => updateField('formatoCorporal', value)}
                options={[
                  { value: 'ampulheta', label: 'Ampulheta' },
                  { value: 'triangulo', label: 'Triângulo' },
                  { value: 'triangulo-invertido', label: 'Triângulo Invertido' },
                  { value: 'retangulo', label: 'Retângulo' },
                  { value: 'oval', label: 'Oval' }
                ]}
                name="formato-corporal"
                className="flex-col"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Observações Adicionais</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Observações gerais adicionais sobre a avaliação corporal..."
            value={data.observacoes || ''}
            onChange={(e) => updateField('observacoes', e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AvaliacaoCorporal;

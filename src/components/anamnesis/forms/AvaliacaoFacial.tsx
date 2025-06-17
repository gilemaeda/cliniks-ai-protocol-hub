import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import ModernRadioGroup from '@/components/ui/modern-radio-group';

interface AvaliacaoFacialProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const AvaliacaoFacial = ({ data, onChange }: AvaliacaoFacialProps) => {
  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Queixa Principal */}
      <Card>
        <CardHeader>
          <CardTitle>Queixa Principal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="queixa-principal">Descreva a queixa principal específica</Label>
            <Textarea
              id="queixa-principal"
              placeholder="Ex: Linhas de expressão ao redor dos olhos, flacidez facial, manchas..."
              value={data.queixaPrincipal || ''}
              onChange={(e) => updateField('queixaPrincipal', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Análise dos Terços Faciais */}
      <Card>
        <CardHeader>
          <CardTitle>Análise dos Terços Faciais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label className="mb-3 block">Terço Superior</Label>
              <ModernRadioGroup
                value={data.tercoSuperior || ''}
                onValueChange={(value) => updateField('tercoSuperior', value)}
                options={[
                  { value: 'normal', label: 'Normal' },
                  { value: 'aumentado', label: 'Aumentado' },
                  { value: 'diminuido', label: 'Diminuído' }
                ]}
                name="terco-superior"
                className="flex-row gap-2"
              />
            </div>
            <div>
              <Label className="mb-3 block">Terço Médio</Label>
              <ModernRadioGroup
                value={data.tercoMedio || ''}
                onValueChange={(value) => updateField('tercoMedio', value)}
                options={[
                  { value: 'normal', label: 'Normal' },
                  { value: 'aumentado', label: 'Aumentado' },
                  { value: 'diminuido', label: 'Diminuído' }
                ]}
                name="terco-medio"
                className="flex-row gap-2"
              />
            </div>
            <div>
              <Label className="mb-3 block">Terço Inferior</Label>
              <ModernRadioGroup
                value={data.tercoInferior || ''}
                onValueChange={(value) => updateField('tercoInferior', value)}
                options={[
                  { value: 'normal', label: 'Normal' },
                  { value: 'aumentado', label: 'Aumentado' },
                  { value: 'diminuido', label: 'Diminuído' }
                ]}
                name="terco-inferior"
                className="flex-row gap-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proporções Faciais */}
      <Card>
        <CardHeader>
          <CardTitle>Proporções Faciais</CardTitle>
        </CardHeader>
        <CardContent>
          <ModernRadioGroup
            value={data.proporcoesFaciais || ''}
            onValueChange={(value) => updateField('proporcoesFaciais', value)}
            options={[
              { value: 'simetricas', label: 'Simétricas', color: 'green' },
              { value: 'assimetricas', label: 'Assimétricas', color: 'red' }
            ]}
            name="proporcoes-faciais"
          />
        </CardContent>
      </Card>

      {/* Características da Pele */}
      <Card>
        <CardHeader>
          <CardTitle>Características da Pele</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="mb-3 block">Textura</Label>
              <ModernRadioGroup
                value={data.texturaPele || ''}
                onValueChange={(value) => updateField('texturaPele', value)}
                options={[
                  { value: 'lisa', label: 'Lisa' },
                  { value: 'rugosa', label: 'Rugosa' },
                  { value: 'irregular', label: 'Irregular' }
                ]}
                name="textura-pele"
                className="flex-col"
              />
            </div>

            <div>
              <Label className="mb-3 block">Elasticidade</Label>
              <ModernRadioGroup
                value={data.elasticidadePele || ''}
                onValueChange={(value) => updateField('elasticidadePele', value)}
                options={[
                  { value: 'boa', label: 'Boa', color: 'green' },
                  { value: 'moderada', label: 'Moderada', color: 'blue' },
                  { value: 'ruim', label: 'Ruim', color: 'red' }
                ]}
                name="elasticidade-pele"
                className="flex-col"
              />
            </div>

            <div>
              <Label className="mb-3 block">Sensibilidade</Label>
              <ModernRadioGroup
                value={data.sensibilidadePele || ''}
                onValueChange={(value) => updateField('sensibilidadePele', value)}
                options={[
                  { value: 'baixa', label: 'Baixa', color: 'green' },
                  { value: 'media', label: 'Média', color: 'blue' },
                  { value: 'alta', label: 'Alta', color: 'red' }
                ]}
                name="sensibilidade-pele"
                className="flex-col"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="mb-3 block">Hidratação</Label>
              <ModernRadioGroup
                value={data.hidratacaoPele || ''}
                onValueChange={(value) => updateField('hidratacaoPele', value)}
                options={[
                  { value: 'boa', label: 'Boa', color: 'green' },
                  { value: 'moderada', label: 'Moderada', color: 'blue' },
                  { value: 'ruim', label: 'Ruim', color: 'red' }
                ]}
                name="hidratacao-pele"
                className="flex-col"
              />
            </div>

            <div>
              <Label className="mb-3 block">Oleosidade</Label>
              <ModernRadioGroup
                value={data.oleosidadePele || ''}
                onValueChange={(value) => updateField('oleosidadePele', value)}
                options={[
                  { value: 'baixa', label: 'Baixa' },
                  { value: 'moderada', label: 'Moderada' },
                  { value: 'alta', label: 'Alta' }
                ]}
                name="oleosidade-pele"
                className="flex-col"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fototipos de Fitzpatrick */}
      <Card>
        <CardHeader>
          <CardTitle>Fototipos de Fitzpatrick</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup 
            value={data.fototipo || ''} 
            onValueChange={(value) => updateField('fototipo', value)}
            className="space-y-3"
          >
            {[
              { value: 'I', label: 'I - Pele muito clara, sempre queima, nunca bronzeia' },
              { value: 'II', label: 'II - Pele clara, sempre queima, bronzeia pouco' },
              { value: 'III', label: 'III - Pele morena clara, queima moderadamente, bronzeia gradualmente' },
              { value: 'IV', label: 'IV - Pele morena moderada, queima pouco, sempre bronzeia' },
              { value: 'V', label: 'V - Pele morena escura, raramente queima, bronzeia intensamente' },
              { value: 'VI', label: 'VI - Pele negra, nunca queima, totalmente pigmentada' }
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`fototipo-${option.value}`} />
                <Label htmlFor={`fototipo-${option.value}`} className="text-sm leading-relaxed">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Presença de Alterações */}
      <Card>
        <CardHeader>
          <CardTitle>Presença de Alterações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'flacidez', label: 'Flacidez' },
              { key: 'perdaVolume', label: 'Perda de Volume' },
              { key: 'sulcos', label: 'Sulcos' },
              { key: 'linhasEstaticas', label: 'Linhas Estáticas' },
              { key: 'assimetrias', label: 'Assimetrias' },
              { key: 'papada', label: 'Papada' },
              { key: 'linhasExpressao', label: 'Linhas de Expressão' },
              { key: 'manchas', label: 'Manchas' },
              { key: 'poros', label: 'Poros Dilatados' },
              { key: 'acne', label: 'Acne' },
              { key: 'cicatrizes', label: 'Cicatrizes' },
              { key: 'melasma', label: 'Melasma' },
              { key: 'rugas', label: 'Rugas' },
              { key: 'olheiras', label: 'Olheiras' },
              { key: 'bolsas', label: 'Bolsas' },
              { key: 'bigodeChines', label: 'Bigode Chinês' }
            ].map((item) => (
              <div key={item.key} className="flex items-center space-x-2">
                <Checkbox
                  id={item.key}
                  checked={data[item.key] || false}
                  onCheckedChange={(checked) => updateField(item.key, checked)}
                />
                <Label htmlFor={item.key} className="text-sm">
                  {item.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 10 Regiões Faciais Específicas */}
      <Card>
        <CardHeader>
          <CardTitle>10 Regiões Faciais Específicas - Avaliação Detalhada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            'Testa', 'Glabela', 'Região Periorbital', 'Pálpebras', 'Olheiras',
            'Região Malar', 'Sulco Nasogeniano', 'Região Perioral', 'Queixo', 'Pescoço'
          ].map((regiao) => (
            <div key={regiao} className="space-y-3">
              <Label className="font-semibold text-base">{regiao}</Label>
              <ModernRadioGroup
                value={data[`regiao${regiao.replace(/\s+/g, '')}`] || ''}
                onValueChange={(value) => updateField(`regiao${regiao.replace(/\s+/g, '')}`, value)}
                options={[
                  { value: 'normal', label: 'Normal', color: 'green' },
                  { value: 'leve', label: 'Leve', color: 'blue' },
                  { value: 'moderada', label: 'Moderada' },
                  { value: 'severa', label: 'Severa', color: 'red' }
                ]}
                name={`regiao-${regiao.toLowerCase().replace(/\s+/g, '-')}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Hábitos de Proteção Solar */}
      <Card>
        <CardHeader>
          <CardTitle>Hábitos de Proteção Solar e Exposição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-3 block">Usa protetor solar diariamente?</Label>
            <ModernRadioGroup
              value={data.usaProtetor || ''}
              onValueChange={(value) => updateField('usaProtetor', value)}
              options={[
                { value: 'sim', label: 'Sim', color: 'green' },
                { value: 'nao', label: 'Não', color: 'red' },
                { value: 'as-vezes', label: 'Às vezes', color: 'blue' }
              ]}
              name="usa-protetor"
            />
          </div>

          <div>
            <Label className="mb-3 block">FPS utilizado</Label>
            <ModernRadioGroup
              value={data.fpsUtilizado || ''}
              onValueChange={(value) => updateField('fpsUtilizado', value)}
              options={[
                { value: '15-30', label: '15-30' },
                { value: '30-50', label: '30-50' },
                { value: '50+', label: '50+', color: 'green' }
              ]}
              name="fps-utilizado"
            />
          </div>

          <div>
            <Label className="mb-3 block">Exposição solar diária</Label>
            <ModernRadioGroup
              value={data.exposicaoSolar || ''}
              onValueChange={(value) => updateField('exposicaoSolar', value)}
              options={[
                { value: 'minima', label: 'Mínima (<30min)', color: 'green' },
                { value: 'moderada', label: 'Moderada (30min-2h)', color: 'blue' },
                { value: 'intensa', label: 'Intensa (>2h)', color: 'red' }
              ]}
              name="exposicao-solar"
            />
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Tratamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Tratamentos Anteriores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-3 block">Já realizou tratamentos estéticos faciais?</Label>
            <ModernRadioGroup
              value={data.tratamentosAnteriores || ''}
              onValueChange={(value) => updateField('tratamentosAnteriores', value)}
              options={[
                { value: 'sim', label: 'Sim', color: 'green' },
                { value: 'nao', label: 'Não', color: 'red' }
              ]}
              name="tratamentos-anteriores"
            />
          </div>

          {data.tratamentosAnteriores === 'sim' && (
            <div>
              <Label htmlFor="quais-tratamentos">Quais tratamentos?</Label>
              <Textarea
                id="quais-tratamentos"
                placeholder="Descreva os tratamentos realizados anteriormente..."
                value={data.quaisTratamentos || ''}
                onChange={(e) => updateField('quaisTratamentos', e.target.value)}
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Escalas Numéricas Detalhadas */}
      <Card>
        <CardHeader>
          <CardTitle>Escalas Numéricas para Avaliação (1-10)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="mb-3 block">Oleosidade (1-10)</Label>
              <RadioGroup 
                value={data.escalaOleosidade || ''} 
                onValueChange={(value) => updateField('escalaOleosidade', value)}
                className="grid grid-cols-5 gap-2"
              >
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <div key={num} className="flex items-center space-x-1">
                    <RadioGroupItem value={num.toString()} id={`oleosidade-${num}`} />
                    <Label htmlFor={`oleosidade-${num}`} className="text-sm">{num}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="mb-3 block">Hidratação (1-10)</Label>
              <RadioGroup 
                value={data.escalaHidratacao || ''} 
                onValueChange={(value) => updateField('escalaHidratacao', value)}
                className="grid grid-cols-5 gap-2"
              >
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <div key={num} className="flex items-center space-x-1">
                    <RadioGroupItem value={num.toString()} id={`hidratacao-${num}`} />
                    <Label htmlFor={`hidratacao-${num}`} className="text-sm">{num}</Label>
                  </div>
                ))}
              </RadioGroup>
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
            placeholder="Observações gerais adicionais sobre a avaliação facial..."
            value={data.observacoes || ''}
            onChange={(e) => updateField('observacoes', e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AvaliacaoFacial;

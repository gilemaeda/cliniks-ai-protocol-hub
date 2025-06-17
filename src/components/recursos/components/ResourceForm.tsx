
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface ResourceFormProps {
  formData: any;
  onInputChange: (field: string, value: any) => void;
  onAreaChange: (area: string, checked: boolean) => void;
  areasDisponiveis: string[];
  children: React.ReactNode;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  editingItem: boolean;
}

const ResourceForm = ({
  formData,
  onInputChange,
  onAreaChange,
  areasDisponiveis,
  children,
  onSubmit,
  onCancel,
  loading,
  editingItem
}: ResourceFormProps) => {
  return (
    <div className="space-y-4">
      {children}

      <div className="space-y-3">
        <Label>Áreas de Uso</Label>
        <div className="flex gap-4">
          {areasDisponiveis.map((area) => (
            <div key={area} className="flex items-center space-x-2">
              <Checkbox
                id={area}
                checked={formData.usage_areas.includes(area)}
                onCheckedChange={(checked) => onAreaChange(area, checked as boolean)}
              />
              <Label htmlFor={area}>{area}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="usage_type">Tipo de Uso</Label>
          <Select value={formData.usage_type} onValueChange={(value) => onInputChange('usage_type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="internal">Uso interno (em cabine)</SelectItem>
              <SelectItem value="prescription">Disponível para prescrição</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="availability">Disponibilidade</Label>
          <Select value={formData.availability} onValueChange={(value) => onInputChange('availability', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_stock">Em estoque</SelectItem>
              <SelectItem value="out_of_stock">Em falta</SelectItem>
              <SelectItem value="testing">Em teste</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observations">Observações</Label>
        <Textarea
          id="observations"
          value={formData.observations}
          onChange={(e) => onInputChange('observations', e.target.value)}
          placeholder="Observações gerais sobre o produto"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onSubmit} disabled={loading}>
          {loading ? 'Salvando...' : editingItem ? 'Atualizar' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
};

export default ResourceForm;

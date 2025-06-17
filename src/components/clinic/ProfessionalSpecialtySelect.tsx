
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface ProfessionalSpecialtySelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

const ProfessionalSpecialtySelect = ({ value, onValueChange }: ProfessionalSpecialtySelectProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [customSpecialties, setCustomSpecialties] = useState<string[]>([]);

  const defaultSpecialties = [
    'Dermatologista',
    'Esteticista',
    'Fisioterapeuta Dermato-Funcional',
    'Biomédico',
    'Enfermeiro',
    'Cirurgião Plástico',
    'Médico Estético',
    'Tricólogo',
    'Cosmetólogo'
  ];

  const allSpecialties = [...defaultSpecialties, ...customSpecialties];

  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !allSpecialties.includes(newSpecialty.trim())) {
      const specialty = newSpecialty.trim();
      setCustomSpecialties(prev => [...prev, specialty]);
      onValueChange(specialty);
      setNewSpecialty('');
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Formação/Especialidade</Label>
      <div className="flex space-x-2">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecione uma especialidade" />
          </SelectTrigger>
          <SelectContent>
            {allSpecialties.map((specialty) => (
              <SelectItem key={specialty} value={specialty}>
                {specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Especialidade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-specialty">Nome da Especialidade</Label>
                <Input
                  id="new-specialty"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  placeholder="Digite a nova especialidade"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddSpecialty();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddSpecialty} disabled={!newSpecialty.trim()}>
                  Adicionar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProfessionalSpecialtySelect;

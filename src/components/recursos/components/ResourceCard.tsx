
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface ResourceCardProps {
  resource: any;
  onEdit: (resource: any) => void;
  onDelete: (id: string) => void;
  resourceType: string;
}

const ResourceCard = ({ resource, onEdit, onDelete, resourceType }: ResourceCardProps) => {
  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      case 'testing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityLabel = (availability: string) => {
    switch (availability) {
      case 'in_stock':
        return 'Em estoque';
      case 'out_of_stock':
        return 'Em falta';
      case 'testing':
        return 'Em teste';
      default:
        return availability;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{resource.name}</CardTitle>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(resource)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(resource.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {resource.category && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>
              {resourceType === 'equipment' ? 'Finalidade:' : 
               resourceType === 'cosmetic' ? 'Categoria:' : 'Tipo:'}
            </strong> {resource.category}
          </p>
        )}
        
        {resource.brand_model && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Marca/Modelo:</strong> {resource.brand_model}
          </p>
        )}
        
        {resource.main_actives && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Ativos:</strong> {resource.main_actives}
          </p>
        )}
        
        {resource.usage_areas && resource.usage_areas.length > 0 && (
          <p className="text-sm">
            <strong>Áreas:</strong> {resource.usage_areas.join(', ')}
          </p>
        )}
        
        <div className="flex justify-between items-center pt-2">
          <span className={`text-xs px-2 py-1 rounded-full ${getAvailabilityColor(resource.availability)}`}>
            {getAvailabilityLabel(resource.availability)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourceCard;

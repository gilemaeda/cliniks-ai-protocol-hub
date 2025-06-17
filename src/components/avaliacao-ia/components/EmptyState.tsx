
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface EmptyStateProps {
  hasSearchTerm: boolean;
}

const EmptyState = ({ hasSearchTerm }: EmptyStateProps) => {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {hasSearchTerm ? 'Nenhuma avaliação encontrada' : 'Nenhuma avaliação realizada'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {hasSearchTerm 
            ? 'Tente ajustar os termos de pesquisa.' 
            : 'Quando avaliações forem realizadas, elas aparecerão aqui.'
          }
        </p>
      </CardContent>
    </Card>
  );
};

export default EmptyState;

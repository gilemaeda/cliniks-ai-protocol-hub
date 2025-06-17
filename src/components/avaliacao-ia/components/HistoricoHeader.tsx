
import { FileText } from 'lucide-react';

interface HistoricoHeaderProps {
  totalAssessments: number;
}

const HistoricoHeader = ({ totalAssessments }: HistoricoHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <FileText className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Histórico de Avaliações</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {totalAssessments} {totalAssessments === 1 ? 'avaliação encontrada' : 'avaliações encontradas'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HistoricoHeader;

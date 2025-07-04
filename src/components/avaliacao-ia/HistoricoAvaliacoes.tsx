import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvaluationsQuery } from '@/hooks/useEvaluationsQuery';
import { useAuth } from '@/hooks/auth/authContext';
import { supabase } from '@/integrations/supabase/client';
import HistoricoHeader from './components/HistoricoHeader';
import SearchBar from './components/SearchBar';
import AssessmentsList from './components/AssessmentsList';
import LoadingState from './components/LoadingState';
import { Assessment } from './types/assessment';
import AssessmentDetailsDialog from './components/AssessmentDetailsDialog';
import DeleteConfirmationDialog from './components/DeleteConfirmationDialog';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const HistoricoAvaliacoes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const { data: assessments = [], isLoading, error, refetch } = useEvaluationsQuery(user?.id);

  const handleViewAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
  };

  const handleCloneAssessment = (assessment: Assessment) => {
    // Salvar os dados da avaliação a ser clonada no sessionStorage
    sessionStorage.setItem('cloneAssessment', JSON.stringify({
      patient_name: assessment.patient_name,
      patient_age: assessment.patient_age,
      assessment_type: assessment.assessment_type,
      main_complaint: assessment.main_complaint,
      treatment_objective: assessment.treatment_objective,
      observations: assessment.observations,
      is_manual_patient: assessment.is_manual_patient,
      resource_usage_mode: assessment.resource_usage_mode,
      selected_resource_ids: assessment.selected_resource_ids,
      manual_resources_text: assessment.manual_resources_text
    }));

    // Navegar para o formulário de avaliação com o tipo correspondente
    navigate(`/avaliacao-ia/${assessment.assessment_type}?clone=true`);
  };

  const handleEditAssessment = (assessment: Assessment) => {
    // Salvar os dados da avaliação a ser editada no sessionStorage
    sessionStorage.setItem('editAssessment', JSON.stringify({
      id: assessment.id,
      patient_name: assessment.patient_name,
      patient_age: assessment.patient_age,
      assessment_type: assessment.assessment_type,
      main_complaint: assessment.main_complaint,
      treatment_objective: assessment.treatment_objective,
      observations: assessment.observations,
      is_manual_patient: assessment.is_manual_patient,
      resource_usage_mode: assessment.resource_usage_mode,
      selected_resource_ids: assessment.selected_resource_ids,
      manual_resources_text: assessment.manual_resources_text
    }));

    // Navegar para o formulário de avaliação com o tipo correspondente
    navigate(`/avaliacao-ia/${assessment.assessment_type}?edit=true&id=${assessment.id}`);
  };

  const handleDeleteClick = (assessment: Assessment) => {
    setAssessmentToDelete(assessment);
  };

  const handleDeleteConfirm = async () => {
    if (!assessmentToDelete) return;

    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', assessmentToDelete.id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Atualizar a lista de avaliações
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['assessments', user.id] });
        refetch();
      }
      
      toast({
        title: "Avaliação excluída",
        description: "A avaliação foi excluída com sucesso.",
      });

    } catch (error) {
      console.error('Erro ao excluir avaliação:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir a avaliação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setAssessmentToDelete(null);
    }
  };

  const handleRefresh = () => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['assessments', user.id] });
      refetch();
    }
  };

  // Atualizar dados quando o componente for montado
  useEffect(() => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['assessments', user.id] });
      refetch();
    }
  }, [user?.id, queryClient, refetch]);

  if (isLoading) return <LoadingState />;

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar avaliações</AlertTitle>
          <AlertDescription>
            {error.message || 'Ocorreu um erro ao carregar suas avaliações. Por favor, tente novamente.'}
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <Button onClick={handleRefresh} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <HistoricoHeader totalAssessments={0} />
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
        <div className="text-center py-12 border border-dashed rounded-lg bg-gray-50 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Nenhuma avaliação encontrada. Crie uma nova avaliação para vê-la aqui.
          </p>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <HistoricoHeader totalAssessments={assessments.length} />
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <AssessmentsList 
        assessments={assessments} 
        searchTerm={searchTerm}
        onViewAssessment={handleViewAssessment}
        onCloneAssessment={handleCloneAssessment}
        onEditAssessment={handleEditAssessment}
        onDeleteAssessment={handleDeleteClick}
      />
      
      {selectedAssessment && (
        <AssessmentDetailsDialog
          assessment={selectedAssessment}
          isOpen={!!selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
        />
      )}

      <DeleteConfirmationDialog
        isOpen={!!assessmentToDelete}
        onClose={() => setAssessmentToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={`Excluir Avaliação de ${assessmentToDelete?.patient_name || 'Paciente'}`}
        description="Esta ação é irreversível. Todos os dados da avaliação serão permanentemente removidos."
      />
    </div>
  );
};

export default HistoricoAvaliacoes;

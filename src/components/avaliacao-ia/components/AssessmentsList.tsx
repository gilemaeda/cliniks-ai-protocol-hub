import { Assessment } from '../types/assessment';
import EmptyState from './EmptyState';
import AssessmentCard from './AssessmentCard';

interface AssessmentsListProps {
  assessments: Assessment[];
  searchTerm: string;
  onViewAssessment: (assessment: Assessment) => void;
  onCloneAssessment?: (assessment: Assessment) => void;
  onEditAssessment?: (assessment: Assessment) => void;
  onDeleteAssessment?: (assessment: Assessment) => void;
}

const AssessmentsList = ({ 
  assessments, 
  searchTerm, 
  onViewAssessment,
  onCloneAssessment,
  onEditAssessment,
  onDeleteAssessment
}: AssessmentsListProps) => {
  const filteredAssessments = assessments.filter(assessment =>
    assessment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.assessment_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.main_complaint.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredAssessments.length === 0) {
    return <EmptyState hasSearchTerm={!!searchTerm} />;
  }

  return (
    <div className="grid gap-4">
      {filteredAssessments.map((assessment) => (
        <AssessmentCard 
          key={assessment.id} 
          assessment={assessment} 
          onView={() => onViewAssessment(assessment)}
          onClone={onCloneAssessment}
          onEdit={onEditAssessment}
          onDelete={onDeleteAssessment}
        />
      ))}
    </div>
  );
};

export default AssessmentsList;

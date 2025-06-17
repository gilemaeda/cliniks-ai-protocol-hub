import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, User, Calendar, Target, Edit, Copy, Trash2, MoreVertical } from 'lucide-react';
import { Assessment } from '../types/assessment';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AssessmentCardProps {
  assessment: Assessment;
  onView: () => void;
  onClone?: (assessment: Assessment) => void;
  onEdit?: (assessment: Assessment) => void;
  onDelete?: (assessment: Assessment) => void;
}

const AssessmentCard = ({ 
  assessment, 
  onView, 
  onClone, 
  onEdit, 
  onDelete 
}: AssessmentCardProps) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'facial':
        return 'bg-blue-100 text-blue-800';
      case 'corporal':
        return 'bg-green-100 text-green-800';
      case 'capilar':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'facial':
        return 'Facial';
      case 'corporal':
        return 'Corporal';
      case 'capilar':
        return 'Capilar';
      default:
        return type;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{assessment.patient_name}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className={getTypeColor(assessment.assessment_type)}>
              {getTypeLabel(assessment.assessment_type)}
            </Badge>
            {/* Menu apenas para mobile */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onView}>
                    <Eye className="h-4 w-4 mr-2" />
                    <span>Visualizar</span>
                  </DropdownMenuItem>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(assessment)}>
                      <Edit className="h-4 w-4 mr-2" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                  )}
                  {onClone && (
                    <DropdownMenuItem onClick={() => onClone(assessment)}>
                      <Copy className="h-4 w-4 mr-2" />
                      <span>Clonar</span>
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      className="text-red-600" 
                      onClick={() => onDelete(assessment)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span>Excluir</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span>{assessment.patient_age} anos</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{new Date(assessment.created_at).toLocaleDateString('pt-BR')}</span>
        </div>
        
        <div className="flex items-start space-x-2 text-sm text-gray-600">
          <Target className="h-4 w-4 mt-0.5" />
          <span className="line-clamp-2">{assessment.main_complaint}</span>
        </div>
      </CardContent>
      
      {/* Botões de ação visíveis */}
      <CardFooter className="flex flex-col space-y-2 pt-0">
        <Button 
          variant="default" 
          size="sm" 
          className="w-full"
          onClick={onView}
        >
          <Eye className="h-4 w-4 mr-2" />
          Visualizar
        </Button>
        
        <div className="hidden md:flex w-full justify-between space-x-2">
          {onEdit && (
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1"
              onClick={() => onEdit(assessment)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          
          {onClone && (
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1"
              onClick={() => onClone(assessment)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Clonar
            </Button>
          )}
          
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 text-red-600 hover:text-red-700"
              onClick={() => onDelete(assessment)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default AssessmentCard;

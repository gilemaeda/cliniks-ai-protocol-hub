
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

const AdminPlans = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
        Gestão de Planos
      </h3>
      
      <Card>
        <CardHeader>
          <CardTitle>Planos de Assinatura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p>Gestão de planos em desenvolvimento...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPlans;

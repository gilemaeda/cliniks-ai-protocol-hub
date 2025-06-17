
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag } from 'lucide-react';

const AdminCoupons = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
        Gestão de Cupons
      </h3>
      
      <Card>
        <CardHeader>
          <CardTitle>Cupons de Desconto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <Tag className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p>Gestão de cupons em desenvolvimento...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCoupons;
